const supertest = require("supertest");
const { createApp } = require("../helpers/createApp");
const validateRoutes = require("../../app/routes/validate.routes");
const feed = require("../fixtures/validate/mixed-feed.json");

function buildApp() {
  const app = createApp();
  app.use(require("express").json({ limit: "5mb" }));
  app.use("/api/validate", validateRoutes);
  return app;
}

describe("POST /api/validate", () => {
  it("returns a validation report for a mixed feed", async () => {
    const res = await supertest(buildApp())
      .post("/api/validate")
      .send(feed);

    expect(res.status).toBe(200);
    expect(res.body.feed_name).toBe("uploaded feed");
    expect(res.body.feed_source).toBe("api");
    expect(res.body.schema_version).toBe(feed.schema_version);

    expect(res.body.summary.valid).toBe(2);
    expect(res.body.summary.invalid).toBe(1);
    expect(res.body.summary.duplicate).toBe(1);

    expect(res.body.invalid_records).toHaveLength(1);
    expect(res.body.duplicate_records).toHaveLength(1);
  });

  it("returns 400 for unsupported schema version", async () => {
    const badFeed = {
      schema_version: "99.99.99",
      datasets: []
    };

    const res = await supertest(buildApp())
      .post("/api/validate")
      .send(badFeed);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("UNSUPPORTED_SCHEMA_VERSION");
    expect(res.body.error).toContain("Unsupported schema version");
  });

  it("returns 400 for invalid feed shape", async () => {
    const res = await supertest(buildApp())
      .post("/api/validate")
      .send({
        schema_version: feed.schema_version,
        datasets: {}
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Feed must contain a top-level datasets array");
  });
});
