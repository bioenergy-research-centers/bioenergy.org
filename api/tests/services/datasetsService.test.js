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

  it("adds topic condition when topicQueryTerm is provided", async () => {
    await datasetsService.searchLocalDatasets({
      topicQueryTerm: "Microbiology",
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

  it("matches against the schema's json.contributors field, not json.contributor", async () => {
    await datasetsService.searchLocalDatasets({
      personNameQueryTerm: "Smith",
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];
    const [creatorClause, contributorsClause] = callArgs.where[db.Sequelize.Op.and][0][
      db.Sequelize.Op.or
    ];

    expect(creatorClause.attribute.path).toBe("json.creator");
    expect(contributorsClause.attribute.path).toBe("json.contributors");
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

  it("matches against json.contributors, not json.contributor, when personNameQueryTerm is an array", async () => {
    await datasetsService.searchLocalDatasets({
      personNameQueryTerm: ["Smith", "Jones"],
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];
    const [creatorClause, contributorsClause] = callArgs.where[db.Sequelize.Op.and][0][
      db.Sequelize.Op.or
    ];

    expect(creatorClause.attribute.path).toBe("json.creator");
    expect(contributorsClause.attribute.path).toBe("json.contributors");
  });

  it("adds topic condition when topicQueryTerm is an array", async () => {
    await datasetsService.searchLocalDatasets({
      topicQueryTerm: ["Microbiology", "Plant Biology"],
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).not.toEqual({});
  });

  it("ignores an empty topic array", async () => {
    await datasetsService.searchLocalDatasets({
      topicQueryTerm: [],
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).toEqual({});
  });

  it("adds a condition for an arbitrary topic value", async () => {
    await datasetsService.searchLocalDatasets({
      topicQueryTerm: "Unknown Topic",
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).not.toEqual({});
  });

  it("ignores an array containing only empty topic values", async () => {
    await datasetsService.searchLocalDatasets({
      topicQueryTerm: [""],
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).toEqual({});
  });

  it("adds a condition using only non-empty topic values", async () => {
    await datasetsService.searchLocalDatasets({
      topicQueryTerm: ["", "Microbiology"],
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).not.toEqual({});
  });

  it("includes facets when nofacets is false string", async () => {
    await datasetsService.searchLocalDatasets({ nofacets: "false" });

    expect(db.sequelize.query).toHaveBeenCalled();
  });

  it("includes facets when nofacets is 0 string", async () => {
    await datasetsService.searchLocalDatasets({ nofacets: "0" });

    expect(db.sequelize.query).toHaveBeenCalled();
  });

  it("skips facets when nofacets is true string", async () => {
    await datasetsService.searchLocalDatasets({ nofacets: "true" });

    expect(db.sequelize.query).not.toHaveBeenCalled();
  });

  it("adds from_date condition when from_date is provided", async () => {
    await datasetsService.searchLocalDatasets({
      from_date: "2025-01-01",
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).not.toEqual({});
  });

  it("adds until_date condition when until_date is provided", async () => {
    await datasetsService.searchLocalDatasets({
      until_date: "2025-12-31",
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).not.toEqual({});
  });

  it("adds date range conditions when from_date and until_date are provided", async () => {
    await datasetsService.searchLocalDatasets({
      from_date: "2025-01-01",
      until_date: "2025-12-31",
      nofacets: true,
    });

    const callArgs = mockFindAndCountAll.mock.calls[0][0];

    expect(callArgs.where).not.toEqual({});
  });

  
  it("builds stored-topic SQL with HTML entity normalization", async () => {
    const literalSpy = vi.spyOn(db.Sequelize, "literal");

    await datasetsService.searchLocalDatasets({
      topicQueryTerm: "Analytics & Methods",
      nofacets: true,
    });

    expect(literalSpy).toHaveBeenCalledWith(
      expect.stringContaining("replace(t.value, '&amp;', '&')")
    );
    expect(literalSpy).toHaveBeenCalledWith(
      expect.stringContaining("'Analytics & Methods'")
    );

    literalSpy.mockRestore();
  });

  it("generates facet SQL using the dataset alias for topic filters", async () => {
    await datasetsService.searchLocalDatasets({
      topicQueryTerm: "Microbiology",
    });

    expect(
      db.sequelize.dialect.queryGenerator.selectQuery
    ).toHaveBeenCalledWith(
      "datasets",
      expect.objectContaining({
        tableAs: "dataset",
        attributes: ["uid"],
      })
    );
  });

  it("normalizes HTML entities in topic facet values", async () => {
    db.sequelize.query.mockResolvedValue([]);

    await datasetsService.searchLocalDatasets({});

    const facetSql = db.sequelize.query.mock.calls[0][0];

    expect(facetSql).toContain(
      `replace(jsonb_array_elements_text(d."json"->'topic'), '&amp;', '&')`
    );
  });

  it("builds the personName facet against json.contributors, not json.contributor", async () => {
    await datasetsService.searchLocalDatasets({});

    const facetSql = db.sequelize.query.mock.calls[0][0];

    expect(facetSql).toContain(
      `jsonb_array_elements(d."json"->'contributors') AS cn(elem)`
    );
    expect(facetSql).toContain(`jsonb_typeof(d."json"->'contributors') = 'array'`);
  });
});