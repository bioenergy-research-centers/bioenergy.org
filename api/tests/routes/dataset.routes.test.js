const supertest = require("supertest");
const { createApp } = require("../helpers/createApp");

const db = require("../../app/models");
const Dataset = db.datasets;

const mockFindByPk = vi.fn();
const mockFindAll = vi.fn();
const mockCount = vi.fn();
const mockQuery = vi.fn();

db.datasets.scope = vi.fn(() => ({
  findByPk: mockFindByPk,
  count: mockCount,
}));

db.datasets.findByPk = mockFindByPk;
db.datasets.findAll = mockFindAll;

db.sequelize.query = mockQuery;

const datasetsService = require("../../app/services/datasetsService");
const strategyManager = require("../../app/services/strategyManager");

const mockSearchLocalDatasets = vi.fn();
const mockRunSearch = vi.fn();

datasetsService.searchLocalDatasets = mockSearchLocalDatasets;
strategyManager.runSearch = mockRunSearch;

const mockSearchResponse = {
  totalResults: 1,
  totalPages: 1,
  query: {
    page: 1,
    rows: 50,
  },
  items: [{ uid: "1", title: "Local" }],
  facets: null,
};

describe("dataset routes", () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSearchLocalDatasets.mockResolvedValue(mockSearchResponse);
    mockRunSearch.mockResolvedValue([]);

    app = createApp();

    const datasetRoutes = require("../../app/routes/dataset.routes");
    app.use("/api/datasets", datasetRoutes);
  });

  describe("GET /api/datasets", () => {
    it("passes query params to searchLocalDatasets", async () => {
      const res = await supertest(app).get(
        "/api/datasets?q=ethanol&page=2&rows=25&filters[brc]=JBEI&nofacets=true&from_date=2025-01-01&until_date=2025-12-31"
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockSearchResponse);
      expect(mockSearchLocalDatasets).toHaveBeenCalledWith({
        textQueryTerm: "ethanol",
        filters: {
          brc: "JBEI",
        },
        page: "2",
        rows: "25",
        limit: undefined,
        nofacets: "true",
        from_date: "2025-01-01",
        until_date: "2025-12-31",
        shape: undefined,
      });
    });

    it("passes multiple filter values to searchLocalDatasets", async () => {
      const res = await supertest(app).get(
        "/api/datasets?filters[brc]=JBEI&filters[brc]=GLBRC&filters[year]=2024&filters[year]=2023"
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockSearchResponse);
      expect(mockSearchLocalDatasets).toHaveBeenCalledWith({
        textQueryTerm: undefined,
        filters: {
          brc: ["JBEI", "GLBRC"],
          year: ["2024", "2023"],
        },
        page: undefined,
        rows: undefined,
        limit: undefined,
        nofacets: undefined,
        from_date: undefined,
        until_date: undefined,
        shape: undefined,
      });
    });

    it("passes legacy limit to searchLocalDatasets", async () => {
      const res = await supertest(app).get("/api/datasets?limit=25");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockSearchResponse);
      expect(mockSearchLocalDatasets).toHaveBeenCalledWith({
        textQueryTerm: undefined,
        filters: undefined,
        page: undefined,
        rows: undefined,
        limit: "25",
        nofacets: undefined,
        from_date: undefined,
        until_date: undefined,
        shape: undefined,
      });
    });

    it("returns 500 when dataset search fails", async () => {
      mockSearchLocalDatasets.mockRejectedValue(new Error("search failed"));

      const res = await supertest(app).get("/api/datasets?q=test");

      expect(res.status).toBe(500);
      expect(res.body.message).toContain("search failed");
    });
  });

  describe("GET /api/datasets/metrics", () => {
    it("returns aggregate metrics", async () => {
      mockCount.mockResolvedValue(150);
      mockQuery
        .mockResolvedValueOnce([{ count: 42 }])
        .mockResolvedValueOnce([{ count: 15 }])
        .mockResolvedValueOnce([{ count: 5 }]);

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
    it("returns paginated local results when no sequence provided", async () => {
      const res = await supertest(app)
        .post("/api/datasets")
        .send({ query: "test" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockSearchResponse);
      expect(mockSearchLocalDatasets).toHaveBeenCalledWith({
        textQueryTerm: "test",
        page: undefined,
        rows: undefined,
        limit: undefined,
        filters: undefined,
        nofacets: undefined,
        from_date: undefined,
        until_date: undefined,
        shape: undefined,
      });
    });

    it("passes pagination and filters for local search", async () => {
      const res = await supertest(app)
        .post("/api/datasets")
        .send({
          query: "ethanol",
          page: 2,
          rows: 25,
          filters: {
            brc: ["JBEI", "GLBRC"],
            year: "2024",
          },
          nofacets: true,
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockSearchResponse);
      expect(mockSearchLocalDatasets).toHaveBeenCalledWith({
        textQueryTerm: "ethanol",
        page: 2,
        rows: 25,
        limit: undefined,
        filters: {
          brc: ["JBEI", "GLBRC"],
          year: "2024",
        },
        nofacets: true,
        from_date: undefined,
        until_date: undefined,
        shape: undefined,
      });
    });

    it("passes legacy limit for local search", async () => {
      const res = await supertest(app)
        .post("/api/datasets")
        .send({
          query: "ethanol",
          limit: 25,
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockSearchResponse);
      expect(mockSearchLocalDatasets).toHaveBeenCalledWith({
        textQueryTerm: "ethanol",
        page: undefined,
        rows: undefined,
        limit: 25,
        filters: undefined,
        nofacets: undefined,
        from_date: undefined,
        until_date: undefined,
        shape: undefined,
      });
    });

    it("passes response shape for local search", async () => {
      const res = await supertest(app)
        .post("/api/datasets")
        .send({ query: "ethanol", shape: "list-item" });

      expect(res.status).toBe(200);
      expect(mockSearchLocalDatasets).toHaveBeenCalledWith({
        textQueryTerm: "ethanol",
        page: undefined,
        rows: undefined,
        limit: undefined,
        filters: undefined,
        nofacets: undefined,
        from_date: undefined,
        until_date: undefined,
        shape: "list-item",
      });
    });

    it("runs federated search when sequence is provided", async () => {
      mockRunSearch.mockResolvedValue([{ title: "ICE Result" }]);

      const res = await supertest(app)
        .post("/api/datasets")
        .send({ query: "test", sequence: "ATCGATCG" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ title: "ICE Result" }]);
      expect(mockRunSearch).toHaveBeenCalledWith("test", "ATCGATCG");
      expect(mockSearchLocalDatasets).not.toHaveBeenCalled();
    });

    it("returns 500 on local search error", async () => {
      mockSearchLocalDatasets.mockRejectedValue(new Error("search failed"));

      const res = await supertest(app)
        .post("/api/datasets")
        .send({ query: "test" });

      expect(res.status).toBe(500);
      expect(res.body.message).toContain("Search failed");
    });

    it("returns 500 on federated search error", async () => {
      mockRunSearch.mockRejectedValue(new Error("sequence search failed"));

      const res = await supertest(app)
        .post("/api/datasets")
        .send({ query: "test", sequence: "ATCGATCG" });

      expect(res.status).toBe(500);
      expect(res.body.message).toContain("Search failed");
    });
  });

  describe("GET /api/datasets/lookup/:uid", () => {

    beforeEach(() => {
      // mock related item queries to empty array by default
      mockQuery.mockResolvedValue([]);
    });

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
            dataset_url:
              "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE218642",
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

      const res = await supertest(app).get(
        "/api/datasets/lookup/GLBRC_GSE218642"
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        uid: "GLBRC_GSE218642",
        identifier: "GSE218642",
        dataset_url: null,
        count: 2,
        shared_related_item_datasets: [],
        datasets: [
          {
            uid: "CABBI_GSE218642",
            brc: "CABBI",
            identifier: "GSE218642",
            dataset_url:
              "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE218642",
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

      const res = await supertest(app).get(
        "/api/datasets/lookup/DOES_NOT_EXIST"
      );

      expect(res.status).toBe(404);
      expect(res.body.message).toContain("Dataset not found");
    });

    it("returns 400 when source dataset has no identifier, dataset_url, or related_items", async () => {
      mockFindByPk.mockResolvedValue({
        uid: "EMPTY_SOURCE",
        json: {
          identifier: "",
          dataset_url: "",
          related_item: []
        },
      });

      const res = await supertest(app).get(
        "/api/datasets/lookup/EMPTY_SOURCE"
      );

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("dentifier, dataset_url, or related item identifier");
    });

    it("returns shared related item dataset matches", async () => {
      mockFindByPk.mockResolvedValue({
        uid: "BRC_1234",
        json: {
          identifier: "1234",
          dataset_url: "",
          relatedItem: [
            {
              title: "Shared article",
              relatedItemType: "JournalArticle",
              relatedItemIdentifier: "https://example.org/article"
            }
          ]
        },
      });

      mockFindAll.mockResolvedValue([
        {
          uid: "BRC_1234",
          json: {
            brc: "GLBRC",
            identifier: "1234",
            dataset_url: null,
          },
        },
      ]);

      mockQuery.mockResolvedValue([
        Dataset.build({
          uid: "RELATED_A",
          json: {
            brc: "CABBI",
            identifier: "A",
            dataset_url: "https://repo.org/a",
          },
          related_item_identifier: "https://example.org/article",
        }),
        Dataset.build({
          uid: "RELATED_B",
          json: {
            brc: "JBEI",
            identifier: "B",
            dataset_url: "https://repo.org/b",
          },
          related_item_identifier: "https://example.org/article",
        }),
      ]);

      const res = await supertest(app).get("/api/datasets/lookup/BRC_1234");

      expect(res.status).toBe(200);
      expect(res.body.shared_related_item_datasets).toEqual([
        expect.objectContaining({
          uid: "RELATED_A",
          brc: "CABBI",
          identifier: "A",
          dataset_url: "https://repo.org/a"
        }),
        expect.objectContaining({
          uid: "RELATED_B",
          brc: "JBEI",
          identifier: "B",
          dataset_url: "https://repo.org/b"
        }),
      ]);
      expect(mockQuery).toHaveBeenCalled();
    });

    it("returns empty shared related item matches when source relatedItem is empty", async () => {
      mockFindByPk.mockResolvedValue({
        uid: "SOURCE_UID",
        json: {
          identifier: "SOURCE_IDENTIFIER",
          dataset_url: "",
          relatedItem: [],
        },
      });

      mockFindAll.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets/lookup/SOURCE_UID");

      expect(res.status).toBe(200);
      expect(res.body.shared_related_item_datasets).toEqual([]);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("returns empty shared related item matches when source relatedItem is invalid", async () => {
      mockFindByPk.mockResolvedValue({
        uid: "SOURCE_UID",
        json: {
          identifier: "SOURCE_IDENTIFIER",
          dataset_url: "",
          relatedItem: "invalidstring",
        },
      });

      mockFindAll.mockResolvedValue([]);

      const res = await supertest(app).get("/api/datasets/lookup/SOURCE_UID");

      expect(res.status).toBe(200);
      expect(res.body.shared_related_item_datasets).toEqual([]);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it("returns 500 when source dataset lookup fails", async () => {
      mockFindByPk.mockRejectedValue(new Error("db error"));

      const res = await supertest(app).get(
        "/api/datasets/lookup/GLBRC_GSE218642"
      );

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

      const res = await supertest(app).get(
        "/api/datasets/lookup/GLBRC_GSE218642"
      );

      expect(res.status).toBe(500);
      expect(res.body.message).toContain("db error");
    });
  });

  it("uses dataset_url when looking up related datasets", async () => {
    mockFindByPk.mockResolvedValue({
      uid: "SOURCE_UID",
      json: {
        identifier: "",
        dataset_url: "https://example.org/dataset",
      },
    });

    mockFindAll.mockResolvedValue([
      {
        uid: "SOURCE_UID",
        json: {
          brc: "JBEI",
          identifier: "",
          dataset_url: "https://example.org/dataset",
        },
      },
    ]);

    const res = await supertest(app).get("/api/datasets/lookup/SOURCE_UID");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      uid: "SOURCE_UID",
      identifier: null,
      dataset_url: "https://example.org/dataset",
      count: 1,
      shared_related_item_datasets: [],
      datasets: [
        {
          uid: "SOURCE_UID",
          brc: "JBEI",
          identifier: "",
          dataset_url: "https://example.org/dataset",
          is_source: true,
        },
      ],
    });

    expect(mockFindAll).toHaveBeenCalled();
  });

  it("passes date range query params to searchLocalDatasets", async () => {
    const res = await supertest(app).get(
      "/api/datasets?q=ethanol&from_date=2025-01-01&until_date=2025-12-31"
    );

    expect(res.status).toBe(200);
    expect(mockSearchLocalDatasets).toHaveBeenCalledWith({
      textQueryTerm: "ethanol",
      filters: undefined,
      page: undefined,
      rows: undefined,
      limit: undefined,
      nofacets: undefined,
      from_date: "2025-01-01",
      until_date: "2025-12-31",
      shape: undefined,
    });
  });
});
