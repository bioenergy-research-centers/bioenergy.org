const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
  class Dataset extends Model {
    // return json data representing the dataset for use by clients
    toClientJSON() {
      const jsonData = this.json;
      jsonData.schema_version = this.schema_version;
      return jsonData;
    }
  }

  Dataset.init(
    {
      uid: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
      },
      schema_version: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "0.0.8"
      },
      json: {
        type: DataTypes.JSONB,
        allowNull: false
      }
    },
    { 
      sequelize,
      modelName: 'dataset'
    }
  );

  return Dataset;
};
