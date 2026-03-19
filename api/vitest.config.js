const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    globals: true,
    environment: "node",
    root: ".",
    include: ["tests/**/*.test.js"],
    setupFiles: ["tests/setup.js"],
  },
});
