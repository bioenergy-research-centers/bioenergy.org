module.exports = {
  HOST: process.env.BIOENERGY_ORG_DB_HOST,
  USER: process.env.BIOENERGY_ORG_DB_USER,
  PASSWORD: process.env.BIOENERGY_ORG_DB_PASSWORD,
  DB: process.env.BIOENERGY_ORG_DB_NAME,
  PORT: process.env.BIOENERGY_ORG_DB_LOCAL_PORT,
  dialect: "postgres",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};