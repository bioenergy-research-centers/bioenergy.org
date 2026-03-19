const axios = require("axios");
const datasetsService = require("../../app/services/datasetsService");

// Mock by mutating shared module objects
const mockAxiosPost = vi.fn();
axios.post = mockAxiosPost;
const mockSearchLocalDatasets = vi.fn();
datasetsService.searchLocalDatasets = mockSearchLocalDatasets;

describe("searchICEInstance", () => {
  let searchICEInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ICE_INSTANCE_URL = "https://ice.test.org";
    process.env.ICE_API_TOKEN_CLIENT = "client-token";
    process.env.ICE_API_TOKEN = "api-token";
    process.env.ICE_API_TOKEN_Owner = "owner-token";

    ({ searchICEInstance } = require("../../app/services/iceSearchService"));
  });

  it("returns intersected results between ICE and local datasets", async () => {
    mockAxiosPost.mockResolvedValue({
      data: {
        results: [
          {
            entryInfo: {
              name: "Strain A",
              creationTime: 1700000000000,
              owner: "Dr. Smith",
              partId: "JBEI-001",
              shortDescription: "Description A",
            },
          },
          {
            entryInfo: {
              name: "Strain B",
              creationTime: 1700000000000,
              owner: "Dr. Jones",
              partId: "JBEI-002",
              shortDescription: "Description B",
            },
          },
        ],
      },
    });

    mockSearchLocalDatasets.mockResolvedValue([
      { identifier: "JBEI-001", title: "Local Strain A" },
      { identifier: "JBEI-999", title: "Other" },
    ]);

    const results = await searchICEInstance("query", "ATCGATCG");
    expect(results).toHaveLength(1);
    expect(results[0].identifier).toBe("JBEI-001");
    expect(results[0].brc).toBe("JBEI");
    expect(results[0].repository).toBe("ICE");
  });

  it("throws when API tokens are missing", async () => {
    delete process.env.ICE_API_TOKEN;
    await expect(searchICEInstance("q", "ATCG")).rejects.toThrow("API tokens are missing");
  });

  it("sends correct headers to ICE API", async () => {
    process.env.ICE_API_TOKEN = "api-token";
    mockAxiosPost.mockResolvedValue({ data: { results: [] } });
    mockSearchLocalDatasets.mockResolvedValue([]);

    await searchICEInstance("query", "ATCG");

    expect(mockAxiosPost).toHaveBeenCalledWith(
      "https://ice.test.org/rest/search?searchWeb=true",
      expect.objectContaining({
        blastQuery: expect.objectContaining({ sequence: "ATCG" }),
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-ICE-API-Token-Client": "client-token",
          "X-ICE-API-Token": "api-token",
          "X-ICE-API-Token-Owner": "owner-token",
        }),
      })
    );
  });
});
