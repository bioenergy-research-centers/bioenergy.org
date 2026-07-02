const { validateUploadedFeed } = require("../../app/controllers/validate.controller");

describe("validateUploadedFeed", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 500 when an unexpected error occurs", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const req = {
      body: {
        schema_version: "0.1.15",
        datasets: [],
      },
      query: null,
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await validateUploadedFeed(req, res);

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Internal server error",
    });
  });

  it("returns 400 when request body is missing", async () => {
    const req = {
      body: undefined,
      query: {},
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await validateUploadedFeed(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Request body must be valid JSON",
    });
  });
});