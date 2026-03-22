const supertest = require("supertest");
const { createApp } = require("../helpers/createApp");

// Get the real module reference — all consumers share this object
const db = require("../../app/models");

// Replace db methods with mocks by mutating the shared module object
const mockFindAndCountAll = vi.fn();
const mockFindByPk = vi.fn();
const mockCount = vi.fn();
const mockQuery = vi.fn();

// Override Dataset.scope to return mocked model methods
db.datasets.scope = vi.fn(() => ({
  findAndCountAll: mockFindAndCountAll,
  findByPk: mockFindByPk,
  count: mockCount,
  getTableName: () => "datasets",
}));

// Override sequelize.query for metrics and facet queries
db.sequelize.query = mockQuery;
db.sequelize.dialect.queryGenerator.selectQuery = vi.fn(() => "SELECT uid FROM datasets WHERE true;");

// Mock search services by mutating the shared module objects
const datasetsService = require("../../app/services/datasetsService");
const strategyManager = require("../../app/services/strategyManager");
const mockSearchLocalDatasets = vi.fn().mockResolvedValue([]);
const mockRunSearch = vi.fn().mockResolvedValue([]);
datasetsService.searchLocalDatasets = mockSearchLocalDatasets;
strategyManager.runSearch = mockRunSearch;

