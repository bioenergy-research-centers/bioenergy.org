// End-to-end tests for dataset text search against a real PostgreSQL.
//
// The unit tests mock the database, so they can assert which query is sent but never what
// comes back. Search behaviour now lives in PostgreSQL (the generated search_tsv column,
// websearch_to_tsquery, brc_prefix_tsquery, ts_rank_cd), which is exactly the part a mock
// cannot reach. These tests apply the migrations, boot the schema the way server.js does,
// load a handful of records through the real model, and assert on the results that come
// back from the real service and the real HTTP route.
//
// The suite drops and recreates the datasets table, so it refuses to run unless
// BIOENERGY_ORG_DB_NAME ends in "_test". See README.md "Testing" for how to run it.

const DB_NAME = process.env.BIOENERGY_ORG_DB_NAME || "";
if (!DB_NAME.endsWith("_test")) {
  throw new Error(
    `Refusing to run integration tests against database "${DB_NAME}": ` +
      `BIOENERGY_ORG_DB_NAME must end in "_test" because this suite drops the datasets table.`
  );
}

const request = require("supertest");
const db = require("../../app/models");
const { createMigrator, assertNoPendingMigrations } = require("../../app/db/migrator");
const datasetsService = require("../../app/services/datasetsService");
const datasetRoutes = require("../../app/routes/dataset.routes");
const { createApp } = require("../helpers/createApp");

// Every record has a creator with a primaryContact key, so the key name is present in
// every document. "primaryContact" must still match nothing.
const CREATOR = [{ name: "Alex Creator", primaryContact: true, email: "alex@example.org" }];

// [uid, json, schema_version]. Titles and dates are chosen so each assertion below has one
// unambiguous reading: which records match, and in which order.
const RECORDS = [
  ["LIGNIN_TITLE", {
    title: "Lignin degradation in switchgrass",
    date: "2024-03-01",
    abstract: "Enzymatic breakdown of lignin polymers in switchgrass.",
    species: [{ scientificName: "Escherichia coli", strains: ["K-12 MG1655"] }],
  }],
  ["LIGNIN_ABSTRACT", {
    // Newer than LIGNIN_TITLE, but only mentions lignin in the abstract. Relevance must
    // rank it second; the old date ordering would have put it first.
    title: "Cellulose yield after pretreatment",
    date: "2025-06-01",
    abstract: "Residual lignin was measured after each pretreatment.",
  }],
  ["CELL_WALL_PHRASE", { title: "Cell wall composition of sorghum", date: "2023-01-01" }],
  ["CELL_AND_WALL", { title: "Wall thickness of yeast cells", date: "2023-02-01" }],
  // Singular in the document. The plural query below can only match through stemming,
  // not through prefix matching ("fermentations:*" does not match "fermentation").
  ["ETHANOL_CORN", { title: "Ethanol fermentation from corn stover", date: "2022-01-01" }],
  ["ETHANOL_BIOMASS", {
    title: "Ethanol production from woody biomass",
    date: "2022-02-01",
    contributors: [{ name: "Dana Contributor", contributorType: "DataManager" }],
  }],
  ["NULL_SPECIES", {
    // Schema-valid nulls: the generated column and the facet query must not choke on them.
    title: "Soil microbiome survey",
    date: "2021-01-01",
    species: null,
    contributors: null,
    datasetName: "Prairie soil series",
    journal_name: "Pedobiologia",
  }],
  // Unsupported schema version: excluded from every search by the supportedOnly scope.
  ["LEGACY_LIGNIN", { title: "Lignin legacy record", date: "2020-01-01" }, "0.0.8"],
];

const SUPPORTED_COUNT = RECORDS.filter(([, , version]) => version !== "0.0.8").length;

async function search(params) {
  const result = await datasetsService.searchLocalDatasets({ nofacets: true, ...params });
  return result.items.map((item) => item.uid);
}

let app;

