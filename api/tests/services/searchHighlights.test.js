const {
  fetchSearchHighlights,
  toHighlights,
  withEllipses,
  buildHighlightSql,
  MATCHED_IN_FIELDS,
  TITLE_MAX_LENGTH,
} = require("../../app/services/searchHighlights");

// What ts_headline returns for a field with no match: the text, unmarked.
const row = (overrides = {}) => ({
  uid: "JBEI_1",
  title: "Switchgrass yields",
  title_passage: "Switchgrass yields",
  title_source: "Switchgrass yields",
  description: "Plain description",
  description_source: "Plain description",
  abstract: null,
  abstract_source: null,
  creators: null,
  contributors: null,
  matched_in: {},
  ...overrides,
});

describe("toHighlights", () => {
  it("keeps only the fields that matched", () => {
    expect(toHighlights(row())).toEqual({});
  });

  it("returns the marked title", () => {
    expect(toHighlights(row({ title: "<mark>Switchgrass</mark> yields" }))).toEqual({
      title: "<mark>Switchgrass</mark> yields",
    });
  });

  it("cuts a title longer than the list shows to one passage around the match", () => {
    const longTitle = `${"Introductory words. ".repeat(8)}Lignin is degraded here. ${"Closing words. ".repeat(8)}`;
    expect(longTitle.length).toBeGreaterThan(TITLE_MAX_LENGTH);

    const highlights = toHighlights(row({
      title: longTitle.replace("Lignin", "<mark>Lignin</mark>"),
      title_passage: "words. <mark>Lignin</mark> is degraded here. Closing",
      title_source: longTitle,
    }));

    expect(highlights.title).toBe("… words. <mark>Lignin</mark> is degraded here. Closing …");
  });

  it("prefers a description match over an abstract match", () => {
    const highlights = toHighlights(row({
      description: "A <mark>lignin</mark> study",
      description_source: "A lignin study",
      abstract: "More <mark>lignin</mark>",
      abstract_source: "More lignin",
    }));

    expect(highlights).toEqual({ snippet: "A <mark>lignin</mark> study", snippetField: "description" });
  });

  it("falls back to the abstract when the description has no match", () => {
    const highlights = toHighlights(row({
      abstract: "More <mark>lignin</mark>",
      abstract_source: "More lignin",
    }));

    expect(highlights).toEqual({ snippet: "More <mark>lignin</mark>", snippetField: "abstract" });
  });

  it("returns matched creator and contributor names", () => {
    const highlights = toHighlights(row({ creators: ["Ana Ames"], contributors: ["Dana Contributor"] }));

    expect(highlights).toEqual({ creators: ["Ana Ames"], contributors: ["Dana Contributor"] });
  });

  it("leaves out empty name lists", () => {
    expect(toHighlights(row({ creators: [], contributors: [] }))).toEqual({});
  });

  it("reports matches in fields the list item does not show", () => {
    const matched = { keywords: ["<mark>lignin</mark> degradation"], identifier: ["<mark>GSE1</mark>"] };

    expect(toHighlights(row({ matched_in: matched }))).toEqual({ matchedIn: matched });
  });

  it("leaves out matchedIn when nothing else matched", () => {
    expect(toHighlights(row({ matched_in: null }))).toEqual({});
  });
});

describe("withEllipses", () => {
  const source = "One two three. Four <b>five</b> six seven. Eight nine ten.";

  it("adds nothing when the passage is the whole text", () => {
    expect(withEllipses("One two three. Four <b><mark>five</mark></b> six seven. Eight nine ten.", source))
      .toBe("One two three. Four <b><mark>five</mark></b> six seven. Eight nine ten.");
  });

  it("marks a passage cut at both ends", () => {
    expect(withEllipses("Four <b><mark>five</mark></b> six", source)).toBe("… Four <b><mark>five</mark></b> six …");
  });

  it("checks the first and last of several passages", () => {
    expect(withEllipses("One <mark>two</mark> … <mark>nine</mark> ten.", "One two three four. Eight nine ten."))
      .toBe("One <mark>two</mark> … <mark>nine</mark> ten.");
  });
});

describe("buildHighlightSql", () => {
  it("calls the tsquery function the search used", () => {
    expect(buildHighlightSql("brc_prefix_tsquery")).toContain("brc_prefix_tsquery(:text)");
    expect(buildHighlightSql("websearch_to_tsquery")).toContain("websearch_to_tsquery('english', :text)");
  });

  it("reports every matchedIn field by its indexed path", () => {
    const sql = buildHighlightSql("brc_prefix_tsquery");

    for (const [key, path] of MATCHED_IN_FIELDS) {
      expect(sql).toContain(`'${key}',`);
      expect(sql).toContain(`jsonb_path_query(d."json", '${path}')`);
    }
  });

  it("refuses any other function name, since it is placed in the SQL", () => {
    expect(() => buildHighlightSql("pg_sleep")).toThrow("Unsupported highlight query function: pg_sleep");
  });
});

describe("fetchSearchHighlights", () => {
  const sequelize = () => ({ query: vi.fn(), QueryTypes: { SELECT: "SELECT" } });

  it("queries only the given datasets, passing user text as a replacement", async () => {
    const db = sequelize();
    db.query.mockResolvedValue([row({ uid: "A", title: "<mark>Lignin</mark>" }), row({ uid: "B" })]);

    const highlights = await fetchSearchHighlights(db, { fn: "brc_prefix_tsquery", text: "lignin" }, ["A", "B"]);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining("WHERE d.uid IN (:uids)"), {
      replacements: { text: "lignin", uids: ["A", "B"] },
      type: "SELECT",
    });
    expect(highlights.get("A")).toEqual({ title: "<mark>Lignin</mark>" });
    expect(highlights.get("B")).toEqual({});
  });

  it("skips the query when there is nothing to highlight", async () => {
    const db = sequelize();

    expect(await fetchSearchHighlights(db, { fn: "brc_prefix_tsquery", text: "lignin" }, [])).toEqual(new Map());
    expect(await fetchSearchHighlights(db, { fn: "websearch_to_tsquery", text: "" }, ["A"])).toEqual(new Map());
    expect(db.query).not.toHaveBeenCalled();
  });
});
