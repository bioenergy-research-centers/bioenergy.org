// api/app/routes/schema.routes.js

const path = require("path");
const fs = require("fs");

const schemas = require("../schemas"); // app/schemas/index.js
const router = require("express").Router();

/**
 * GET /api/schema
 * Returns supported schema versions (optional helper endpoint)
 */
router.get("/", (req, res) => {
  return res.json({ supported: schemas.supported });
});

/**
 * GET /api/schema/:version
 * Serves the JSON schema file for a supported version.
 */
router.get("/:version", (req, res) => {
  const version = String(req.params.version || "").trim();

  // Allowlist lookup (do NOT build file paths from user input)
  const filename = schemas.index[version];
  if (!filename) {
    return res.status(404).json({ error: "Schema version not found." });
  }

  const schemasDir = path.resolve(__dirname, "..", "schemas");
  const filePath = path.resolve(schemasDir, filename);

  // Defense-in-depth: ensure path stays inside schemasDir
  if (!filePath.startsWith(schemasDir + path.sep)) {
    return res.status(400).json({ error: "Invalid schema path." });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Schema file missing on server." });
  }

  res.type("application/schema+json");
  return res.sendFile(filePath);
});

module.exports = router;