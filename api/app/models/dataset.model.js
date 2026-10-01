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
    // return json data representing the subset of dataset fields required for list items.
    // list item views are not versioned. Ensure any changes are mirrored in client component.
    toClientListItemJSON() {
      const jsonData = this.json ?? {};
      return {
        uid: this.uid,
        brc: jsonData.brc ?? null,
        title: jsonData.title ?? null,
        creator: jsonData.creator ?? [],
        description: jsonData.description ?? null,
        analysisType: jsonData.analysisType ?? null,
        repository: jsonData.repository ?? null,
        date: jsonData.date ?? null,
        identifier: jsonData.identifier ?? null,
        dataset_url: jsonData.dataset_url ?? null
      };
    };

  }

  Dataset.init(
    {
      uid: {
        type: DataTypes.TEXT,
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