describe("dataset routes", () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchLocalDatasets.mockResolvedValue([]);
    mockRunSearch.mockResolvedValue([]);
    app = createApp();
    const datasetRoutes = require("../../app/routes/dataset.routes");
    app.use("/api/datasets", datasetRoutes);
  });

  describe("GET /api/datasets", () => {
    it("returns paginated results with defaults", async () => {
      mockFindAndCountAll.mockResolvedValue({
        count: 2,
        rows: [
          { toClientJSON: () => ({ uid: "1", title: "Dataset A" }) },
          { toClientJSON: () => ({ uid: "2", title: "Dataset B" }) },
        ],
      });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets");
      expect(res.status).toBe(200);
      expect(res.body.totalResults).toBe(2);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.query.page).toBe(1);
      expect(res.body.query.rows).toBe(50);
    });

    it("respects page and rows parameters", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 100, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?page=3&rows=10");
      expect(res.body.query.page).toBe(3);
      expect(res.body.query.rows).toBe(10);
    });

    it("caps rows at MAXROWLIMIT (500)", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?rows=999");
      expect(res.body.query.rows).toBe(500);
    });

    it("skips facets when nofacets is set", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });

      const res = await supertest(app).get("/api/datasets?nofacets=true");
      expect(res.status).toBe(200);
      expect(res.body.facets).toBeNull();
    });

    it("calculates totalPages correctly", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 25, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?rows=10");
      expect(res.body.totalPages).toBe(3);
    });

    it("accepts text search query", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?q=ethanol&nofacets=true");
      expect(res.status).toBe(200);
    });

    it("accepts text search with OR and NOT operators", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?q=ethanol%20OR%20biomass%20NOT%20corn&nofacets=true");
      expect(res.status).toBe(200);
    });

    it("accepts text search with parentheses", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?q=(ethanol%20OR%20biomass)%20cellulose&nofacets=true");
      expect(res.status).toBe(200);
    });

    it("filters by single brc value", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?filters[brc]=JBEI&nofacets=true");
      expect(res.status).toBe(200);
    });

    it("filters by multiple brc values", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?filters[brc]=JBEI&filters[brc]=GLBRC&nofacets=true");
      expect(res.status).toBe(200);
    });

    it("filters by single repository value", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?filters[repository]=JGI&nofacets=true");
      expect(res.status).toBe(200);
    });

    it("filters by multiple repository values", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?filters[repository]=JGI&filters[repository]=NCBI&nofacets=true");
      expect(res.status).toBe(200);
    });

    it("filters by single analysisType", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?filters[analysisType]=genomics&nofacets=true");
      expect(res.status).toBe(200);
    });

    it("filters by multiple analysisType values", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?filters[analysisType]=genomics&filters[analysisType]=proteomics&nofacets=true");
      expect(res.status).toBe(200);
    });

    it("filters by single species", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?filters[species]=Saccharomyces&nofacets=true");
      expect(res.status).toBe(200);
    });

    it("filters by multiple species values", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?filters[species]=Saccharomyces&filters[species]=Escherichia&nofacets=true");
      expect(res.status).toBe(200);
    });

    it("filters by single theme", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?filters[theme]=Sustainability&nofacets=true");
      expect(res.status).toBe(200);
    });

    it("filters by multiple theme values", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?filters[theme]=Sustainability&filters[theme]=Conversion&nofacets=true");
      expect(res.status).toBe(200);
    });

    it("filters by single topic/category", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?filters[topic]=Microbiology&nofacets=true");
      expect(res.status).toBe(200);
    });

    it("filters by multiple topic/category values", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?filters[topic]=Microbiology&filters[topic]=Plant%20Biology&nofacets=true");
      expect(res.status).toBe(200);
    });

    it("filters by single year", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?filters[year]=2024&nofacets=true");
      expect(res.status).toBe(200);
    });

    it("filters by multiple year values", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?filters[year]=2024&filters[year]=2023&nofacets=true");
      expect(res.status).toBe(200);
    });

    it("filters by single personName", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?filters[personName]=Smith&nofacets=true");
      expect(res.status).toBe(200);
    });

    it("filters by multiple personName values", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?filters[personName]=Smith&filters[personName]=Jones&nofacets=true");
      expect(res.status).toBe(200);
    });

    it("accepts the legacy limit parameter", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?limit=25&nofacets=true");
      expect(res.body.query.rows).toBe(25);
    });

    it("defaults negative page to 1", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets?page=-1&nofacets=true");
      expect(res.body.query.page).toBe(1);
    });
  });

  describe("GET /api/datasets/metrics", () => {
    it("returns aggregate metrics", async () => {
      mockCount.mockResolvedValue(150);
      mockQuery
        .mockResolvedValueOnce([{ count: 42 }])   // primaryAuthorCounts
        .mockResolvedValueOnce([{ count: 15 }])   // taxonCounts
        .mockResolvedValueOnce([{ count: 5 }]);    // repositoryCounts

      const res = await supertest(app).get("/api/datasets/metrics");
      expect(res.status).toBe(200);
      expect(res.body.totalDatasets).toBe(150);
      expect(res.body.totalPrimaryCreators).toBe(42);
      expect(res.body.totalTaxIds).toBe(15);
      expect(res.body.repositoryCounts).toBe(5);
    });

    it("returns 500 on database error", async () => {
      mockCount.mockRejectedValue(new Error("db down"));

      const res = await supertest(app).get("/api/datasets/metrics");
      expect(res.status).toBe(500);
      expect(res.body.message).toContain("Error retrieving Dataset metrics");
    });
  });

  describe("GET /api/datasets/:id", () => {
    it("returns a dataset by id", async () => {
      mockFindByPk.mockResolvedValue({
        toClientJSON: () => ({ uid: "abc-123", title: "Test" }),
      });

      const res = await supertest(app).get("/api/datasets/abc-123");
      expect(res.status).toBe(200);
      expect(res.body.uid).toBe("abc-123");
    });

    it("returns 404 when dataset not found", async () => {
      mockFindByPk.mockResolvedValue(null);

      const res = await supertest(app).get("/api/datasets/nonexistent");
      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Cannot find Dataset");
    });

    it("returns 500 on database error", async () => {
      mockFindByPk.mockRejectedValue(new Error("db error"));

      const res = await supertest(app).get("/api/datasets/abc-123");
      expect(res.status).toBe(500);
      expect(res.body.message).toContain("Error retrieving Dataset");
    });
  });

  describe("POST /api/datasets (search)", () => {
    it("returns local results when no sequence provided", async () => {
      mockSearchLocalDatasets.mockResolvedValue([{ uid: "1", title: "Local" }]);

      const res = await supertest(app)
        .post("/api/datasets")
        .send({ query: "test" });
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ uid: "1", title: "Local" }]);
    });

    it("runs federated search when sequence is provided", async () => {
      mockRunSearch.mockResolvedValue([{ title: "ICE Result" }]);

      const res = await supertest(app)
        .post("/api/datasets")
        .send({ query: "test", sequence: "ATCGATCG" });
      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ title: "ICE Result" }]);
    });

    it("returns 500 on search error", async () => {
      mockSearchLocalDatasets.mockRejectedValue(new Error("search failed"));

      const res = await supertest(app)
        .post("/api/datasets")
        .send({ query: "test" });
      expect(res.status).toBe(500);
      expect(res.body.message).toContain("Search failed");
    });
  });
});
