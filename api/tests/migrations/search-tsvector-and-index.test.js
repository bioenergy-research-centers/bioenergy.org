const migration = require("../../migrations/2026.08.11T00.10.00.search-tsvector-and-index");

// The migration issues raw SQL, so the test captures the statements and checks their
// shape. Behaviour of the DDL itself (matching, weighting, index use) is a PostgreSQL
// concern and is verified against a real database outside the unit suite.
function buildQueryInterface() {
  const query = vi.fn().mockResolvedValue(undefined);
  return { sequelize: { query }, query };
}

// Every JSON value path the column indexes. Adding a searchable field means adding it
// here as well, which keeps the field list a reviewed change.
const INDEXED_PATHS = [
  `"json"->>'title'`,
  `"json"->>'datasetName'`,
  `'$.keywords[*]'`,
  `'$.species[*].scientificName'`,
  `'$.species[*].strains[*]'`,
  `'$.creator[*].name'`,
  `'$.contributors[*].name'`,
  `"json"->>'identifier'`,
  `"json"->>'journal_name'`,
  `"json"->>'brc'`,
  `"json"->>'repository'`,
  `"json"->>'analysisType'`,
  `'$.topic[*]'`,
  `'$.theme[*]'`,
  `"json"->>'description'`,
  `"json"->>'abstract'`,
];

describe("search tsvector and index migration", () => {
  it("adds a stored generated search_tsv column, a GIN index, and the prefix query function", async () => {
    const queryInterface = buildQueryInterface();

    await migration.up({ context: queryInterface });

    const statements = queryInterface.query.mock.calls.map(([sql]) => sql);
    expect(statements).toHaveLength(3);

    const [addColumn, createIndex, createFunction] = statements;
    expect(addColumn).toMatch(/ALTER TABLE datasets ADD COLUMN search_tsv tsvector GENERATED ALWAYS AS \(/);
    expect(addColumn).toMatch(/\) STORED;/);
    expect(createIndex).toContain("CREATE INDEX datasets_search_tsv_gin ON datasets USING GIN (search_tsv)");
    expect(createFunction).toContain("CREATE OR REPLACE FUNCTION brc_prefix_tsquery(query_text text) RETURNS tsquery");
  });

  it("indexes each searchable field and nothing else", async () => {
    const queryInterface = buildQueryInterface();

    await migration.up({ context: queryInterface });

    const [addColumn] = queryInterface.query.mock.calls[0];

    for (const path of INDEXED_PATHS) {
      expect(addColumn).toContain(path);
    }
    // One setweight(...) per indexed path: no field slips in without being listed above.
    expect(addColumn.match(/setweight\(/g)).toHaveLength(INDEXED_PATHS.length);
  });

  it("pins the text search configuration so the expression is immutable", async () => {
    const queryInterface = buildQueryInterface();

    await migration.up({ context: queryInterface });

    const [addColumn] = queryInterface.query.mock.calls[0];
    const [createFunction] = queryInterface.query.mock.calls[2];

    // The one-argument to_tsvector(text) is only STABLE and is rejected in a generated
    // column, so every call must name the configuration explicitly.
    expect(addColumn.match(/to_tsvector\(/g)).toHaveLength(INDEXED_PATHS.length);
    expect(addColumn.match(/to_tsvector\('english',/g)).toHaveLength(INDEXED_PATHS.length);
    // The prefix function must be IMMUTABLE for the planner to fold it and use the index.
    expect(createFunction).toMatch(/LANGUAGE SQL IMMUTABLE STRICT/);
  });

  it("weights title highest and long prose lowest", async () => {
    const queryInterface = buildQueryInterface();

    await migration.up({ context: queryInterface });

    const [addColumn] = queryInterface.query.mock.calls[0];

    expect(addColumn).toMatch(/"json"->>'title',''\)\), 'A'\)/);
    expect(addColumn).toMatch(/"json"->>'description',''\)\), 'D'\)/);
    expect(addColumn).toMatch(/"json"->>'abstract',''\)\), 'D'\)/);
  });

  it("passes the transaction to every query in up and down", async () => {
    const transaction = { id: "tx" };

    const upInterface = buildQueryInterface();
    await migration.up({ context: upInterface, transaction });
    for (const [, options] of upInterface.query.mock.calls) {
      expect(options).toEqual({ transaction });
    }

    const downInterface = buildQueryInterface();
    await migration.down({ context: downInterface, transaction });
    for (const [, options] of downInterface.query.mock.calls) {
      expect(options).toEqual({ transaction });
    }
  });

  it("removes the index, column, and function on down", async () => {
    const queryInterface = buildQueryInterface();

    await migration.down({ context: queryInterface });

    const statements = queryInterface.query.mock.calls.map(([sql]) => sql);
    expect(statements).toEqual([
      "DROP INDEX IF EXISTS datasets_search_tsv_gin;",
      "ALTER TABLE datasets DROP COLUMN IF EXISTS search_tsv;",
      "DROP FUNCTION IF EXISTS brc_prefix_tsquery(text);",
    ]);
  });
});
