const path = require("path");
const { Umzug, SequelizeStorage } = require("umzug");

// Builds the Umzug migrator used at server boot and by scripts/migrate.js.
// Migration files live in api/migrations/ and run in filename order.
// Executed migrations are recorded in the "SequelizeMeta" table so each one runs exactly once.
function createMigrator(sequelize) {
  return new Umzug({
    migrations: {
      glob: "migrations/*.js",
      // Resolve relative to the api/ package root regardless of process.cwd().
      cwd: path.join(__dirname, "..", ".."),
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
  });
}

module.exports = { createMigrator };
