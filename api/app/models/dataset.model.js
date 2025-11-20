const { Model, DataTypes } = require("sequelize");
const sanitizeHtml = require('sanitize-html');
const ALLOWED_HTML = { allowedTags: [ 'b', 'i', 'sub', 'sup'], allowedAttributes: {} };

module.exports = (sequelize, Sequelize) => {
  class Dataset extends Model {
    // return json data representing the dataset for use by clients
    toClientJSON() {
      const jsonData = this.json;
      jsonData.schema_version = this.schema_version;
      jsonData.uid = this.uid;
      jsonData.created_at = this.createdAt;
      jsonData.updated_at = this.updatedAt;
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
        allowNull: false,
        set(rawJSON) {
          // sanitize all string values
          const cleanJSON = JSON.parse(JSON.stringify(rawJSON,
            (_key, value) => (typeof value === "string" ? sanitizeHtml(value, ALLOWED_HTML) : value)
          ));
          this.setDataValue('json', cleanJSON);
        }
      }
    },
    { 
      sequelize,
      modelName: 'dataset'
    }
  );

  return Dataset;
};
