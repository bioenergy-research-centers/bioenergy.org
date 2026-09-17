const path = require("path");
const { Umzug, SequelizeStorage } = require("umzug");

// Builds the Umzug migrator used at server boot and by scripts/migrate.js.
// Migration files live in api/migrations/ and run in filename order.
// Executed migrations are recorded in the "SequelizeMeta" table so each one runs exactly once.
//
// Each migration runs inside a single transaction. PostgreSQL DDL is transactional, so a
// failure part-way through a multi-statement migration rolls the whole thing back instead of
// leaving the schema half-changed with nothing recorded in SequelizeMeta, which would make
// every later boot fail on the retry. Migrations receive the transaction as `transaction`
// and must pass it to every query they issue.
function createMigrator(sequelize) {
  return new Umzug({
    migrations: {
      glob: "migrations/*.js",
      // Resolve relative to the api/ package root regardless of process.cwd().
      cwd: path.join(__dirname, "..", ".."),
      resolve: ({ name, path: migrationPath, context }) => {
        const migration = require(migrationPath);
        const inTransaction = (fn) => () =>
          sequelize.transaction((transaction) => fn({ name, path: migrationPath, context, transaction }));

        return {
          name,
          up: inTransaction(migration.up),
          down: inTransaction(migration.down),
        };
      },
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
  });
}

module.exports = { createMigrator };
