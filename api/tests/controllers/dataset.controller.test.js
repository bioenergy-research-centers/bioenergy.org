const datasetsController = require("../../app/controllers/dataset.controller");

describe("dataset.controller lookupByUid", () => {
  it("returns 400 when uid is missing", async () => {
    const req = {
      params: {},
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    await datasetsController.lookupByUid(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: "Dataset uid is required.",
    });
  });
});