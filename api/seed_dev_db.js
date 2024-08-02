require("dotenv").config( {path: ['.env','../.env'] } );

const db = require("./app/models");
const Dataset = db.datasets;

//db.sequelize.sync(); // This creates the table if it doesn't exist (and does nothing if it already exists).
//db.sequelize.sync({ alter: true }); // This checks what is the current state of the table in the database (which columns it has, what are their data types, etc), and then performs the necessary changes in the table to make it match the model.

// Begin data import.

// read a set of hard-coded URLs from a file
const datasources = require("./app/config/datafeeds.json"); // hard-coded data feed URLs

const fs = require('node:fs');
const fetch = require('sync-fetch'); // synchronous fetch is easier for development and testing (can switch to async later if needed)
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// initialize the JSON schema validator
const ajv = new Ajv({ allErrors: 'true', verbose: 'true', strict: 'false' }); // must set option strict: false to produce specification-compliant behavior
addFormats(ajv); // required for supporting format: date in JSON schema

// load the LinkML JSON schema
var linkml_schema_json;
try {
  const linkml_schema_text = fs.readFileSync('./app/config/brc_schema.json');
  linkml_schema_json = JSON.parse(linkml_schema_text);
} catch (err) {
  throw err; // This is a fatal error that prevents further processing.
}

// query each URL expecting well-formed JSON matching the project schema structure
for (const datafeed of datasources.urls) {

  if (datafeed.url === null) {
    console.error(datafeed.name + " [" + datafeed.url + "]: DATA FEED REJECTED (reason: missing URL)");
    continue; // skip entire data feed
  }

  var datafeed_text;
  try {
    datafeed_text = fetch(datafeed.url).text();
  } catch (err) {
    console.error(datafeed.name + " [" + datafeed.url + "]: DATA FEED REJECTED (reason: retrieval failed)");
//    console.error(err.message);
    continue; // skip entire data feed
  }

  // expect well-formed JSON
  var datafeed_json;
  try {
    datafeed_json = JSON.parse(datafeed_text);
  } catch (err) {
    console.error(datafeed.name + " [" + datafeed.url + "]: DATA FEED REJECTED (reason: malformed JSON)");
//    console.error(err.message);
    continue; // skip entire data feed
  }
  
  // NOTE: The data feeds do not pass LinkML schema validation, so only validate at the data set level.

  // process each data set in the data feed
  for (const dataset of datafeed_json)
  {
    // handle malformed data gracefully (only reject individual data sets that fail validation, not entire data feeds)
    const dataset_is_valid = ajv.validate(linkml_schema_json, dataset);
    if (!dataset_is_valid) {
      console.error(datafeed.name + " [" + datafeed.url + "]: DATA SET FAILED VALIDATION:", dataset);
      console.error("ERRORS:", ajv.errors);
      continue; // only reject data sets that fail validation
    }

    // process JSON data, importing each object into the database
    // NOTE: In order to avoid disrupting the Dataset controller, this commit adheres to the current expectations of the controller, which are only three required fields.
    // Therefore, when modifying this list of fields, also modify dataset.controller.js to keep the data model in sync.
    // Eventually, we may want to rely on LinkML transformers to convert the source data to our target structure (via "linkml-runtime": "^0.2.0"?).

    const dataset_is_published = !(!dataset.bibliographicCitation || dataset.bibliographicCitation.length === 0); // true/false

    var processed_dataset = {
      title: dataset.Title,
      description: dataset.Description,
      published: dataset_is_published
    };

//    console.log(processed_dataset);

    Dataset.create(processed_dataset);
  }
}
