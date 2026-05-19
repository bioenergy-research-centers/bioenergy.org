const db = require("../../app/models");
const datasetsService = require("../../app/services/datasetsService");

const mockFindAndCountAll = vi.fn();

db.datasets.scope = vi.fn(() => ({
  findAndCountAll: mockFindAndCountAll,
  getTableName: () => "datasets",
}));

db.sequelize.query = vi.fn();
db.sequelize.dialect.queryGenerator.selectQuery = vi.fn(
  () => "SELECT uid FROM datasets WHERE true;"
);

describe("searchLocalDatasets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindAndCountAll.mockResolvedValue({
      count: 0,
      rows: [],
    });
    db.sequelize.query.mockResolvedValue([]);
  });

  it("returns paginated datasets when no filters provided", async () => {
    mockFindAndCountAll.mockResolvedValue({
      count: 1,
      rows: [
        { toClientJSON: () => ({ uid: "1", title: "Dataset A" }) },
      ],
    });

    const results = await datasetsService.searchLocalDatasets({ nofacets: true });

    expect(results).toEqual({
      totalResults: 1,
      totalPages: 1,
      query: {
        page: 1,
        rows: 50,
      },
      items: [{ uid: "1", title: "Dataset A" }],
      facets: null,
    });

    expect(mockFindAndCountAll).toHaveBeenCalledWith({
      order: [["json.date", "DESC"], ["uid", "ASC"]],
      where: {},
      limit: 50,
      offset: 0,
    });
  });

  it("uses page and rows for pagination", async () => {
    await datasetsService.searchLocalDatasets({
      page: "3",
      rows: "10",
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.limit).toBe(10);
    expect(callArgs.offset).toBe(20);
  });

  it("caps rows at 500", async () => {
    await datasetsService.searchLocalDatasets({
      rows: "9999",
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.limit).toBe(500);
    expect(callArgs.offset).toBe(0);
  });

  it("accepts legacy limit for pagination", async () => {
    await datasetsService.searchLocalDatasets({
      page: "2",
      limit: "25",
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.limit).toBe(25);
    expect(callArgs.offset).toBe(25);
  });

  it("prefers rows over legacy limit", async () => {
    await datasetsService.searchLocalDatasets({
      rows: "30",
      limit: "25",
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.limit).toBe(30);
  });

  it("adds text search condition when textQueryTerm is provided", async () => {
    await datasetsService.searchLocalDatasets({
      textQueryTerm: "ethanol",
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).toBeDefined();
    expect(callArgs.where).not.toEqual({});
  });

  it("handles OR boolean in text search", async () => {
    await datasetsService.searchLocalDatasets({
      textQueryTerm: "ethanol OR biomass",
      nofacets: true,
    });

    expect(mockFindAndCountAll).toHaveBeenCalled();
  });

  it("handles NOT boolean in text search", async () => {
    await datasetsService.searchLocalDatasets({
      textQueryTerm: "ethanol NOT corn",
      nofacets: true,
    });

    expect(mockFindAndCountAll).toHaveBeenCalled();
  });

  it("handles parentheses in text search", async () => {
    await datasetsService.searchLocalDatasets({
      textQueryTerm: "(ethanol OR biomass) cellulose",
      nofacets: true,
    });

    expect(mockFindAndCountAll).toHaveBeenCalled();
  });

  it("handles special token ! in text search", async () => {
    await datasetsService.searchLocalDatasets({
      textQueryTerm: "ethanol ! corn",
      nofacets: true,
    });

    expect(mockFindAndCountAll).toHaveBeenCalled();
  });

  it("adds title condition when titleQueryTerm is provided", async () => {
    await datasetsService.searchLocalDatasets({
      titleQueryTerm: "GLBRC Study",
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).not.toEqual({});
  });

  it("adds brc condition when brcQueryTerm is provided", async () => {
    await datasetsService.searchLocalDatasets({
      brcQueryTerm: "JBEI",
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).not.toEqual({});
  });

  it("adds brc condition when brcQueryTerm is an array", async () => {
    await datasetsService.searchLocalDatasets({
      brcQueryTerm: ["JBEI", "GLBRC"],
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).not.toEqual({});
  });

  it("adds repository condition when repositoryQueryTerm is provided", async () => {
    await datasetsService.searchLocalDatasets({
      repositoryQueryTerm: "JGI",
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).not.toEqual({});
  });

  it("adds analysisType condition when analysisTypeQueryTerm is provided", async () => {
    await datasetsService.searchLocalDatasets({
      analysisTypeQueryTerm: "genomics",
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).not.toEqual({});
  });

  it("adds species condition when speciesQueryTerm is provided", async () => {
    await datasetsService.searchLocalDatasets({
      speciesQueryTerm: "Saccharomyces",
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).not.toEqual({});
  });

  it("adds theme condition when themeQueryTerm is provided", async () => {
    await datasetsService.searchLocalDatasets({
      themeQueryTerm: "Sustainability",
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).not.toEqual({});
  });

  it("adds topic/category condition when categoryQueryTerm is provided", async () => {
    await datasetsService.searchLocalDatasets({
      categoryQueryTerm: "Microbiology",
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).not.toEqual({});
  });

  it("adds year condition when yearQueryTerm is provided", async () => {
    await datasetsService.searchLocalDatasets({
      yearQueryTerm: "2024",
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).not.toEqual({});
  });

  it("adds personName condition when personNameQueryTerm is provided", async () => {
    await datasetsService.searchLocalDatasets({
      personNameQueryTerm: "Smith",
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).not.toEqual({});
  });

  it("supports filters object", async () => {
    await datasetsService.searchLocalDatasets({
      filters: {
        title: "Study",
        brc: "JBEI",
        topic: "Microbiology",
        year: "2024",
        personName: "Smith",
        repository: "JGI",
        species: "Saccharomyces",
        analysisType: "genomics",
        theme: "Sustainability",
      },
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).not.toEqual({});
  });

  it("combines multiple filter conditions with Op.and", async () => {
    await datasetsService.searchLocalDatasets({
      textQueryTerm: "ethanol",
      titleQueryTerm: "Study",
      brcQueryTerm: "GLBRC",
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).toBeDefined();
    expect(callArgs.where).not.toEqual({});
  });

  it("runs facet query when facets are included", async () => {
    db.sequelize.query.mockResolvedValue([
      { facet: "brc", value: "JBEI", count: 2 },
    ]);

    const results = await datasetsService.searchLocalDatasets({});

    expect(db.sequelize.query).toHaveBeenCalled();
    expect(results.facets.brc).toEqual([{ value: "JBEI", count: 2 }]);
  });

  it("skips facet query when nofacets is true", async () => {
    await datasetsService.searchLocalDatasets({ nofacets: true });

    expect(db.sequelize.query).not.toHaveBeenCalled();
  });

  it("returns empty facets when facet query fails", async () => {
    db.sequelize.query.mockRejectedValue(new Error("facet query failed"));

    const results = await datasetsService.searchLocalDatasets({});

    expect(results.facets).toEqual({
      year: [],
      brc: [],
      repository: [],
      species: [],
      analysisType: [],
      personName: [],
      topic: [],
      theme: [],
    });
  });

  it("throws error when database query fails", async () => {
    mockFindAndCountAll.mockRejectedValue(new Error("connection error"));

    await expect(
      datasetsService.searchLocalDatasets({
        textQueryTerm: "test",
        nofacets: true,
      })
    ).rejects.toThrow("Some error occurred while retrieving Datasets.");
  });

  it("uses supportedOnly scope", async () => {
    await datasetsService.searchLocalDatasets({ nofacets: true });

    expect(db.datasets.scope).toHaveBeenCalledWith("supportedOnly");
  });

  it("adds repository condition when repositoryQueryTerm is an array", async () => {
    await datasetsService.searchLocalDatasets({
      repositoryQueryTerm: ["JGI", "NCBI"],
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];
    expect(callArgs.where).not.toEqual({});
  });

  it("adds analysisType condition when analysisTypeQueryTerm is an array", async () => {
    await datasetsService.searchLocalDatasets({
      analysisTypeQueryTerm: ["genomics", "proteomics"],
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];
    expect(callArgs.where).not.toEqual({});
  });

  it("adds species condition when speciesQueryTerm is an array", async () => {
    await datasetsService.searchLocalDatasets({
      speciesQueryTerm: ["Saccharomyces", "Escherichia"],
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];
    expect(callArgs.where).not.toEqual({});
  });

  it("adds theme condition when themeQueryTerm is an array", async () => {
    await datasetsService.searchLocalDatasets({
      themeQueryTerm: ["Sustainability", "Conversion"],
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];
    expect(callArgs.where).not.toEqual({});
  });

  it("adds year condition when yearQueryTerm is an array", async () => {
    await datasetsService.searchLocalDatasets({
      yearQueryTerm: ["2024", "2023"],
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];
    expect(callArgs.where).not.toEqual({});
  });

  it("adds personName condition when personNameQueryTerm is an array", async () => {
    await datasetsService.searchLocalDatasets({
      personNameQueryTerm: ["Smith", "Jones"],
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];
    expect(callArgs.where).not.toEqual({});
  });

  it("adds topic/category condition when categoryQueryTerm is an array", async () => {
    await datasetsService.searchLocalDatasets({
      categoryQueryTerm: ["Microbiology", "Plant Biology"],
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).not.toEqual({});
  });

  it("ignores empty category arrays", async () => {
    await datasetsService.searchLocalDatasets({
      categoryQueryTerm: [],
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).toEqual({});
  });

  it("ignores unknown category names", async () => {
    await datasetsService.searchLocalDatasets({
      categoryQueryTerm: "UnknownCategory",
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).toEqual({});
  });

  it("ignores empty category query values", async () => {
    await datasetsService.searchLocalDatasets({
      categoryQueryTerm: [""],
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).toEqual({});
  });

  it("ignores empty and unknown category filters", async () => {
    await datasetsService.searchLocalDatasets({
      categoryQueryTerm: ["", "Unknown Category"],
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).toEqual({});
  });
});