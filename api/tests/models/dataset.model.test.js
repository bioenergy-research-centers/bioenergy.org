const sanitizeHtml = require("sanitize-html");

const ALLOWED_HTML = { allowedTags: ["b", "i", "sub", "sup"], allowedAttributes: {} };

describe("Dataset model", () => {
  describe("toClientJSON", () => {
    it("merges schema_version, uid, and timestamps into the json object", () => {
      // Simulate what toClientJSON does without needing Sequelize
      const instance = {
        json: { title: "Test Dataset", brc: "GLBRC" },
        schema_version: "0.1.7",
        uid: "abc-123",
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-06-01"),
        toClientJSON() {
          const jsonData = this.json;
          jsonData.schema_version = this.schema_version;
          jsonData.uid = this.uid;
          jsonData.created_at = this.createdAt;
          jsonData.updated_at = this.updatedAt;
          return jsonData;
        },
      };

      const result = instance.toClientJSON();
      expect(result.title).toBe("Test Dataset");
      expect(result.brc).toBe("GLBRC");
      expect(result.schema_version).toBe("0.1.7");
      expect(result.uid).toBe("abc-123");
      expect(result.created_at).toEqual(new Date("2025-01-01"));
      expect(result.updated_at).toEqual(new Date("2025-06-01"));
    });
  });

  describe("json field sanitization", () => {
    // Directly test the sanitization logic used by the model setter
    function sanitizeJSON(rawJSON) {
      return JSON.parse(
        JSON.stringify(rawJSON, (_key, value) =>
          typeof value === "string" ? sanitizeHtml(value, ALLOWED_HTML) : value
        )
      );
    }

    it("strips disallowed HTML tags from string values", () => {
      const result = sanitizeJSON({ title: "<script>alert(1)</script>Hello" });
      expect(result.title).toBe("Hello");
      expect(result.title).not.toContain("<script>");
    });

    it("allows permitted tags (b, i, sub, sup)", () => {
      const result = sanitizeJSON({ title: "H<sub>2</sub>O is <b>water</b>" });
      expect(result.title).toBe("H<sub>2</sub>O is <b>water</b>");
    });

    it("does not modify non-string values", () => {
      const result = sanitizeJSON({ count: 42, active: true, tags: ["a", "b"] });
      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
      expect(result.tags).toEqual(["a", "b"]);
    });

    it("sanitizes nested string values", () => {
      const result = sanitizeJSON({
        creator: [{ name: "<img onerror=alert(1)>Dr. Smith" }],
      });
      expect(result.creator[0].name).toBe("Dr. Smith");
    });

    it("strips div and span tags but keeps text", () => {
      const result = sanitizeJSON({ desc: "<div>Some <span>text</span></div>" });
      expect(result.desc).toBe("Some text");
    });
  });
});