beforeAll(async () => {
  await db.sequelize.authenticate();

  // Start from nothing so the run does not depend on what a previous one left behind.
  await db.sequelize.query('DROP TABLE IF EXISTS datasets, "SequelizeMeta" CASCADE');
  await db.sequelize.query("DROP FUNCTION IF EXISTS brc_prefix_tsquery(text)");

  // The documented deploy sequence: migrate, then what server.js does at boot.
  await createMigrator(db.sequelize).up();
  await db.sequelize.sync({ alter: { drop: false } });
  await assertNoPendingMigrations(db.sequelize);

  await db.datasets.bulkCreate(
    RECORDS.map(([uid, json, schema_version = "0.2.0"]) => ({
      uid,
      schema_version,
      json: { identifier: uid, brc: "JBEI", creator: CREATOR, ...json },
    }))
  );

  app = createApp();
  app.use("/api/datasets", datasetRoutes);
});

afterAll(async () => {
  await db.sequelize.close();
});

describe("schema after migrate + sync", () => {
  it("has the generated search column, its GIN index and the prefix function", async () => {
    const columns = await db.sequelize.getQueryInterface().describeTable("datasets");
    expect(columns).toHaveProperty("search_tsv");

    const [indexes] = await db.sequelize.query(
      "SELECT indexname FROM pg_indexes WHERE tablename = 'datasets'"
    );
    expect(indexes.map((row) => row.indexname)).toContain("datasets_search_tsv_gin");

    const [[{ exists }]] = await db.sequelize.query(
      "SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'brc_prefix_tsquery') AS exists"
    );
    expect(exists).toBe(true);
  });

  it("survives another sync({ alter }) at boot untouched", async () => {
    await db.sequelize.sync({ alter: { drop: false } });

    const columns = await db.sequelize.getQueryInterface().describeTable("datasets");
    expect(columns).toHaveProperty("search_tsv");
  });

  it("computed the search column for a record with null species and contributors", async () => {
    const [[row]] = await db.sequelize.query(
      "SELECT search_tsv IS NOT NULL AS computed FROM datasets WHERE uid = 'NULL_SPECIES'"
    );
    expect(row.computed).toBe(true);
  });

  it("lets the planner use the GIN index for a prefix query", async () => {
    // Forcing the planner away from a sequential scan proves the query shape and the
    // IMMUTABLE prefix function are index-compatible; on seven rows it would not choose
    // the index on its own.
    const [plan] = await db.sequelize.transaction(async (transaction) => {
      await db.sequelize.query("SET LOCAL enable_seqscan = off", { transaction });
      return db.sequelize.query(
        "EXPLAIN SELECT uid FROM datasets WHERE search_tsv @@ brc_prefix_tsquery('lignin')",
        { transaction }
      );
    });
    expect(plan.map((row) => row["QUERY PLAN"]).join("\n")).toContain("datasets_search_tsv_gin");
  });
});

describe("plain terms", () => {
  it("match as prefixes, so a partial word finds the full one", async () => {
    expect(await search({ textQueryTerm: "ligni" })).toEqual(["LIGNIN_TITLE", "LIGNIN_ABSTRACT"]);
  });

  it("rank a title match above a newer record that only matches in the abstract", async () => {
    expect(await search({ textQueryTerm: "lignin" })).toEqual(["LIGNIN_TITLE", "LIGNIN_ABSTRACT"]);
  });

  it("are stemmed, so a plural query finds the singular word", async () => {
    expect(await search({ textQueryTerm: "fermentations" })).toEqual(["ETHANOL_CORN"]);
  });

  it("must all match", async () => {
    expect(await search({ textQueryTerm: "ethanol corn" })).toEqual(["ETHANOL_CORN"]);
  });

  it("do not match JSON key names", async () => {
    const result = await datasetsService.searchLocalDatasets({
      textQueryTerm: "primaryContact",
      nofacets: true,
    });
    expect(result.totalResults).toBe(0);
    expect(result.items).toEqual([]);
  });

  it("find datasetName, journal_name and species strains", async () => {
    expect(await search({ textQueryTerm: "prairie" })).toEqual(["NULL_SPECIES"]);
    expect(await search({ textQueryTerm: "pedobiologia" })).toEqual(["NULL_SPECIES"]);
    expect(await search({ textQueryTerm: "MG1655" })).toEqual(["LIGNIN_TITLE"]);
  });
});

