const {
  getRegistry,
  getPrefix,
  resetCache,
  bioregistry_api,
} = require("../../app/services/bioregistryClient");
const { enrichIds, parseCurie } = require("../../app/services/identifierEnrichment");

// Mock by mutating the shared module object
const mockBioregistryGet = vi.fn();
bioregistry_api.get = mockBioregistryGet;

describe("identifier enrichment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetCache();
  });

  afterEach(() => {
    resetCache();
    vi.useRealTimers();
  });

  it("parses only the first colon and leaves opaque identifiers alone", () => {
    expect(getPrefix("example:foo:bar:123")).toBe("example");
    expect(getPrefix("internal-id")).toBeNull();
    expect(getPrefix(42)).toBeNull();

    expect(parseCurie("example:foo:bar:123")).toEqual({
      id: "example:foo:bar:123",
      prefix: "example",
      localId: "foo:bar:123",
    });
    expect(parseCurie("internal-id")).toEqual({
      id: "internal-id",
      prefix: null,
      localId: "internal-id",
    });
  });

  it("enriches a known identifier and preserves the source value", async () => {
    mockBioregistryGet.mockResolvedValue({
      data: {
        prefix: "nmdc",
        name: "National Microbiome Data Collaborative",
        homepage: "https://microbiomedata.org/",
        uri_format: "https://example.org/$1",
        pattern: "^study-[0-9]+$",
      },
    });

    await expect(enrichIds(["NMDC:study-123"])).resolves.toEqual([
      {
        id: "NMDC:study-123",
        prefix: "NMDC",
        local_id: "study-123",
        registered: true,
        valid: true,
        url: "https://example.org/study-123",
        registry: {
          prefix: "nmdc",
          name: "National Microbiome Data Collaborative",
          homepage: "https://microbiomedata.org/",
          bioregistry_url: "https://bioregistry.io/registry/nmdc",
        },
      },
    ]);
  });

  it("uses one lookup for a large set with the same prefix", async () => {
    mockBioregistryGet.mockResolvedValue({
      data: { prefix: "biosample", name: "BioSample", uri_format: "https://example.org/$1" },
    });
    const ids = Array.from({ length: 100 }, (_, index) => `biosample:SAMN${index}`);

    const enriched = await enrichIds(ids);

    expect(mockBioregistryGet).toHaveBeenCalledTimes(1);
    expect(enriched).toHaveLength(100);
    expect(enriched[99].local_id).toBe("SAMN99");
  });

  it("returns unresolved values for unknown prefixes without failing", async () => {
    mockBioregistryGet.mockRejectedValue({ response: { status: 404 } });

    await expect(enrichIds(["unknown:123", "opaque-id"])).resolves.toEqual([
      {
        id: "unknown:123",
        prefix: "unknown",
        local_id: "123",
        registered: false,
        valid: null,
        url: null,
        registry: null,
      },
      {
        id: "opaque-id",
        prefix: null,
        local_id: "opaque-id",
        registered: false,
        valid: null,
        url: null,
        registry: null,
      },
    ]);

    await getRegistry("unknown");
    expect(mockBioregistryGet).toHaveBeenCalledTimes(1);
  });

  it("does not cache transient failures", async () => {
    mockBioregistryGet.mockRejectedValue(new Error("network unavailable"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await getRegistry("nmdc");
    await getRegistry("nmdc");

    expect(mockBioregistryGet).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it("shares one pending request for concurrent lookups", async () => {
    let resolveRequest;
    mockBioregistryGet.mockReturnValue(new Promise((resolve) => {
      resolveRequest = resolve;
    }));

    const first = getRegistry("nmdc");
    const second = getRegistry("NMDC");
    resolveRequest({ data: { prefix: "nmdc", name: "NMDC" } });

    await expect(Promise.all([first, second])).resolves.toEqual([
      { prefix: "nmdc", name: "NMDC" },
      { prefix: "nmdc", name: "NMDC" },
    ]);
    expect(mockBioregistryGet).toHaveBeenCalledTimes(1);
  });

  it("returns null validation when a pattern is absent or invalid", async () => {
    mockBioregistryGet
      .mockResolvedValueOnce({
        data: { prefix: "one", name: "One", uri_format: "https://one.example/$1" },
      })
      .mockResolvedValueOnce({
        data: { prefix: "two", name: "Two", pattern: "[", uri_format: "https://two.example/$1" },
      });

    const enriched = await enrichIds(["one:abc", "two:abc"]);

    expect(enriched.map((item) => item.valid)).toEqual([null, null]);
  });

  it("refreshes expired entries on the next lookup without a cleanup timer", async () => {
    vi.useFakeTimers();
    mockBioregistryGet
      .mockResolvedValueOnce({ data: { prefix: "nmdc", name: "NMDC" } })
      .mockResolvedValueOnce({ data: { prefix: "nmdc", name: "NMDC" } });

    await getRegistry("nmdc");
    await getRegistry("nmdc");
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);
    await getRegistry("nmdc");

    expect(mockBioregistryGet).toHaveBeenCalledTimes(2);
  });
});
