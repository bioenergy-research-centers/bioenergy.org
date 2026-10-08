// Migrations against a real PostgreSQL: the schema they build matches the model, re-running
// them is harmless, overlapping runs do not collide, and the server's startup check notices
// anything left pending.
//
// The migrations are the only thing that changes the schema; the server no longer runs
// sequelize.sync() at boot. So a model attribute added without a migration would reach no
// environment, and the first test below is what fails when that happens.

const db = require("../../app/models");
const { createMigrator, runMigrations, assertNoPendingMigrations } = require("../../app/db/migrator");
const { loadDatasets, closeDatabase } = require("./support/database");

// Columns the migrations add that the model deliberately does not declare.
const MIGRATION_ONLY_COLUMNS = ["search_tsv"];

// The model and describeTable() spell one type two ways.
const normaliseType = (type) => type.replace(/^VARCHAR/, "CHARACTER VARYING");

beforeAll(async () => {
  await loadDatasets([
    { uid: "JBEI_1", schema_version: "0.2.0", json: { identifier: "1", brc: "JBEI", title: "Lignin" } },
    { uid: "JBEI_2", schema_version: "0.2.0", json: { identifier: "2", brc: "JBEI", title: "Switchgrass" } },
  ]);
});

afterAll(closeDatabase);

describe("migrated schema", () => {
  it("has every column the model declares, with the same type, nullability and key", async () => {
    const columns = await db.sequelize.getQueryInterface().describeTable("datasets");

    for (const [name, attribute] of Object.entries(db.datasets.getAttributes())) {
      expect(columns, `column ${name} (add a migration for it)`).toHaveProperty(name);
      expect(columns[name].type, name).toBe(normaliseType(attribute.type.toSql()));
      expect(columns[name].allowNull, name).toBe(attribute.allowNull !== false);
      expect(columns[name].primaryKey, name).toBe(Boolean(attribute.primaryKey));
    }
  });

  it("has no columns beyond the model's and the migration-owned ones", async () => {
    const columns = await db.sequelize.getQueryInterface().describeTable("datasets");

    const expected = [...Object.keys(db.datasets.getAttributes()), ...MIGRATION_ONLY_COLUMNS];
    expect(Object.keys(columns).sort()).toEqual(expected.sort());
  });
});

describe("runMigrations", () => {
  it("applies nothing when the database is up to date", async () => {
    await expect(runMigrations(db.sequelize)).resolves.toEqual([]);
  });

  it("reverts and re-applies every migration without losing data", async () => {
    const migrator = createMigrator(db.sequelize);
    const all = (await migrator.migrations()).map((m) => m.name);

    await migrator.down({ to: 0 });
    // The baseline adopts the existing table on the way back up, as it did in production.
    const applied = await runMigrations(db.sequelize);

    expect(applied.map((m) => m.name)).toEqual(all);
    const [[{ count }]] = await db.sequelize.query("SELECT count(*)::int AS count FROM datasets");
    expect(count).toBe(2);
  });

  it("applies each migration once when two runs overlap", async () => {
    const migrator = createMigrator(db.sequelize);
    await migrator.down({ to: 0 });

    // Without the advisory lock both runs would see the same pending list and the second
    // would fail adding a column the first had just added.
    const [first, second] = await Promise.all([
      runMigrations(db.sequelize),
      runMigrations(db.sequelize),
    ]);

    const appliedNames = [...first, ...second].map((m) => m.name);
    expect(appliedNames).toEqual((await migrator.migrations()).map((m) => m.name));
    expect(await migrator.pending()).toEqual([]);
  });
});

describe("startup check", () => {
  it("refuses to start while a migration is pending, and passes once it is applied", async () => {
    const migrator = createMigrator(db.sequelize);

    await migrator.down();
    await expect(assertNoPendingMigrations(db.sequelize)).rejects.toThrow(
      /search-tsvector-and-index.*npm run migrate/
    );

    await runMigrations(db.sequelize);
    await expect(assertNoPendingMigrations(db.sequelize)).resolves.toBeUndefined();
  });
});
