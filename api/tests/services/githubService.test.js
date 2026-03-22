// Mock Octokit before importing the service
const mockPaginate = vi.fn();
const mockListComments = vi.fn();
const mockCreateComment = vi.fn();
const mockCreateIssue = vi.fn();

vi.mock("@octokit/rest", () => {
  function MockOctokit() {
    this.paginate = mockPaginate;
    this.issues = {
      listForRepo: "listForRepo",
      listComments: mockListComments,
      createComment: mockCreateComment,
      create: mockCreateIssue,
    };
  }
  return { Octokit: MockOctokit };
});

describe("syncIssueComment", () => {
  let syncIssueComment;

  beforeEach(() => {
    vi.resetModules();
    mockPaginate.mockReset();
    mockListComments.mockReset();
    mockCreateComment.mockReset();
    mockCreateIssue.mockReset();
  });

  async function loadService(envOverrides = {}) {
    process.env.GITHUB_SERVICE_ENABLED = envOverrides.enabled ?? "true";
    process.env.GITHUB_SERVICE_WRITE_ENABLED = envOverrides.write ?? "true";
    ({ syncIssueComment } = await import("../../app/services/githubService"));
  }

  it("returns false when service is disabled", async () => {
    await loadService({ enabled: "false" });
    const result = await syncIssueComment("Test Title", "body text");
    expect(result).toBe(false);
    expect(mockPaginate).not.toHaveBeenCalled();
  });

  it("creates a new issue when no matching issue exists", async () => {
    await loadService();
    mockPaginate.mockResolvedValue([]); // no existing issues
    mockCreateIssue.mockResolvedValue({});

    const result = await syncIssueComment("New Issue", "issue body", { labels: "sync" });
    expect(result).toBe(true);
    expect(mockCreateIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New Issue",
        body: "issue body",
        labels: ["sync"],
      })
    );
  });

  it("returns false when write is disabled and issue does not exist", async () => {
    await loadService({ write: "false" });
    mockPaginate.mockResolvedValue([]);

    const result = await syncIssueComment("Title", "body");
    expect(result).toBe(false);
    expect(mockCreateIssue).not.toHaveBeenCalled();
  });

  it("returns false when max issue limit is reached", async () => {
    await loadService();
    const manyIssues = Array.from({ length: 200 }, (_, i) => ({ title: `Issue ${i}`, number: i }));
    mockPaginate.mockResolvedValue(manyIssues);

    const result = await syncIssueComment("Title", "body");
    expect(result).toBe(false);
  });

  it("adds a comment when existing issue body differs", async () => {
    await loadService();
    mockPaginate.mockResolvedValue([{ title: "Existing", number: 1, body: "old body" }]);
    mockListComments.mockResolvedValue({ data: [] });
    mockCreateComment.mockResolvedValue({});

    const result = await syncIssueComment("Existing", "new body", { labels: "sync" });
    expect(result).toBe(true);
    expect(mockCreateComment).toHaveBeenCalledWith(
      expect.objectContaining({
        issue_number: 1,
        body: "new body",
      })
    );
  });

  it("returns true without updating when latest comment matches", async () => {
    await loadService();
    mockPaginate.mockResolvedValue([{ title: "Existing", number: 1, body: "original" }]);
    mockListComments.mockResolvedValue({ data: [{ body: "new body" }] });

    const result = await syncIssueComment("Existing", "new body", { labels: "sync" });
    expect(result).toBe(true);
    expect(mockCreateComment).not.toHaveBeenCalled();
  });

  it("returns false when comment limit is reached", async () => {
    await loadService();
    const manyComments = Array.from({ length: 100 }, (_, i) => ({ body: `comment ${i}` }));
    mockPaginate.mockResolvedValue([{ title: "Existing", number: 1, body: "old" }]);
    mockListComments.mockResolvedValue({ data: manyComments });

    const result = await syncIssueComment("Existing", "new body", { labels: "sync" });
    expect(result).toBe(false);
  });

  it("skips update when issue body matches and no comments exist", async () => {
    await loadService();
    mockPaginate.mockResolvedValue([{ title: "Existing", number: 1, body: "same body" }]);
    mockListComments.mockResolvedValue({ data: [] });

    await syncIssueComment("Existing", "same body", { labels: "sync" });
    expect(mockCreateComment).not.toHaveBeenCalled();
  });

  it("returns false when write disabled and issue body differs", async () => {
    await loadService({ write: "false" });
    mockPaginate.mockResolvedValue([{ title: "Existing", number: 1, body: "old body" }]);
    mockListComments.mockResolvedValue({ data: [] });

    const result = await syncIssueComment("Existing", "new body", { labels: "sync" });
    expect(result).toBe(false);
    expect(mockCreateComment).not.toHaveBeenCalled();
  });

  it("returns false when Octokit throws an error", async () => {
    await loadService();
    mockPaginate.mockRejectedValue(new Error("GitHub API down"));

    const result = await syncIssueComment("Title", "body", { labels: "sync" });
    expect(result).toBe(false);
  });

  it("parses comma-separated labels into array", async () => {
    await loadService();
    mockPaginate.mockResolvedValue([]);
    mockCreateIssue.mockResolvedValue({});

    await syncIssueComment("Title", "body", { labels: "bug,contact-form" });

    expect(mockCreateIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        labels: ["bug", "contact-form"],
      })
    );
  });

  it("truncates title to 256 characters", async () => {
    await loadService();
    mockPaginate.mockResolvedValue([]);
    mockCreateIssue.mockResolvedValue({});

    const longTitle = "a".repeat(300);
    await syncIssueComment(longTitle, "body", { labels: "sync" });

    const createdTitle = mockCreateIssue.mock.calls[0][0].title;
    expect(createdTitle.length).toBe(256);
  });
});
