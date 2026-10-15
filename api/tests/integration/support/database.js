// Shared database setup and teardown for the integration suites in tests/integration/.
//
// globalSetup.js calls prepareDatabase() once per run: it wipes the test database and applies
// every migration, the same way a deploy does. Each test file then loads its own records with
// loadDatasets() in beforeAll and calls closeDatabase() in afterAll. Files run one at a time
// (see vitest.integration.config.js), so a file always sees only the records it loaded.

const db = require("../../../app/models");
const { runMigrations } = require("../../../app/db/migrator");

// prepareDatabase() drops everything in the database, so it only runs against a database
// whose name says it is for tests.
function assertTestDatabase(name = process.env.BIOENERGY_ORG_DB_NAME || "") {
  if (!name.endsWith("_test")) {
    throw new Error(
      `Refusing to run integration tests against database "${name}": ` +
        `BIOENERGY_ORG_DB_NAME must end in "_test" because the suite drops everything in it.`
    );
  }
}

// Starts from an empty database so a run never depends on what a previous one left behind,
// then migrates it. Dropping the whole schema, rather than a list of tables, also removes
// the functions and indexes migrations create, including ones added after this was written.
// The test user must own the database (createdb -O <user>, or a superuser as in CI).
async function prepareDatabase(sequelize = db.sequelize) {
  assertTestDatabase();
  await sequelize.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await runMigrations(sequelize);
}

// Replaces the datasets table's contents with `records`, written through the real model so
// its setters (HTML sanitising) and the generated search column apply as they do on import.
async function loadDatasets(records) {
  await db.sequelize.query("TRUNCATE datasets");
  await db.datasets.bulkCreate(records);
}

async function closeDatabase() {
  await db.sequelize.close();
}

module.exports = { assertTestDatabase, prepareDatabase, loadDatasets, closeDatabase };
