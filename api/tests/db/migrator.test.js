const db = require("../../app/models");
const {
  createMigrator,
  runMigrations,
  assertNoPendingMigrations,
  MIGRATION_LOCK_ID,
} = require("../../app/db/migrator");

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

describe("runMigrations", () => {
  function mockLockTransaction() {
    const lock = { commit: vi.fn(), rollback: vi.fn() };
    vi.spyOn(db.sequelize, "transaction").mockResolvedValue(lock);
    const query = vi.spyOn(db.sequelize, "query").mockResolvedValue([]);
    return { lock, query };
  }

  afterEach(() => vi.restoreAllMocks());

  it("takes the advisory lock before applying migrations and releases it after", async () => {
    const { lock, query } = mockLockTransaction();
    const applied = [{ name: "2026.08.11T00.10.00.search-tsvector-and-index.js" }];
    const migrator = { up: vi.fn().mockResolvedValue(applied) };

    await expect(runMigrations(db.sequelize, migrator)).resolves.toBe(applied);

    expect(query).toHaveBeenCalledWith("SELECT pg_advisory_xact_lock(:id)", {
      replacements: { id: MIGRATION_LOCK_ID },
      transaction: lock,
    });
    expect(query.mock.invocationCallOrder[0]).toBeLessThan(migrator.up.mock.invocationCallOrder[0]);
    expect(lock.commit).toHaveBeenCalledTimes(1);
    expect(lock.rollback).not.toHaveBeenCalled();
  });

  it("releases the lock and rethrows when a migration fails", async () => {
    const { lock } = mockLockTransaction();
    const migrator = { up: vi.fn().mockRejectedValue(new Error("column already exists")) };

    await expect(runMigrations(db.sequelize, migrator)).rejects.toThrow("column already exists");

    expect(lock.rollback).toHaveBeenCalledTimes(1);
    expect(lock.commit).not.toHaveBeenCalled();
  });
});

describe("assertNoPendingMigrations", () => {
  it("resolves when every migration has been applied", async () => {
    const migrator = { pending: vi.fn().mockResolvedValue([]) };

    await expect(assertNoPendingMigrations(db.sequelize, migrator)).resolves.toBeUndefined();
  });

  it("rejects, naming the migrations and the command to run, when any are pending", async () => {
    const migrator = {
      pending: vi.fn().mockResolvedValue([
        { name: "2026.08.11T00.10.00.search-tsvector-and-index.js" },
      ]),
    };

    await expect(assertNoPendingMigrations(db.sequelize, migrator)).rejects.toThrow(
      "Pending database migrations: 2026.08.11T00.10.00.search-tsvector-and-index.js. Run `npm run migrate` before starting the server."
    );
  });
});
