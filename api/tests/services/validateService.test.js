const feed = require("../fixtures/validate/mixed-feed.json");
const { validateDatafeedJson } = require("../../app/services/validateService");

describe("validateDatafeedJson", () => {
  it("returns summary counts and invalid record details for a mixed feed", () => {
    const { report, validDatasets } = validateDatafeedJson(feed, {
      feedName: "test feed",
      feedSource: "test"
    });

    expect(report.feed_name).toBe("test feed");
    expect(report.feed_source).toBe("test");
    expect(report.schema_version).toBe(feed.schema_version);
    expect(report.schema_filename).toMatch(/\.json$/);

    expect(report.summary.valid).toBe(2);
    expect(report.summary.invalid).toBe(1);
    expect(report.summary.duplicate).toBe(1);

    expect(report.feed_validation.valid).toBe(false);
    expect(Array.isArray(report.feed_validation.errors)).toBe(true);
    expect(report.feed_validation.errors.length).toBeGreaterThan(0);

    expect(validDatasets).toHaveLength(2);

    expect(report.invalid_records).toHaveLength(1);
    expect(report.invalid_records[0]).toMatchObject({
      dataset_index: 4
    });
    expect(Array.isArray(report.invalid_records[0].errors)).toBe(true);
    expect(report.invalid_records[0].errors.length).toBeGreaterThan(0);

    expect(report.duplicate_records).toHaveLength(1);
    expect(report.duplicate_records[0].identifier).toBe("PRJNA892137");
  });

  it("uses a forced schema version when provided", () => {
    const { report } = validateDatafeedJson(feed, {
      forceSchemaVersion: feed.schema_version
    });

    expect(report.schema_version).toBe(feed.schema_version);
  });

  it("throws for invalid feed shape", () => {
    expect(() =>
      validateDatafeedJson({ schema_version: "0.1.12", datasets: {} })
    ).toThrow("Feed must contain a top-level datasets array or be an array of datasets");
  });

  it("throws for unsupported schema version", () => {
    expect(() =>
      validateDatafeedJson({
        schema_version: "99.99.99",
        datasets: []
      })
    ).toThrow("Unsupported schema version: 99.99.99");
  });

  it("detects duplicate identifiers within a feed", () => {
    const duplicateFeed = {
      schema_version: feed.schema_version,
      datasets: [
        { ...feed.datasets[0] },
        {
          ...feed.datasets[0],
          dataset_url: "https://example.org/duplicate-url-2"
        }
      ]
    };

    const { report, validDatasets } = validateDatafeedJson(duplicateFeed);

    expect(report.summary.valid).toBe(1);
    expect(report.summary.invalid).toBe(0);
    expect(report.summary.duplicate).toBe(1);
    expect(report.duplicate_records).toHaveLength(1);
    expect(validDatasets).toHaveLength(1);
  });

  it("treats blank string identifier as null before validation", () => {
    const blankIdFeed = {
      schema_version: feed.schema_version,
      datasets: [
        {
          ...feed.datasets[0],
          identifier: "   "
        }
      ]
    };

    const { report } = validateDatafeedJson(blankIdFeed);

    expect(report.summary.valid + report.summary.invalid + report.summary.duplicate).toBe(1);
  });
});
