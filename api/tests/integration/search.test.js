// End-to-end tests for dataset text search against a real PostgreSQL.
//
// The unit tests mock the database, so they can assert which query is sent but never what
// comes back. Search behaviour now lives in PostgreSQL (the generated search_tsv column,
// websearch_to_tsquery, brc_prefix_tsquery, ts_rank_cd), which is exactly the part a mock
// cannot reach. These tests load a handful of records through the real model into a
// migrated database (see support/database.js) and assert on the results that come back
// from the real service and the real HTTP route. See README.md "Testing" for how to run it.

const request = require("supertest");
const db = require("../../app/models");
const datasetsService = require("../../app/services/datasetsService");
const datasetRoutes = require("../../app/routes/dataset.routes");
const { createApp } = require("../helpers/createApp");
const { loadDatasets, closeDatabase } = require("./support/database");

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
  ["MANY_AUTHORS", {
    // The matching author is fifth, past the three the results list shows, and the only
    // description match is mid-text, so its snippet is cut at both ends.
    title: "Miscanthus field trials",
    date: "2019-01-01",
    description:
      "Plots were planted in spring and harvested in autumn across four sites in the upper " +
      "Midwest over three seasons. Yields of miscanthus were recorded weekly. Soil samples " +
      "were taken monthly and stored frozen for later analysis by the partner laboratories.",
    creator: ["Ana Ames", "Ben Bose", "Cy Chu", "Di Diaz", "Quillon Vasquez"].map((name) => ({ name })),
  }],
  ["EVERY_FIELD", {
    // One made-up word per indexed field, so each query below matches this record through
    // exactly one field. The abstract differs from the description on purpose.
    title: "Quollfield survey",
    date: "2018-01-01",
    datasetName: "Quokkaset series",
    description: "Tarsierdesc measurements.",
    abstract: "Possumabstract measurements.",
    keywords: ["wombatword"],
    species: [{ scientificName: "Numbatus fakeus", strains: ["dingostrain"] }],
    creator: [{ name: "Cuscus Creatorson" }],
    contributors: [{ name: "Bandicoot Helper" }],
    identifier: "GSE999001",
    journal_name: "Echidna Letters",
    repository: "Wallaby Archive",
    analysisType: "Bilbyomics",
    topic: ["Kookatopic"],
    theme: ["Emutheme"],
  }],
  ["LONG_TITLE", {
    // Some feeds put a whole abstract in the title; a marked title is cut like a snippet.
    title: `${"Samples were collected and stored before analysis. ".repeat(4)}` +
      "Platypusine content rose sharply in the treated plots. " +
      `${"Results were compared across all sites and seasons. ".repeat(4)}`,
    date: "2017-01-01",
  }],
  // Unsupported schema version: excluded from every search by the supportedOnly scope.
  ["LEGACY_LIGNIN", { title: "Lignin legacy record", date: "2020-01-01" }, "0.0.8"],
];

const SUPPORTED_COUNT = RECORDS.filter(([, , version]) => version !== "0.0.8").length;

// Every search names a response shape (required since #264); list items carry the uid.
async function search(params) {
  const result = await datasetsService.searchLocalDatasets({ shape: "list-item", ...params });
  return result.items.map((item) => item.uid);
}

let app;

beforeAll(async () => {
  await loadDatasets(
    RECORDS.map(([uid, json, schema_version = "0.2.0"]) => ({
      uid,
      schema_version,
      json: { identifier: uid, brc: "JBEI", creator: CREATOR, ...json },
    }))
  );

  app = createApp();
  app.use("/api/datasets", datasetRoutes);
});

afterAll(closeDatabase);

describe("search schema", () => {
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
      shape: "list-item",
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
    // Facets are fetched separately from search results since #269.
    const facets = await datasetsService.getLocalDatasetFacets({ textQueryTerm: "ethanol" });

    const names = facets.personName.map((facet) => facet.value);
    expect(names).toContain("Dana Contributor");
    expect(names).toContain("Alex Creator");
  });
});

