/**
 * @swagger
 * tags:
 *   name: Schema
 *   description: JSON schema retrieval API
 *
 * /api/schema:
 *   get:
 *     summary: Returns the list of supported schema versions
 *     tags: [Schema]
 *     responses:
 *       200:
 *         description: A list of supported schema versions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 supported:
 *                   type: array
 *                   items:
 *                     type: string
 *               example:
 *                 supported:
 *                   - "0.1.7"
 *                   - "0.1.10"
 *
 * /api/schema/{version}:
 *   get:
 *     summary: Returns the JSON schema document for a specific version
 *     tags: [Schema]
 *     parameters:
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: string
 *         description: Schema version identifier
 *         example: "0.1.10"
 *     responses:
 *       200:
 *         description: The JSON schema document for the requested version
 *         content:
 *           application/schema+json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid schema path
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *               example:
 *                 error: Invalid schema path.
 *       404:
 *         description: Schema version not found or schema file missing on server
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *               examples:
 *                 schemaVersionNotFound:
 *                   summary: Requested schema version is not supported
 *                   value:
 *                     error: Schema version not found.
 *                 schemaFileMissing:
 *                   summary: Schema file is missing on the server
 *                   value:
 *                     error: Schema file missing on server.
 */

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