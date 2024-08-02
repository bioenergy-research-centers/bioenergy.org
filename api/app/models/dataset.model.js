const DataTypes = require("sequelize/lib/data-types");

module.exports = (sequelize, Sequelize) => {
  const Dataset = sequelize.define("dataset", {
    json: {
      type: DataTypes.JSONB
    }
  });

  return Dataset;
};
