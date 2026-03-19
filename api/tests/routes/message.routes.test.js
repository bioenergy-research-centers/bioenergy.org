const supertest = require("supertest");
const { createApp } = require("../helpers/createApp");

// Mock by mutating shared module objects
const turnstileValidator = require("../../app/utils/turnstileValidator");
const githubService = require("../../app/services/githubService");
const mockValidateTurnstile = vi.fn();
const mockSyncIssueComment = vi.fn();
turnstileValidator.validateTurnstileForm = mockValidateTurnstile;
githubService.syncIssueComment = mockSyncIssueComment;

describe("POST /api/messages", () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createApp();
    const messageRoutes = require("../../app/routes/message.routes");
    app.use("/api/messages", messageRoutes);
  });

  const validMessage = {
    contact_name: "Alice",
    contact_email: "alice@example.com",
    contact_reason: "Data request",
    contact_comment: "I need dataset access",
    contact_affiliation: "MIT",
    cf: { turnstile: { response: "valid-token" } },
  };

  it("returns success when turnstile and github sync succeed", async () => {
    mockValidateTurnstile.mockResolvedValue(true);
    mockSyncIssueComment.mockResolvedValue(true);

    const res = await supertest(app).post("/api/messages").send(validMessage);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns error when turnstile validation fails", async () => {
    mockValidateTurnstile.mockResolvedValue(false);

    const res = await supertest(app).post("/api/messages").send(validMessage);
    expect(res.status).toBe(200);
    expect(res.body.error).toContain("verify you are human");
  });

  it("returns error when required fields are missing", async () => {
    mockValidateTurnstile.mockResolvedValue(true);

    const res = await supertest(app).post("/api/messages").send({
      contact_name: "Alice",
      cf: { turnstile: { response: "token" } },
    });
    expect(res.body.error).toContain("required fields");
  });

  it("returns error when github sync fails", async () => {
    mockValidateTurnstile.mockResolvedValue(true);
    mockSyncIssueComment.mockResolvedValue(false);

    const res = await supertest(app).post("/api/messages").send(validMessage);
    expect(res.body.error).toContain("error saving");
  });

  it("returns 500 when an unexpected error occurs", async () => {
    mockValidateTurnstile.mockRejectedValue(new Error("network failure"));

    const res = await supertest(app).post("/api/messages").send(validMessage);
    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });
});
