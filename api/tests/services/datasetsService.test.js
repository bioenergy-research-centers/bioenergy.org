const db = require("../../app/models");
const datasetsService = require("../../app/services/datasetsService");

// Mock the Dataset model via mutation
const mockFindAll = vi.fn();
db.datasets.scope = vi.fn(() => ({
  findAll: mockFindAll,
}));

describe("searchLocalDatasets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all datasets when no filters provided", async () => {
    mockFindAll.mockResolvedValue([
      { toClientJSON: () => ({ uid: "1", title: "Dataset A" }) },
    ]);

    const results = await datasetsService.searchLocalDatasets({});
    expect(results).toEqual([{ uid: "1", title: "Dataset A" }]);
    expect(mockFindAll).toHaveBeenCalledWith({ where: {} });
  });

  it("adds text search condition when textQueryTerm is provided", async () => {
    mockFindAll.mockResolvedValue([]);

    await datasetsService.searchLocalDatasets({ textQueryTerm: "ethanol" });

    const callArgs = mockFindAll.mock.calls[0][0];
    expect(callArgs.where).toBeDefined();
    expect(callArgs.where).not.toEqual({});
  });

  it("handles OR boolean in text search", async () => {
    mockFindAll.mockResolvedValue([]);
    await datasetsService.searchLocalDatasets({ textQueryTerm: "ethanol OR biomass" });
    expect(mockFindAll).toHaveBeenCalled();
  });

  it("handles NOT boolean in text search", async () => {
    mockFindAll.mockResolvedValue([]);
    await datasetsService.searchLocalDatasets({ textQueryTerm: "ethanol NOT corn" });
    expect(mockFindAll).toHaveBeenCalled();
  });

  it("handles parentheses in text search", async () => {
    mockFindAll.mockResolvedValue([]);
    await datasetsService.searchLocalDatasets({ textQueryTerm: "(ethanol OR biomass) cellulose" });
    expect(mockFindAll).toHaveBeenCalled();
  });

  it("handles special token ! in text search", async () => {
    mockFindAll.mockResolvedValue([]);
    await datasetsService.searchLocalDatasets({ textQueryTerm: "ethanol ! corn" });
    expect(mockFindAll).toHaveBeenCalled();
  });

  it("adds title condition when titleQueryTerm is provided", async () => {
    mockFindAll.mockResolvedValue([]);

    await datasetsService.searchLocalDatasets({ titleQueryTerm: "GLBRC Study" });

    const callArgs = mockFindAll.mock.calls[0][0];
    expect(callArgs.where).not.toEqual({});
  });

  it("adds brc condition when brcQueryTerm is provided", async () => {
    mockFindAll.mockResolvedValue([]);

    await datasetsService.searchLocalDatasets({ brcQueryTerm: "JBEI" });

    const callArgs = mockFindAll.mock.calls[0][0];
    expect(callArgs.where).not.toEqual({});
  });

  it("combines multiple filter conditions with Op.and", async () => {
    mockFindAll.mockResolvedValue([]);

    await datasetsService.searchLocalDatasets({
      textQueryTerm: "ethanol",
      titleQueryTerm: "Study",
      brcQueryTerm: "GLBRC",
    });

    const callArgs = mockFindAll.mock.calls[0][0];
    expect(callArgs.where).toBeDefined();
  });

  it("throws error when database query fails", async () => {
    mockFindAll.mockRejectedValue(new Error("connection error"));

    await expect(
      datasetsService.searchLocalDatasets({ textQueryTerm: "test" })
    ).rejects.toThrow("Some error occurred while retrieving Datasets.");
  });

  it("uses supportedOnly scope", async () => {
    mockFindAll.mockResolvedValue([]);

    await datasetsService.searchLocalDatasets({});

    expect(db.datasets.scope).toHaveBeenCalledWith("supportedOnly");
  });
});
