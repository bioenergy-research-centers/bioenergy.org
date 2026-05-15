require("dotenv").config({ path: [".env", "../.env"] });

const { syncIssueComment } = require("../app/services/githubService");
const { formatListWithSublistBlocks } = require("../app/utils/markdownFormatter");
const { validateDatafeedJson } = require("../app/services/validateService");

const db = require("../app/models");
const Dataset = db.datasets;

const datasources = require("../app/config/datafeeds.json");
const fetch = require("sync-fetch");

async function processDatafeeds() {
  const feed_summary = {};
  const invalid_feeds = {};

  for (const datafeed of datasources.urls) {
    if (datafeed.url === null) {
      console.error(`${datafeed.name} [${datafeed.url}]: DATA FEED REJECTED (reason: missing URL)`);
      continue;
    }

    let datafeedText;
    try {
      datafeedText = fetch(datafeed.url).text();
    } catch (err) {
      console.error(`${datafeed.name} [${datafeed.url}]: DATA FEED REJECTED (reason: retrieval failed)`);
      console.error(err.message);
      continue;
    }

    let datafeedJson;
    try {
      datafeedJson = JSON.parse(datafeedText);
    } catch (err) {
      console.error(`${datafeed.name} [${datafeed.url}]: DATA FEED REJECTED (reason: malformed JSON)`);
      console.error(err.message);
      continue;
    }

    let validationResult;
    try {
      validationResult = validateDatafeedJson(datafeedJson, {
        feedName: datafeed.name,
        feedSource: datafeed.url,
        forceSchemaVersion: process.env.FORCE_SCHEMA_VERSION || null
      });
    } catch (err) {
      console.error(`${datafeed.name} [${datafeed.url}]: DATA FEED REJECTED (${err.code || "VALIDATION_SETUP_ERROR"})`);
      console.error(err.message);
      continue;
    }

    const { report, validDatasets } = validationResult;

    console.log(`Validating ${datafeed.name} against ${report.schema_filename}`);

    if (report.feed_validation.valid) {
      console.log(`${datafeed.name} DATA FEED PASSED VALIDATION`);
    } else {
      console.error(`${datafeed.name} DATA FEED FAILED VALIDATION:`, report.feed_validation.errors);
    }

    for (const dataset of validDatasets) {
      const uid = `${dataset.brc}_${dataset.identifier}`;
      const new_record = {
        uid,
        schema_version: report.schema_version,
        json: dataset
      };

      await Dataset.scope("defaultScope").upsert(new_record);
    }

    feed_summary[datafeed.url] = report.summary;

    if (report.invalid_records.length > 0) {
      invalid_feeds[`Invalid Records - ${datafeed.name}`] = report.invalid_records.map((record) => [
        `${record.identifier} (${record.dataset_index})`,
        JSON.stringify(record.errors)
      ]);
    }

    if (report.duplicate_records.length > 0) {
      invalid_feeds[`Duplicate Records - ${datafeed.name}`] = report.duplicate_records.map((record) => [
        `${record.identifier} (${record.dataset_index})`,
        record.details
      ]);
    }
  }

  console.log("Data Import Summary:", feed_summary);
  return invalid_feeds;
}

async function processInvalidRecords(invalid_feeds) {
  Object.keys(invalid_feeds).forEach((title) => {
    const issueBody = formatListWithSublistBlocks(invalid_feeds[title], "json");
    syncIssueComment(title, issueBody, { labels: "data-import" });
  });
}

async function main() {
  console.log("Processing All Datafeeds");
  const invalid = await processDatafeeds();

  console.log("Processing Invalid Data");
  await processInvalidRecords(invalid);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
