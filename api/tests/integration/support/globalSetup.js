// Runs once before any integration test file: wipes the test database and applies every
// migration. See support/database.js.
const db = require("../../../app/models");
const { prepareDatabase } = require("./database");

module.exports = async function setup() {
  try {
    await prepareDatabase(db.sequelize);
  } finally {
    await db.sequelize.close();
  }
};
