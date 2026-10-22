require("dotenv").config({ path: [".env", "../.env"] });

const db = require("../app/models");
const { createMigrator, runMigrations } = require("../app/db/migrator");

// `node scripts/migrate.js` (npm run migrate) applies every pending migration under the
// migration lock; this is what the migrate service runs on each deploy. Any other arguments
// go to Umzug's built-in CLI: `node scripts/migrate.js <up|down|pending|executed> [options]`.
// See the npm run migrate* scripts in package.json for the common invocations.
const args = process.argv.slice(2);

if (args.length === 0) {
  runMigrations(db.sequelize)
    .then((applied) => {
      console.log(applied.length > 0
        ? `Applied ${applied.length} migration(s): ${applied.map((m) => m.name).join(", ")}`
        : "No pending migrations; database is up to date.");
    })
    .catch((err) => {
      console.error("Migration failed; the failing migration was rolled back and is still pending.", err);
      process.exitCode = 1;
    })
    .finally(() => db.sequelize.close());
} else {
  createMigrator(db.sequelize).runAsCLI();
}
