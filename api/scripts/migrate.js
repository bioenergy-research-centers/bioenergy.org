require("dotenv").config({ path: [".env", "../.env"] });

const db = require("../app/models");
const { createMigrator } = require("../app/db/migrator");

// Umzug's built-in CLI: `node scripts/migrate.js <up|down|pending|executed>`.
// See the npm run migrate* scripts in package.json for the common invocations.
createMigrator(db.sequelize).runAsCLI();