describe("highlights", () => {
  // Highlights for each result of a text query, keyed by uid.
  async function highlights(textQueryTerm, params = {}) {
    const result = await datasetsService.searchLocalDatasets({
      textQueryTerm,
      shape: "list-item",
      highlight: true,
      ...params,
    });
    return Object.fromEntries(result.items.map((item) => [item.uid, item.highlights]));
  }

  it("mark matched words in the title, including prefix matches", async () => {
    const found = await highlights("ligni");

    expect(found.LIGNIN_TITLE.title).toBe("<mark>Lignin</mark> degradation in switchgrass");
    // Its title does not match, so only the abstract passage is returned.
    expect(found.LIGNIN_ABSTRACT).not.toHaveProperty("title");
    expect(found.LIGNIN_ABSTRACT.snippetField).toBe("abstract");
    expect(found.LIGNIN_ABSTRACT.snippet).toContain("<mark>lignin</mark>");
  });

  it("mark stemmed matches", async () => {
    const found = await highlights("fermentations");

    expect(found.ETHANOL_CORN.title).toBe("Ethanol <mark>fermentation</mark> from corn stover");
  });

  it("do not mark excluded terms", async () => {
    // ETHANOL_CORN matches through "ethanol"; "corn" is excluded and must stay unmarked.
    const found = await highlights("ethanol OR biomass -corn");

    expect(found.ETHANOL_CORN.title).toBe("<mark>Ethanol</mark> fermentation from corn stover");
  });

  it("cut a title too long for the list to one passage around the match", async () => {
    const found = await highlights("platypusine");
    const title = found.LONG_TITLE.title;

    expect(title).toMatch(/^… .*<mark>Platypusine<\/mark>.* …$/);
    expect(title.replace(/<\/?mark>/g, "").length).toBeLessThan(160);
  });

  it("name a matching author even when the list would hide them", async () => {
    const found = await highlights("vasquez");

    expect(found.MANY_AUTHORS).toEqual({ creators: ["Quillon Vasquez"] });
  });

  it("name a matching contributor, who is not otherwise shown in the list", async () => {
    const found = await highlights("dana");

    expect(found.ETHANOL_BIOMASS.contributors).toEqual(["Dana Contributor"]);
  });

  it("mark each field's part of a query whose terms match in different fields", async () => {
    const found = await highlights("lignin alex");

    expect(found.LIGNIN_TITLE.title).toBe("<mark>Lignin</mark> degradation in switchgrass");
    expect(found.LIGNIN_TITLE.creators).toEqual(["Alex Creator"]);
  });

  it("cut a long description to the passage around the match, with ellipses", async () => {
    const { snippet, snippetField } = (await highlights("miscanthus")).MANY_AUTHORS;

    expect(snippetField).toBe("description");
    expect(snippet).toContain("<mark>miscanthus</mark>");
    expect(snippet.startsWith("… ")).toBe(true);
    expect(snippet.endsWith(" …")).toBe(true);
  });

  // For each indexed field: a query that matches EVERY_FIELD only through that field, and the
  // highlights key that must explain the match.
  const FIELD_CASES = {
    title: ["quollfield", (h) => h.title],
    description: ["tarsierdesc", (h) => h.snippetField === "description" && h.snippet],
    abstract: ["possumabstract", (h) => h.snippetField === "abstract" && h.snippet],
    "creator.name": ["cuscus", (h) => h.creators],
    "contributors.name": ["bandicoot", (h) => h.contributors],
    datasetName: ["quokkaset", (h) => h.matchedIn?.datasetName],
    keywords: ["wombatword", (h) => h.matchedIn?.keywords],
    "species.scientificName": ["numbatus", (h) => h.matchedIn?.species],
    "species.strains": ["dingostrain", (h) => h.matchedIn?.strains],
    identifier: ["GSE999001", (h) => h.matchedIn?.identifier],
    journal_name: ["echidna", (h) => h.matchedIn?.journal_name],
    brc: ["JBEI", (h) => h.matchedIn?.brc],
    repository: ["wallaby", (h) => h.matchedIn?.repository],
    analysisType: ["bilbyomics", (h) => h.matchedIn?.analysisType],
    topic: ["kookatopic", (h) => h.matchedIn?.topic],
    theme: ["emutheme", (h) => h.matchedIn?.theme],
  };

  it("cover every field the search index reads", async () => {
    // Read the field list from the live generated column, so a field added to the index by
    // any migration fails here until highlighting covers it.
    const [[{ expression }]] = await db.sequelize.query(`
      SELECT pg_get_expr(d.adbin, d.adrelid) AS expression
      FROM pg_attrdef d
      JOIN pg_attribute a ON a.attrelid = d.adrelid AND a.attnum = d.adnum
      WHERE a.attrelid = 'datasets'::regclass AND a.attname = 'search_tsv'`);
    const scalarFields = [...expression.matchAll(/->> '(\w+)'/g)].map((m) => m[1]);
    const pathFields = [...expression.matchAll(/'\$\.([^']*)'::jsonpath/g)]
      .map((m) => m[1].replaceAll('"', "").replaceAll("[*]", ""));

    expect([...new Set([...scalarFields, ...pathFields])].sort()).toEqual(Object.keys(FIELD_CASES).sort());
  });

  it.each(Object.entries(FIELD_CASES))("explain a match through %s", async (_field, [query, explained]) => {
    const found = await highlights(query);

    expect(found).toHaveProperty("EVERY_FIELD");
    expect(explained(found.EVERY_FIELD), JSON.stringify(found.EVERY_FIELD)).toBeTruthy();
  });

  it("list each matched value once, marked", async () => {
    const found = await highlights("wombatword OR kookatopic");

    expect(found.EVERY_FIELD.matchedIn).toEqual({
      keywords: ["<mark>wombatword</mark>"],
      topic: ["<mark>Kookatopic</mark>"],
    });
  });

  it("are left out unless requested, and for the detail shape", async () => {
    const plain = await datasetsService.searchLocalDatasets({
      textQueryTerm: "lignin",
      shape: "list-item",
    });
    expect(plain.items[0]).not.toHaveProperty("highlights");

    const detail = await datasetsService.searchLocalDatasets({
      textQueryTerm: "lignin",
      shape: "detail",
      highlight: true,
    });
    expect(detail.items[0]).not.toHaveProperty("highlights");
  });
});

