const controller = require("../../app/controllers/dataset.controller");
const db = require("../../app/models");

const mockFindByPk = vi.fn();
const mockFindAll = vi.fn();
const mockWhere = vi.fn((lhs, rhs) => ({ lhs, rhs }));
const mockJson = vi.fn((path) => `JSON(${path})`);

db.datasets.findByPk = mockFindByPk;
db.datasets.findAll = mockFindAll;
db.Sequelize.where = mockWhere;
db.Sequelize.json = mockJson;

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    send: vi.fn(),
    json: vi.fn(),
  };
}

describe("dataset.controller", () => {
  describe("lookupByUid", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("treats missing uid param as empty string", async () => {
        const req = { params: {} };
        const res = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn(),
        };

        await controller.lookupByUid(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
            message: "Dataset uid is required."
        });
    });

    it("treats null uid param as empty string", async () => {
        const req = { params: { uid: null } };
        const res = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn(),
        };

        await controller.lookupByUid(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        });
    });
});