const supertest = require("supertest");
const { createApp } = require("../helpers/createApp");

// Get the real module reference — all consumers share this object
const db = require("../../app/models");

// Replace db methods with mocks by mutating the shared module object
const mockFindAndCountAll = vi.fn();
const mockFindByPk = vi.fn();
const mockFindAll = vi.fn();
const mockCount = vi.fn();
const mockQuery = vi.fn();

// Override Dataset.scope to return mocked model methods
db.datasets.scope = vi.fn(() => ({
  findAndCountAll: mockFindAndCountAll,
  findByPk: mockFindByPk,
  count: mockCount,
  getTableName: () => "datasets",
}));

db.datasets.findByPk = mockFindByPk;
db.datasets.findAll = mockFindAll;

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

    it("filters by title", async () => {
      mockFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
      mockQuery.mockResolvedValue([]);

      const res = await supertest(app)
        .get("/api/datasets?filters[title]=switchgrass&nofacets=true");

      expect(res.status).toBe(200);
      expect(mockFindAndCountAll).toHaveBeenCalledOnce();
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

    it("returns fallback facets when facet query fails", async () => {
      mockFindAndCountAll.mockResolvedValue({
        count: 1,
        rows: [{ toClientJSON: () => ({ uid: "1", title: "Dataset A" }) }],
      });

      mockQuery.mockRejectedValue(new Error("facet query failed"));

      const res = await supertest(app).get("/api/datasets");

      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([{ uid: "1", title: "Dataset A" }]);
      expect(res.body.facets).toEqual({
        year: {},
        brc: {},
        repository: {},
        species: {},
        topic: {},
        theme: {},
      });
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

  describe("GET /api/datasets/latest", () => {
    it("returns flattened latest datasets by BRC", async () => {
      mockQuery.mockResolvedValue([
        {
          uid: "CABBI_1",
          schema_version: "0.1.12",
          json: {
            brc: "CABBI",
            title: "CABBI dataset",
            identifier: "cabbi-1",
          },
          createdAt: "2026-04-29T14:49:16.200Z",
          updatedAt: "2026-04-29T14:49:16.200Z",
        },
        {
          uid: "JBEI_1",
          schema_version: "0.1.12",
          json: {
            brc: "JBEI",
            title: "JBEI dataset",
            identifier: "jbei-1",
          },
          createdAt: "2026-04-29T14:49:08.382Z",
          updatedAt: "2026-04-29T14:49:08.382Z",
        },
      ]);

      const res = await supertest(app).get("/api/datasets/latest");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        items: [
          {
            brc: "CABBI",
            title: "CABBI dataset",
            identifier: "cabbi-1",
            uid: "CABBI_1",
            schema_version: "0.1.12",
            created_at: "2026-04-29T14:49:16.200Z",
            updated_at: "2026-04-29T14:49:16.200Z",
          },
          {
            brc: "JBEI",
            title: "JBEI dataset",
            identifier: "jbei-1",
            uid: "JBEI_1",
            schema_version: "0.1.12",
            created_at: "2026-04-29T14:49:08.382Z",
            updated_at: "2026-04-29T14:49:08.382Z",
          },
        ],
      });
    });

    it("returns 500 when latest-by-brc query fails", async () => {
      mockQuery.mockRejectedValue(new Error("db error"));

      const res = await supertest(app).get("/api/datasets/latest");

      expect(res.status).toBe(500);
      expect(res.body.message).toContain("Error retrieving latest datasets by BRC");
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

  describe("GET /api/datasets/lookup/:uid", () => {
    it("returns related datasets for a source dataset uid", async () => {
      mockFindByPk.mockResolvedValue({
        uid: "GLBRC_GSE218642",
        json: {
          identifier: "GSE218642",
          dataset_url: "",
        },
      });

      mockFindAll.mockResolvedValue([
        {
          uid: "CABBI_GSE218642",
          json: {
            brc: "CABBI",
            identifier: "GSE218642",
            dataset_url: "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE218642",
          },
        },
        {
          uid: "GLBRC_GSE218642",
          json: {
            brc: "GLBRC",
            identifier: "GSE218642",
            dataset_url: null,
          },
        },
      ]);

      const res = await supertest(app).get("/api/datasets/lookup/GLBRC_GSE218642");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        uid: "GLBRC_GSE218642",
        identifier: "GSE218642",
        dataset_url: null,
        count: 2,
        datasets: [
          {
            uid: "CABBI_GSE218642",
            brc: "CABBI",
            identifier: "GSE218642",
            dataset_url: "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE218642",
            is_source: false,
          },
          {
            uid: "GLBRC_GSE218642",
            brc: "GLBRC",
            identifier: "GSE218642",
            dataset_url: null,
            is_source: true,
          },
        ],
      });
    });

    it("returns 404 when source dataset is not found", async () => {
      mockFindByPk.mockResolvedValue(null);

      const res = await supertest(app).get("/api/datasets/lookup/DOES_NOT_EXIST");

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Dataset not found");
    });

    it("returns 400 when source dataset has neither identifier nor dataset_url", async () => {
      mockFindByPk.mockResolvedValue({
        uid: "EMPTY_SOURCE",
        json: {
          identifier: "",
          dataset_url: "",
        },
      });

      const res = await supertest(app).get("/api/datasets/lookup/EMPTY_SOURCE");

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("identifier or dataset_url");
    });

    it("returns 500 when source dataset lookup fails", async () => {
      mockFindByPk.mockRejectedValue(new Error("db error"));

      const res = await supertest(app).get("/api/datasets/lookup/GLBRC_GSE218642");

      expect(res.status).toBe(500);
      expect(res.body.message).toContain("db error");
    });

    it("returns 500 when related dataset lookup fails", async () => {
      mockFindByPk.mockResolvedValue({
        uid: "GLBRC_GSE218642",
        json: {
          identifier: "GSE218642",
          dataset_url: "",
        },
      });

      mockFindAll.mockRejectedValue(new Error("db error"));

      const res = await supertest(app).get("/api/datasets/lookup/GLBRC_GSE218642");

      expect(res.status).toBe(500);
      expect(res.body.message).toContain("db error");
    });

    it("looks up related datasets by identifier when dataset_url is missing", async () => {
      mockFindByPk.mockResolvedValue({
        uid: "GLBRC_GSE218642",
        json: {
          identifier: "GSE218642",
          dataset_url: ""
        }
      });

      mockFindAll.mockResolvedValue([
        {
          uid: "GLBRC_GSE218642",
          json: {
            brc: "GLBRC",
            identifier: "GSE218642",
            dataset_url: null
          }
        }
      ]);

      const res = await supertest(app).get("/api/datasets/lookup/GLBRC_GSE218642");

      expect(res.status).toBe(200);
      expect(mockFindAll).toHaveBeenCalledOnce();
      expect(res.body).toEqual({
        uid: "GLBRC_GSE218642",
        identifier: "GSE218642",
        dataset_url: null,
        count: 1,
        datasets: [
          {
            uid: "GLBRC_GSE218642",
            brc: "GLBRC",
            identifier: "GSE218642",
            dataset_url: null,
            is_source: true
          }
        ]
      });
    });

    it("returns null brc when related dataset json.brc is missing", async () => {
      mockFindByPk.mockResolvedValue({
        uid: "SOURCE_1",
        json: {
          identifier: "ABC123",
          dataset_url: ""
        }
      });

      mockFindAll.mockResolvedValue([
        {
          uid: "SOURCE_1",
          json: {
            identifier: "ABC123",
            dataset_url: null
          }
        },
        {
          uid: "MATCH_1",
          json: {
            identifier: "ABC123",
            dataset_url: null
          }
        }
      ]);

      const res = await supertest(app).get("/api/datasets/lookup/SOURCE_1");

      expect(res.status).toBe(200);
      expect(res.body.datasets).toEqual([
        {
          uid: "SOURCE_1",
          brc: null,
          identifier: "ABC123",
          dataset_url: null,
          is_source: true
        },
        {
          uid: "MATCH_1",
          brc: null,
          identifier: "ABC123",
          dataset_url: null,
          is_source: false
        }
      ]);
    });
    
    it("looks up related datasets by dataset_url when identifier is missing", async () => {
      mockFindByPk.mockResolvedValue({
        uid: "JBEI_SOURCE",
        json: {
          identifier: "",
          dataset_url: "https://doi.org/example"
        }
      });

      mockFindAll.mockResolvedValue([
        {
          uid: "JBEI_SOURCE",
          json: {
            brc: "JBEI",
            identifier: null,
            dataset_url: "https://doi.org/example"
          }
        },
        {
          uid: "CABBI_MATCH",
          json: {
            brc: "CABBI",
            identifier: null,
            dataset_url: "https://doi.org/example"
          }
        }
      ]);

      const res = await supertest(app).get("/api/datasets/lookup/JBEI_SOURCE");

      expect(res.status).toBe(200);
      expect(mockFindAll).toHaveBeenCalledOnce();
      expect(res.body).toEqual({
        uid: "JBEI_SOURCE",
        identifier: null,
        dataset_url: "https://doi.org/example",
        count: 2,
        datasets: [
          {
            uid: "JBEI_SOURCE",
            brc: "JBEI",
            identifier: null,
            dataset_url: "https://doi.org/example",
            is_source: true
          },
          {
            uid: "CABBI_MATCH",
            brc: "CABBI",
            identifier: null,
            dataset_url: "https://doi.org/example",
            is_source: false
          }
        ]
      });
    });

    it("returns 400 when lookup uid is blank", async () => {
      const res = await supertest(app).get("/api/datasets/lookup/%20");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Dataset uid is required."
      });
    });

    // Note: This ends up falling through to "/api/datasets/:uid" and we get 500 "Error retrieving Dataset with identifier: lookup"
    // Is this expected behavior?
    // it("returns 400 when uid is empty", async () => {
    //   const res = await supertest(app).get("/api/datasets/lookup/");

    //   expect(res.status).toBe(400);
    //   expect(res.body).toEqual({
    //     message: "Dataset uid is required."
    //   });
    // });
  });
});