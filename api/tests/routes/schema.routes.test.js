const supertest = require("supertest");
const { createApp } = require("../helpers/createApp");
const schemaRoutes = require("../../app/routes/schema.routes");
const schemaList = require("../../app/schemas/schema_list.json");

function buildApp() {
  const app = createApp();
  app.use("/api/schema", schemaRoutes);
  return app;
}

describe("GET /api/schema", () => {
  it("returns supported schema versions", async () => {
    const res = await supertest(buildApp()).get("/api/schema");
    expect(res.status).toBe(200);
    expect(res.body.supported).toBeInstanceOf(Array);
    const expectedVersions = schemaList
      .filter(s => s.supported)
      .map(s => s.version);
    for (const version of expectedVersions) {
      expect(res.body.supported).toContain(version);
    }
  });
});

describe("GET /api/schema/:version", () => {
  it("returns 404 for unknown version", async () => {
    const res = await supertest(buildApp()).get("/api/schema/99.99.99");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Schema version not found.");
  });

  it("returns schema JSON for a valid version", async () => {
    const version = schemaList.find(s => s.supported).version;
    const res = await supertest(buildApp()).get(`/api/schema/${version}`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/schema+json");
  });

  it("rejects path traversal attempts", async () => {
    const res = await supertest(buildApp()).get("/api/schema/../../package.json");
    // This should either 404 (not in allowlist) or 400
    expect([400, 404]).toContain(res.status);
  });
});
