const baseline = require("../../migrations/2026.08.11T00.00.00.baseline-datasets-table");

function buildQueryInterface({ existingTables = [] } = {}) {
  return {
    showAllTables: vi.fn().mockResolvedValue(existingTables),
    createTable: vi.fn().mockResolvedValue(undefined),
    dropTable: vi.fn().mockResolvedValue(undefined),
  };
}

describe("baseline datasets table migration", () => {
  it("adopts an existing datasets table without modifying it", async () => {
    const queryInterface = buildQueryInterface({ existingTables: ["datasets"] });

    await baseline.up({ context: queryInterface });

    expect(queryInterface.createTable).not.toHaveBeenCalled();
  });

  it("creates the datasets table on a fresh database", async () => {
    const queryInterface = buildQueryInterface();

    await baseline.up({ context: queryInterface });

    expect(queryInterface.createTable).toHaveBeenCalledTimes(1);

    const [tableName, columns] = queryInterface.createTable.mock.calls[0];
    expect(tableName).toBe("datasets");
    expect(Object.keys(columns)).toEqual([
      "uid",
      "schema_version",
      "json",
      "createdAt",
      "updatedAt",
    ]);
    expect(columns.uid.primaryKey).toBe(true);
    expect(columns.uid.allowNull).toBe(false);
    expect(columns.schema_version.defaultValue).toBe("0.0.8");
    expect(columns.json.allowNull).toBe(false);
  });

  it("drops the datasets table on down", async () => {
    const queryInterface = buildQueryInterface({ existingTables: ["datasets"] });

    await baseline.down({ context: queryInterface });

    expect(queryInterface.dropTable).toHaveBeenCalledWith("datasets");
  });
});