describe("operators", () => {
  it("match a quoted phrase only where the words are adjacent", async () => {
    const unquoted = await search({ textQueryTerm: "cell wall" });
    expect(unquoted).toEqual(expect.arrayContaining(["CELL_WALL_PHRASE", "CELL_AND_WALL"]));

    expect(await search({ textQueryTerm: '"cell wall"' })).toEqual(["CELL_WALL_PHRASE"]);
  });

  it("treat OR and | as alternation", async () => {
    const expected = expect.arrayContaining(["ETHANOL_CORN", "ETHANOL_BIOMASS"]);
    for (const query of ["corn OR biomass", "corn or biomass", "corn | biomass"]) {
      const uids = await search({ textQueryTerm: query });
      expect(uids, query).toEqual(expected);
      expect(uids, query).toHaveLength(2);
    }
  });

  it("treat -, NOT and ! as exclusion", async () => {
    for (const query of ["ethanol -corn", "ethanol NOT corn", "ethanol ! corn"]) {
      expect(await search({ textQueryTerm: query }), query).toEqual(["ETHANOL_BIOMASS"]);
    }
  });

  it("search hyphenated words literally rather than as exclusions", async () => {
    expect(await search({ textQueryTerm: "K-12" })).toEqual(["LIGNIN_TITLE"]);
  });

  it("do not apply prefix matching once an operator is present (documented limitation)", async () => {
    expect(await search({ textQueryTerm: "ligni OR cellul" })).toEqual([]);
  });
});

describe("malformed input", () => {
  it.each(["(cellulose", "1:1", '")', "lignin AND", "OR", "!", "the"])(
    "returns normally for %j instead of a database error",
    async (query) => {
      await expect(search({ textQueryTerm: query })).resolves.toBeInstanceOf(Array);
    }
  );
});

describe("browsing and scope", () => {
  it("orders by date, newest first, when there is no search term", async () => {
    const uids = await search({});
    expect(uids[0]).toBe("LIGNIN_ABSTRACT");
    expect(uids).toHaveLength(SUPPORTED_COUNT);
  });

  it("excludes unsupported schema versions from search results", async () => {
    expect(await search({ textQueryTerm: "lignin" })).not.toContain("LEGACY_LIGNIN");
  });

  it("builds facets from the filtered set, including contributor-only names", async () => {
    const result = await datasetsService.searchLocalDatasets({ textQueryTerm: "ethanol" });

    const names = result.facets.personName.map((facet) => facet.value);
    expect(names).toContain("Dana Contributor");
    expect(names).toContain("Alex Creator");
  });
});

describe("GET /api/datasets", () => {
  it("returns 200 for the inputs that used to return 500", async () => {
    for (const q of ["(cellulose", "1:1"]) {
      const response = await request(app).get("/api/datasets").query({ q, nofacets: true });
      expect(response.status, q).toBe(200);
    }
  });

  it("returns ranked results for a text query", async () => {
    const response = await request(app)
      .get("/api/datasets")
      .query({ q: "lignin", nofacets: true });

    expect(response.status).toBe(200);
    expect(response.body.totalResults).toBe(2);
    expect(response.body.items.map((item) => item.uid)).toEqual(["LIGNIN_TITLE", "LIGNIN_ABSTRACT"]);
  });

  it("returns no results for a schema key name", async () => {
    const response = await request(app)
      .get("/api/datasets")
      .query({ q: "primaryContact", nofacets: true });

    expect(response.status).toBe(200);
    expect(response.body.totalResults).toBe(0);
  });
});

describe("startup check", () => {
  it("refuses to start while a migration is pending, and passes once it is applied", async () => {
    const migrator = createMigrator(db.sequelize);

    await migrator.down();
    await expect(assertNoPendingMigrations(db.sequelize)).rejects.toThrow(
      /search-tsvector-and-index.*npm run migrate/
    );

    await migrator.up();
    await expect(assertNoPendingMigrations(db.sequelize)).resolves.toBeUndefined();
  });
});
