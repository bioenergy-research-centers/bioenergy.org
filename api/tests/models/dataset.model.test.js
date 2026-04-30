const { Sequelize } = require("sequelize");
const defineDataset = require("../../app/models/dataset.model");

describe("Dataset model", () => {
  let sequelize;
  let Dataset;

  beforeAll(() => {
    sequelize = new Sequelize("postgres://postgres:postgres@localhost:5432/testdb", {
      dialect: "postgres",
      logging: false,
    });

    Dataset = defineDataset(sequelize, Sequelize);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe("toClientJSON", () => {
    it("merges schema_version, uid, and timestamps into the json object", () => {
      const createdAt = new Date("2025-01-01T00:00:00Z");
      const updatedAt = new Date("2025-06-01T00:00:00Z");

      const instance = Dataset.build({
        uid: "abc-123",
        schema_version: "0.1.7",
        json: { title: "Test Dataset", brc: "GLBRC" },
      });

      instance.createdAt = createdAt;
      instance.updatedAt = updatedAt;

      const result = instance.toClientJSON();

      expect(result.title).toBe("Test Dataset");
      expect(result.brc).toBe("GLBRC");
      expect(result.schema_version).toBe("0.1.7");
      expect(result.uid).toBe("abc-123");
      expect(result.created_at).toEqual(createdAt);
      expect(result.updated_at).toEqual(updatedAt);
    });

    it("uses the default schema_version when one is not provided", () => {
      const instance = Dataset.build({
        uid: "default-version",
        json: { title: "Dataset" },
      });

      const result = instance.toClientJSON();

      expect(result.schema_version).toBe("0.0.8");
      expect(result.uid).toBe("default-version");
    });
  });

  describe("json field sanitization", () => {
    it("strips disallowed HTML tags from string values", () => {
      const instance = Dataset.build({
        uid: "sanitize-script",
        json: { title: "<script>alert(1)</script>Hello" },
      });

      expect(instance.json.title).toBe("Hello");
      expect(instance.json.title).not.toContain("<script>");
    });

    it("allows permitted tags (b, i, sub, sup)", () => {
      const instance = Dataset.build({
        uid: "sanitize-allowed",
        json: { title: "H<sub>2</sub>O is <b>water</b>" },
      });

      expect(instance.json.title).toBe("H<sub>2</sub>O is <b>water</b>");
    });

    it("does not modify non-string values", () => {
      const instance = Dataset.build({
        uid: "sanitize-non-string",
        json: { count: 42, active: true, tags: ["a", "b"] },
      });

      expect(instance.json.count).toBe(42);
      expect(instance.json.active).toBe(true);
      expect(instance.json.tags).toEqual(["a", "b"]);
    });

    it("sanitizes nested string values", () => {
      const instance = Dataset.build({
        uid: "sanitize-nested",
        json: {
          creator: [{ name: "<img onerror=alert(1)>Dr. Smith" }],
        },
      });

      expect(instance.json.creator[0].name).toBe("Dr. Smith");
    });

    it("strips div and span tags but keeps text", () => {
      const instance = Dataset.build({
        uid: "sanitize-div-span",
        json: { desc: "<div>Some <span>text</span></div>" },
      });

      expect(instance.json.desc).toBe("Some text");
    });
  });
});