const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    globals: true,
    environment: "node",
    root: ".",
    // Add new test files under tests/ following the *.test.js convention
    include: ["tests/**/*.test.js"],
    // Runs before each test file — sets environment variables and other global test state
    setupFiles: ["tests/setup.js"],
    coverage: {
      // v8 uses Node's built-in coverage; alternative is "istanbul" (more accurate for branches)
      provider: "v8",
      // Only measure coverage for application code
      include: ["app/**/*.js"],
      // Schemas and config are static JSON/data files — not executable code worth measuring
      exclude: ["app/schemas/**", "app/config/**"],
      // CI fails if any metric drops below these percentages.
      // Raise thresholds as coverage improves; never lower them.
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
