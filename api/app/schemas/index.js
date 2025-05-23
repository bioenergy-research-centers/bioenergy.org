const schema = {};

const schema_index = require('./schema_list.json'); // Load the schema index.

// Convert the list of schemas to a map of filenames indexed by version number (i.e., { "0.1.0": "brc_schema_0.1.0.json" }).
schema.index = schema_index.reduce((map_entry, array_element) => {
    map_entry[array_element.version] = array_element.filename;
    return map_entry;
  }, {});
  
// Extract an array of the schema versions supported by the UI (used by models/index.js to create Dataset scope).
schema.supported = schema_index.filter(function(obj) { return obj.supported; }).map(function(obj) { return obj.version; });

// Note: The idea of a default version may be dropped after all feeds migrate to providing version numbers.
schema.default = "0.0.8"; // Default to last version prior to the breaking change in 0.1.0 for backward compatibility.

module.exports = schema;
