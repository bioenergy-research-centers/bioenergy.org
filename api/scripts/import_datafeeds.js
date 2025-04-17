require("dotenv").config( {path: ['.env','../.env'] } );

const { syncIssueComment } = require("../app/services/githubService");
const { formatListWithSublistBlocks } = require("../app/utils/markdownFormatter");

const db = require("../app/models");
const Dataset = db.datasets;

// Begin data import.

// read a set of hard-coded URLs from a file
const datasources = require("../app/config/datafeeds.json"); // hard-coded data feed URLs

const fs = require('node:fs');
const fetch = require('sync-fetch'); // synchronous fetch is easier for development and testing (can switch to async later if needed)
const Ajv = require('ajv/dist/2019'); // this specific path is required to support the BRC schemas (rather than simply 'ajv');
const addFormats = require('ajv-formats');

const feed_summary = {};
const invalid_feeds = {};

// initialize the JSON schema validator
const schemas = require("../app/schemas");

// query each URL expecting well-formed JSON matching the project schema structure
for (const datafeed of datasources.urls) {
  // Initialize summary counts
  const datafeed_counts = {valid:0,invalid:0};
  // Initialize invalid record tracking
  const invalid_records = [];

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

  // Each feed might conform to a different schema version, and we need to accomodate both the old feed format and the new feed format for now.
  // Look for a schema version at the top level of the JSON feed.
  var schema_version = (datafeed_json.schema_version === undefined) ? schemas.default : datafeed_json.schema_version;
  // Adding the schema_version field at the top level moves the dataset array into a top-level field named 'datasets'.
  // But if this field is not found, assume this is an older feed where the dataset array is at the top level.
  var datasets = (datafeed_json.datasets === undefined) ? datafeed_json : datafeed_json.datasets;

  // Look up the LinkML JSON schema.
  const schema_filename = schemas.index[schema_version];

  if (schema_filename === undefined)
  {
    console.error('Unsupported schema version: ' + schema_version + ' - skipping ' + datafeed.name + ' feed.');
    continue; // skip to next feed
  }

  var validate; // the validator for this feed

  try {
    const schema = require('../app/schemas/' + schema_filename);
    const ajv = new Ajv({ allErrors: 'true', verbose: 'true', strict: 'false' }); // must set option "strict: 'false'" to produce specification-compliant behavior
    addFormats(ajv); // required for supporting format: date in JSON schema
    validate = ajv.compile(schema);
  } catch (err) {
    console.error('Unable to load ' + schema_filename + ' - skipping ' + datafeed.name + ' feed.');
    console.error(err.message);
    continue; // skip to next feed
  }

  console.log('Validating ' + datafeed.name + ' against ' + schema_filename);

  // validate the entire feed
  try {
    if (validate({ "datasets": [ datasets ] })) {
      console.log(datafeed.name + "DATA FEED PASSED VALIDATION");
    }
  } catch (err) {
    console.error(datafeed.name + "DATA FEED FAILED VALIDATION:", validate.errors);
    // this is a non-fatal error, so continue processing records
  }

  // process each dataset in the data feed
  datasets.forEach(function(dataset, dataset_index)
  {
    // handle malformed data gracefully (only reject individual datasets that fail validation, not entire data feeds)
    if (validate({ "datasets": [ dataset ] })) {
      datafeed_counts.valid += 1;
    } else {
      datafeed_counts.invalid += 1;
      console.error("[" + datafeed.url + "]: DATA SET " + (dataset_index + 1) + " FAILED VALIDATION - identifier: " + dataset.identifier);
      const dataset_errors = validate.errors.map(function(error){ return { msg: error.instancePath + ": " + error.message, provided: error.data, required: error.schema}; });
      console.error(dataset_errors);
      invalid_records.push([dataset.identifier+" ("+(dataset_index+1)+")", JSON.stringify(dataset_errors)]);
      return; // only reject data sets that fail validation
    }

    const uid = dataset.brc + '_' + dataset.identifier;

    const new_record = {
      uid: uid,
      schema_version: schema_version,
      json: dataset
    };

    Dataset.scope('defaultScope').upsert(new_record);
  });
  feed_summary[datafeed.url]=datafeed_counts;
  if (invalid_records.length > 0) {
    invalid_feeds["Invalid Records - "+datafeed.name]=invalid_records;
  };
}
console.log("Data Import Summary:", feed_summary);
// Self executing async function
(async () => {
  // Sync invalid data to Github issues
  Object.keys(invalid_feeds).forEach( title => {
    const issueBody = formatListWithSublistBlocks(invalid_feeds[title], 'json');
    syncIssueComment(title, issueBody, {labels: 'data-import'});
  });

})();
