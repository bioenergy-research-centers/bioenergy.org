const { defineConfig } = require("vitest/config");

// Integration tests run the real API code against a real PostgreSQL: migrations, the
// generated search column and its index, the SQL prefix function, the model, the service
// and the HTTP route. Nothing is mocked, so they are kept out of `npm test` (which needs no
// database) and run with `npm run test:integration`. See README.md "Testing".
module.exports = defineConfig({
  test: {
    globals: true,
    environment: "node",
    root: ".",
    include: ["tests/integration/**/*.test.js"],
    // No tests/setup.js here: that file points the database at an unreachable host so unit
    // tests can never touch a real one. These tests read the BIOENERGY_ORG_DB_* variables.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
