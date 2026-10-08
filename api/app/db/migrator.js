const path = require("path");
const { Umzug, SequelizeStorage } = require("umzug");

// Builds the Umzug migrator used by scripts/migrate.js and the server's startup check.
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

// Every process that migrates this database takes the same PostgreSQL advisory lock first,
// so two runs that overlap (a deploy and someone running `npm run migrate` by hand, say)
// apply each migration once instead of racing to apply it twice. The value is arbitrary;
// it only has to be the same everywhere.
const MIGRATION_LOCK_ID = 257001;

// Applies every pending migration and returns the ones it applied. Deploys run this through
// the one-shot `migrate` service in docker-compose.yml before the api starts.
//
// The lock is transaction-scoped, so PostgreSQL releases it when the holding transaction ends
// or its connection drops, even if this process dies part-way. The migrations themselves run
// in their own transactions on other pool connections while this one waits.
async function runMigrations(sequelize, migrator = createMigrator(sequelize)) {
  const lock = await sequelize.transaction();
  try {
    await sequelize.query("SELECT pg_advisory_xact_lock(:id)", {
      replacements: { id: MIGRATION_LOCK_ID },
      transaction: lock,
    });
    const applied = await migrator.up();
    await lock.commit();
    return applied;
  } catch (err) {
    await lock.rollback();
    throw err;
  }
}

// The server checks this at startup and refuses to serve against a schema the code does not
// expect, instead of failing later at request time (for example a text search against a
// column that does not exist yet). Normally nothing is pending, because `docker compose up`
// runs the migrate service first; this catches an api started some other way.
async function assertNoPendingMigrations(sequelize, migrator = createMigrator(sequelize)) {
  const pending = await migrator.pending();
  if (pending.length > 0) {
    const names = pending.map((m) => m.name).join(", ");
    throw new Error(`Pending database migrations: ${names}. Run \`npm run migrate\` before starting the server.`);
  }
}

module.exports = { createMigrator, runMigrations, assertNoPendingMigrations, MIGRATION_LOCK_ID };
