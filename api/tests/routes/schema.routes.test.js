const supertest = require("supertest");
const { createApp } = require("../helpers/createApp");
const schemaRoutes = require("../../app/routes/schema.routes");

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
    expect(res.body.supported).toContain("0.1.1");
    expect(res.body.supported).toContain("0.1.7");
    expect(res.body.supported).toContain("0.1.10");
  });
});

describe("GET /api/schema/:version", () => {
  it("returns 404 for unknown version", async () => {
    const res = await supertest(buildApp()).get("/api/schema/99.99.99");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Schema version not found.");
  });

  it("returns schema JSON for a valid version", async () => {
    const res = await supertest(buildApp()).get("/api/schema/0.1.7");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/schema+json");
  });

  it("rejects path traversal attempts", async () => {
    const res = await supertest(buildApp()).get("/api/schema/../../package.json");
    // This should either 404 (not in allowlist) or 400
    expect([400, 404]).toContain(res.status);
  });
});
