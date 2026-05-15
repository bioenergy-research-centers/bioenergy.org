const Ajv = require("ajv/dist/2019");
const addFormats = require("ajv-formats");
const schemas = require("../schemas");

const ajvParams = {
  allErrors: true,
  verbose: true,
  strictSchema: false,
  strictNumbers: true,
  strictTypes: false,
  strictTuples: true,
  strictRequired: true
};

function buildValidator(schemaVersion) {
  const schemaFilename = schemas.index[schemaVersion];

  if (!schemaFilename) {
    const err = new Error(`Unsupported schema version: ${schemaVersion}`);
    err.code = "UNSUPPORTED_SCHEMA_VERSION";
    throw err;
  }

  let schema;
  try {
    schema = require(`../schemas/${schemaFilename}`);
  } catch (err) {
    const loadErr = new Error(`Unable to load schema file: ${schemaFilename}`);
    loadErr.code = "SCHEMA_LOAD_ERROR";
    loadErr.cause = err;
    throw loadErr;
  }

  const ajv = new Ajv(ajvParams);
  addFormats(ajv);

  let validate;
  try {
    validate = ajv.compile(schema);
  } catch (err) {
    const compileErr = new Error(`Unable to compile schema file: ${schemaFilename}`);
    compileErr.code = "SCHEMA_COMPILE_ERROR";
    compileErr.cause = err;
    throw compileErr;
  }

  return {
    schemaVersion,
    schemaFilename,
    validate
  };
}

function normalizeFeedShape(feedJson) {
  const schemaVersion = feedJson.schema_version;
  const datasets =
    feedJson.datasets === undefined ? feedJson : feedJson.datasets;

  if (!Array.isArray(datasets)) {
    const err = new Error("Feed must contain a top-level datasets array or be an array of datasets");
    err.code = "INVALID_FEED_SHAPE";
    throw err;
  }

  return { schemaVersion, datasets };
}

function formatAjvErrors(errors = []) {
  return errors.map((error) => ({
    msg: `${error.instancePath}: ${error.message}`,
    provided: error.data,
    required: error.schema
  }));
}

function validateDatafeedJson(feedJson, options = {}) {
  const forcedSchemaVersion = options.forceSchemaVersion || null;
  const feedName = options.feedName || "submitted feed";
  const feedSource = options.feedSource || "uploaded payload";

  const report = {
    feed_name: feedName,
    feed_source: feedSource,
    schema_version: null,
    schema_filename: null,
    summary: {
      valid: 0,
      invalid: 0,
      duplicate: 0
    },
    feed_validation: {
      valid: null,
      errors: []
    },
    invalid_records: [],
    duplicate_records: []
  };

  const { schemaVersion: feedSchemaVersion, datasets } = normalizeFeedShape(feedJson);

  let schemaVersion = feedSchemaVersion;
  if (forcedSchemaVersion) {
    schemaVersion = forcedSchemaVersion;
  }

  report.schema_version = schemaVersion;

  const { schemaFilename, validate } = buildValidator(schemaVersion);
  report.schema_filename = schemaFilename;

  try {
    const wholeFeedValid = validate({ datasets });
    report.feed_validation.valid = !!wholeFeedValid;
    if (!wholeFeedValid) {
      report.feed_validation.errors = formatAjvErrors(validate.errors);
    }
  } catch (err) {
    report.feed_validation.valid = false;
    report.feed_validation.errors = [
      { msg: err.message, provided: null, required: null }
    ];
  }

  const processedIdentifiers = new Set();
  const processedUrls = new Set();
  const validDatasets = [];

  for (const [datasetIndex, originalDataset] of datasets.entries()) {
    const dataset = { ...originalDataset };

    if (typeof dataset.identifier === "string" && dataset.identifier.trim() === "") {
      dataset.identifier = null;
    }

    let duplicate = false;

    if (dataset.identifier && dataset.identifier !== null) {
      const dedupeIdKey = dataset.identifier.toString().trim().toLowerCase();
      if (processedIdentifiers.has(dedupeIdKey)) {
        duplicate = true;
      } else {
        processedIdentifiers.add(dedupeIdKey);
      }
    }

    if (typeof dataset.dataset_url === "string" && dataset.dataset_url.trim() !== "") {
      const dedupeUrlKey = dataset.dataset_url.toString().trim().toLowerCase();
      if (processedUrls.has(dedupeUrlKey)) {
        duplicate = true;
      } else {
        processedUrls.add(dedupeUrlKey);
      }
    }

    if (duplicate) {
      report.summary.duplicate += 1;
      report.duplicate_records.push({
        dataset_index: datasetIndex + 1,
        identifier: dataset.identifier ?? null,
        dataset_url: dataset.dataset_url ?? null,
        details: `identifier: ${dataset.identifier}, dataset_url: ${dataset.dataset_url}`
      });
      continue;
    }

    const datasetValid = validate({ datasets: [dataset] });

    if (datasetValid) {
      report.summary.valid += 1;
      validDatasets.push(dataset);
    } else {
      report.summary.invalid += 1;
      report.invalid_records.push({
        dataset_index: datasetIndex + 1,
        identifier: dataset.identifier ?? null,
        dataset_url: dataset.dataset_url ?? null,
        errors: formatAjvErrors(validate.errors)
      });
    }
  }

  return {
    report,
    validDatasets
  };
}

module.exports = {
  validateDatafeedJson
};
