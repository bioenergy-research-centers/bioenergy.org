const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    globals: true,
    environment: "node",
    root: ".",
    include: ["tests/**/*.test.js"],
    setupFiles: ["tests/setup.js"],
    coverage: {
      provider: "v8",
      include: ["app/**/*.js"],
      exclude: ["app/schemas/**", "app/config/**"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
