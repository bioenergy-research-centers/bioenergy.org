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

  it("uses the provided sequelize connection for migration context", () => {
    const getQueryInterface = vi.spyOn(db.sequelize, "getQueryInterface");

    createMigrator(db.sequelize);

    expect(getQueryInterface).toHaveBeenCalled();
    getQueryInterface.mockRestore();
  });
});
