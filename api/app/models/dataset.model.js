const DataTypes = require("sequelize/lib/data-types");

module.exports = (sequelize, Sequelize) => {
  const Dataset = sequelize.define("dataset", {
    uid: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    json: {
      type: DataTypes.JSONB,
      allowNull: false
    }
  });

  return Dataset;
};
