const dbConfig = require("../config/db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    logging: false, // disable logging; default: console.log
    host: dbConfig.HOST,
    port: dbConfig.PORT,
    dialect: dbConfig.dialect,
    operatorsAliases: "0",
    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: dbConfig.pool.acquire,
        idle: dbConfig.pool.idle
    }
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.datasets = require("./dataset.model.js")(sequelize, Sequelize);

// Add a scope to the Dataset model that restricts queries to only the schema versions supported by the UI.
const {Op, where} = db.Sequelize;
const schemas = require("../schemas");
db.datasets.addScope('supportedOnly', { where: { 'schema_version': { [Op.or]: schemas.supported } } });

module.exports = db;
