const { formatContactForm, formatListWithSublistBlocks, formatList } = require("../../app/utils/markdownFormatter");

describe("formatContactForm", () => {
  const baseData = {
    contact_name: "Alice",
    contact_email: "alice@example.com",
    contact_affiliation: "MIT",
    contact_reason: "Data request",
    contact_comment: "I need access to the GLBRC dataset.",
  };

  it("formats all fields into markdown", () => {
    const result = formatContactForm(baseData);
    expect(result).toContain("**Name:** Alice");
    expect(result).toContain("**Email:** alice@example.com");
    expect(result).toContain("**Affiliation:** MIT");
    expect(result).toContain("Data request");
    expect(result).toContain("I need access to the GLBRC dataset.");
  });

  it("sanitizes HTML in fields", () => {
    const data = { ...baseData, contact_name: "<script>alert(1)</script>Bob" };
    const result = formatContactForm(data);
    expect(result).not.toContain("<script>");
    expect(result).toContain("Bob");
  });

  it("truncates long comments to maxLength", () => {
    const data = { ...baseData, contact_comment: "a".repeat(200) };
    const result = formatContactForm(data, 50);
    // The comment inside the code block should be truncated
    const codeBlockMatch = result.match(/```\n([\s\S]*?)\n```/);
    expect(codeBlockMatch[1].length).toBeLessThanOrEqual(50);
  });

  it("strips triple backticks from comment to prevent markdown injection", () => {
    const data = { ...baseData, contact_comment: "hello```world" };
    const result = formatContactForm(data);
    // The inner backticks should be removed
    expect(result).toContain("helloworld");
  });
});

describe("formatListWithSublistBlocks", () => {
  it("formats identifiers as markdown list with code blocks", () => {
    const items = [
      ["Item A", "detail A"],
      ["Item B", "detail B"],
    ];
    const result = formatListWithSublistBlocks(items);
    expect(result).toContain("- Item A");
    expect(result).toContain("- Item B");
    expect(result).toContain("detail A");
    expect(result).toContain("detail B");
  });

  it("applies blockformat parameter", () => {
    const items = [["Item", "json data"]];
    const result = formatListWithSublistBlocks(items, "json");
    expect(result).toContain("```json");
  });

  it("truncates to 100 items and shows warning", () => {
    const items = Array.from({ length: 110 }, (_, i) => [`Item ${i}`, `Detail ${i}`]);
    const result = formatListWithSublistBlocks(items);
    expect(result).toContain("Output truncated to 100 items from total length: 110");
    // Should not contain item 100+
    expect(result).not.toContain("Item 109");
  });

  it("does not truncate exactly 100 items", () => {
    const items = Array.from({ length: 100 }, (_, i) => [`Item ${i}`, `Detail ${i}`]);
    const result = formatListWithSublistBlocks(items);
    expect(result).not.toContain("Output truncated");
  });
});

describe("formatList", () => {
  it("formats strings as a markdown bullet list", () => {
    const result = formatList(["alpha", "beta", "gamma"]);
    expect(result).toBe("- alpha\n- beta\n- gamma");
  });

  it("returns empty string for empty array", () => {
    expect(formatList([])).toBe("");
  });
});
