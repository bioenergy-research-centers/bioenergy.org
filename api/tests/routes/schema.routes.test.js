const supertest = require("supertest");
const fs = require("fs");
const { createApp } = require("../helpers/createApp");
const schemaRoutes = require("../../app/routes/schema.routes");
const schemas = require("../../app/schemas");
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
  afterEach(() => {
    vi.restoreAllMocks();
    delete schemas.index.bad;
    delete schemas.index.missing;
  });

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

  it("returns 400 when a schema index entry resolves outside the schemas directory", async () => {
    schemas.index.bad = "../outside.json";
    vi.spyOn(fs, "existsSync").mockReturnValue(true);

    const res = await supertest(buildApp()).get("/api/schema/bad");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid schema path." });
  });

  it("returns 404 when a supported schema file is missing on disk", async () => {
    schemas.index.missing = "missing-schema.json";
    vi.spyOn(fs, "existsSync").mockReturnValue(false);

    const res = await supertest(buildApp()).get("/api/schema/missing");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Schema file missing on server." });
  });

  it("rejects path traversal attempts", async () => {
    const res = await supertest(buildApp()).get("/api/schema/../../package.json");
    expect([400, 404]).toContain(res.status);
  });

  it("handles missing version param by treating it as empty string", async () => {
    const schemas = require("../../app/schemas");
    const router = require("../../app/routes/schema.routes");

    // Extract the handler for GET /:version
    const layer = router.stack.find(
      l => l.route && l.route.path === "/:version"
    );
    const handler = layer.route.stack[0].handle;

    const req = { params: {} }; // no version
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Schema version not found." });
  });
});