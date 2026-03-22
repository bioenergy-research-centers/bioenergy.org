const categories = require("../../app/utils/categories");

describe("categories", () => {
  const expectedCategories = [
    "Genetic Engineering",
    "Plant Biology",
    "Microbiology",
    "Analytics & Methods",
    "Enzymes & Proteins",
    "Biomass & Feedstock",
    "Bioenergy Production",
    "Process Engineering",
  ];

  it("exports all expected category names", () => {
    expect(Object.keys(categories)).toEqual(expectedCategories);
  });

  it("each category has a non-empty array of keywords", () => {
    for (const [name, keywords] of Object.entries(categories)) {
      expect(Array.isArray(keywords), `${name} should be an array`).toBe(true);
      expect(keywords.length, `${name} should have keywords`).toBeGreaterThan(0);
    }
  });

  it("all keywords are lowercase strings", () => {
    for (const [name, keywords] of Object.entries(categories)) {
      for (const kw of keywords) {
        expect(typeof kw).toBe("string");
        expect(kw, `"${kw}" in ${name} should be lowercase`).toBe(kw.toLowerCase());
      }
    }
  });
});
