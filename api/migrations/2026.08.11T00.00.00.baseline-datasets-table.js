const { DataTypes } = require("sequelize");

const TABLE_NAME = "datasets";

// Baseline migration establishing the datasets table previously created by
// sequelize.sync({ alter: { drop: false } }) at server boot.
// Existing deployments already have the table, so the baseline adopts it as-is;
// fresh environments get the same shape the model has always produced.
// See api/app/models/dataset.model.js for the model definition this mirrors.
async function up({ context: queryInterface, transaction }) {
  const tables = await queryInterface.showAllTables({ transaction });
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
  }, { transaction });
}

// The baseline has no meaningful revert. Before it, the table was created by
// sequelize.sync() at boot, so "before the baseline" is not a state anyone deploys to.
// Dropping the table here would make a second `npm run migrate:down` delete the whole
// catalogue, so down is a deliberate no-op. Use `migrate:down --to <name>` for real reverts.
async function down() {
  console.log("Baseline migration down is a no-op; the datasets table is left in place.");
}

module.exports = { up, down };
