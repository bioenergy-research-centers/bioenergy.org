const db = require("../../app/models");
const { createMigrator } = require("../../app/db/migrator");

describe("createMigrator", () => {
  it("discovers migration files in filename order with up and down handlers", async () => {
    const migrator = createMigrator(db.sequelize);

    const migrations = await migrator.migrations();

    expect(migrations.length).toBeGreaterThan(0);
    const names = migrations.map((m) => m.name);
    expect(names).toContain("2026.08.11T00.00.00.baseline-datasets-table.js");
    expect(names).toEqual([...names].sort());
  });

  it("runs each migration inside a transaction and hands it to the migration", async () => {
    const transaction = { id: "tx" };
    const transactionSpy = vi
      .spyOn(db.sequelize, "transaction")
      .mockImplementation(async (fn) => fn(transaction));
    const query = vi.fn().mockResolvedValue(undefined);
    const queryInterface = { sequelize: { query } };

    const migrator = createMigrator(db.sequelize);
    const search = (await migrator.migrations(queryInterface)).find((m) =>
      m.name.includes("search-tsvector-and-index")
    );

    await search.up();

    expect(transactionSpy).toHaveBeenCalledTimes(1);
    // A migration that failed part-way would otherwise leave the schema half-applied
    // with nothing recorded, so every statement must be bound to that transaction.
    expect(query).toHaveBeenCalled();
    for (const [, options] of query.mock.calls) {
      expect(options).toEqual({ transaction });
    }

    vi.restoreAllMocks();
  });

  it("uses the provided sequelize connection for migration context", () => {
    const getQueryInterface = vi.spyOn(db.sequelize, "getQueryInterface");

    createMigrator(db.sequelize);

    expect(getQueryInterface).toHaveBeenCalled();
    getQueryInterface.mockRestore();
  });
});
