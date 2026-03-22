describe("validateTurnstileForm", () => {
  let validateTurnstileForm;

  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn());
  });

  async function loadModule() {
    ({ validateTurnstileForm } = await import("../../app/utils/turnstileValidator"));
  }

  it("returns true when turnstile verification succeeds", async () => {
    fetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });
    await loadModule();

    const req = { body: { cf: { turnstile: { response: "valid-token" } } } };
    const result = await validateTurnstileForm(req);

    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("returns false when turnstile verification fails", async () => {
    fetch.mockResolvedValue({
      json: () => Promise.resolve({ success: false, "error-codes": ["invalid-input-response"] }),
    });
    await loadModule();

    const req = { body: { cf: { turnstile: { response: "bad-token" } } } };
    const result = await validateTurnstileForm(req);

    expect(result).toBe(false);
  });

  it("sends the token and secret key in the request body", async () => {
    fetch.mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });
    await loadModule();

    const req = { body: { cf: { turnstile: { response: "my-token" } } } };
    await validateTurnstileForm(req);

    const callBody = JSON.parse(fetch.mock.calls[0][1].body);
    expect(callBody.response).toBe("my-token");
    expect(callBody.secret).toBe("test-secret");
  });
});
