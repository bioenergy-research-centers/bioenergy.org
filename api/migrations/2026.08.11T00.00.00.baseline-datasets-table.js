const { DataTypes } = require("sequelize");

const TABLE_NAME = "datasets";

// Baseline migration establishing the datasets table previously created by
// sequelize.sync({ alter: { drop: false } }) at server boot.
// Existing deployments already have the table, so the baseline adopts it as-is;
// fresh environments get the same shape the model has always produced.
// See api/app/models/dataset.model.js for the model definition this mirrors.
async function up({ context: queryInterface }) {
  const tables = await queryInterface.showAllTables();
  if (tables.includes(TABLE_NAME)) {
    // Pre-migration deployment: adopt the existing table without touching it.
    return;
  }

  await queryInterface.createTable(TABLE_NAME, {
    uid: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
    },
    schema_version: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "0.0.8",
    },
    json: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });
}

// Reverting the baseline drops the datasets table and all imported records.
// Only reachable through an explicit `npm run migrate:down`; nightly imports can rebuild the catalog.
async function down({ context: queryInterface }) {
  await queryInterface.dropTable(TABLE_NAME);
}

module.exports = { up, down };
