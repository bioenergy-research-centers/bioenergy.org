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
const Ajv = require('ajv/dist/2019'); //require('ajv');
const addFormats = require('ajv-formats');

// initialize the JSON schema validator
const ajv = new Ajv({ allErrors: 'true', verbose: 'true', strict: 'false' }); // must set option "strict: 'false'"" to produce specification-compliant behavior
addFormats(ajv); // required for supporting format: date in JSON schema

// load the LinkML JSON schema
const schema = require('./app/config/brc_schema.json');
const validate = ajv.compile(schema);

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
    console.error(err.message);
    continue; // skip entire data feed
  }

  // expect well-formed JSON
  var datafeed_json;
  try {
    datafeed_json = JSON.parse(datafeed_text);
  } catch (err) {
    console.error(datafeed.name + " [" + datafeed.url + "]: DATA FEED REJECTED (reason: malformed JSON)");
    console.error(err.message);
    continue; // skip entire data feed
  }

  // validate the entire feed
  try {
    if (validate({ "datasets": [ datafeed_json ] })) {
      console.log(datafeed.name + "DATA FEED PASSED VALIDATION");
    }
  } catch (err) {
    console.error(datafeed.name + "DATA FEED FAILED VALIDATION:", validate.errors);
    // this is a non-fatal error, so continue processing records
  }

  // process each dataset in the data feed
  for (const dataset of datafeed_json)
  {
    // handle malformed data gracefully (only reject individual datasets that fail validation, not entire data feeds)
    if (validate({ "datasets": [ dataset ] })) {
      console.log("DATA SET PASSED VALIDATION");
    } else {
      console.error("[" + datafeed.url + "]: DATA SET FAILED VALIDATION:", dataset);
      console.error("ERRORS:", validate.errors);
      continue; // only reject data sets that fail validation
    }

    const new_record = {
      json: dataset
    };

    Dataset.create(new_record);
  }
}
