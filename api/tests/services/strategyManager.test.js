const iceSearchService = require("../../app/services/iceSearchService");

const mockSearchICE = vi.fn();
iceSearchService.searchICEInstance = mockSearchICE;

describe("strategyManager.runSearch", () => {
  let runSearch;

  beforeEach(() => {
    vi.clearAllMocks();
    ({ runSearch } = require("../../app/services/strategyManager"));
  });

  it("calls enabled search strategies and flattens results", async () => {
    mockSearchICE.mockResolvedValue([
      { title: "Result 1" },
      { title: "Result 2" },
    ]);

    const results = await runSearch("query", "ATCG");
    expect(results).toEqual([{ title: "Result 1" }, { title: "Result 2" }]);
    expect(mockSearchICE).toHaveBeenCalledWith("query", "ATCG");
  });

  it("returns empty array when strategy returns nothing", async () => {
    mockSearchICE.mockResolvedValue([]);
    const results = await runSearch("query", "ATCG");
    expect(results).toEqual([]);
  });
});