describe("GET /api/datasets", () => {
  it("returns 200 for the inputs that used to return 500", async () => {
    for (const q of ["(cellulose", "1:1"]) {
      const response = await request(app).get("/api/datasets").query({ q, shape: "list-item" });
      expect(response.status, q).toBe(200);
    }
  });

  it("returns ranked results for a text query", async () => {
    const response = await request(app)
      .get("/api/datasets")
      .query({ q: "lignin", shape: "list-item" });

    expect(response.status).toBe(200);
    expect(response.body.totalResults).toBe(2);
    expect(response.body.items.map((item) => item.uid)).toEqual(["LIGNIN_TITLE", "LIGNIN_ABSTRACT"]);
  });

  it("returns highlights when asked for them", async () => {
    const response = await request(app)
      .get("/api/datasets")
      .query({ q: "lignin", shape: "list-item", highlight: true });

    expect(response.status).toBe(200);
    expect(response.body.items[0].highlights.title).toBe("<mark>Lignin</mark> degradation in switchgrass");
  });

  it("returns no results for a schema key name", async () => {
    const response = await request(app)
      .get("/api/datasets")
      .query({ q: "primaryContact", shape: "list-item" });

    expect(response.status).toBe(200);
    expect(response.body.totalResults).toBe(0);
  });
});
