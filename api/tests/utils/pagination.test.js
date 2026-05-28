const { getPaginationParams } = require("../../app/utils/pagination");

describe("pagination", () => {
  it("uses default pagination values", () => {
    expect(getPaginationParams({})).toEqual({
      page: 1,
      limit: 50,
      offset: 0,
    });
  });

  it("uses rows when provided", () => {
    expect(getPaginationParams({ page: "3", rows: "25" })).toEqual({
      page: 3,
      limit: 25,
      offset: 50,
    });
  });

  it("supports legacy limit", () => {
    expect(getPaginationParams({ page: "2", limit: "20" })).toEqual({
      page: 2,
      limit: 20,
      offset: 20,
    });
  });

  it("prefers rows over legacy limit", () => {
    expect(getPaginationParams({ rows: "30", limit: "20" })).toEqual({
      page: 1,
      limit: 30,
      offset: 0,
    });
  });

  it("caps limit at the maximum row limit", () => {
    expect(getPaginationParams({ rows: "9999" })).toEqual({
      page: 1,
      limit: 500,
      offset: 0,
    });
  });

  it("falls back to defaults for invalid values", () => {
    expect(getPaginationParams({ page: "-1", rows: "abc" })).toEqual({
      page: 1,
      limit: 50,
      offset: 0,
    });
  });

  it("falls back to defaults for zero values", () => {
    expect(getPaginationParams({ page: "0", rows: "0" })).toEqual({
      page: 1,
      limit: 50,
      offset: 0,
    });
  });

  it("parses values as base 10 integers", () => {
    expect(getPaginationParams({ page: "2", rows: "10" })).toEqual({
      page: 2,
      limit: 10,
      offset: 10,
    });
  });
});