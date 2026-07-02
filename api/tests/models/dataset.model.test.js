const db = require("../../app/models");

describe("Dataset model", () => {
  const Dataset = db.datasets;

  describe("toClientJSON", () => {
    it("merges schema_version, uid, and timestamps into the json object", () => {
      const instance = Dataset.build({
        uid: "abc-123",
        schema_version: "0.1.15",
        json: {
          title: "Test Dataset",
          brc: "GLBRC",
        },
      });

      instance.createdAt = new Date("2025-01-01");
      instance.updatedAt = new Date("2025-06-01");

      const result = instance.toClientJSON();

      expect(result).toMatchObject({
        title: "Test Dataset",
        brc: "GLBRC",
        schema_version: "0.1.15",
        uid: "abc-123",
      });
      expect(result.created_at).toEqual(new Date("2025-01-01"));
      expect(result.updated_at).toEqual(new Date("2025-06-01"));
    });
  });

  describe("json field sanitization", () => {
    it("sanitizes string values through the model setter", () => {
      const instance = Dataset.build({
        uid: "sanitize-1",
        json: {
          title: "<script>alert(1)</script>Hello",
          desc: "H<sub>2</sub>O is <b>water</b>",
          creator: [{ name: "<img onerror=alert(1)>Dr. Smith" }],
          count: 42,
        },
      });

      expect(instance.json.title).toBe("Hello");
      expect(instance.json.desc).toBe("H<sub>2</sub>O is <b>water</b>");
      expect(instance.json.creator[0].name).toBe("Dr. Smith");
      expect(instance.json.count).toBe(42);
    });
  });
});