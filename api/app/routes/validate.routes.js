/**
 * @swagger
 * tags:
 *   name: Validation
 *   description: Data feed validation API
 *
 * /api/validate:
 *   post:
 *     summary: Validates a posted data feed against the current or requested schema version
 *     tags: [Validation]
 *     parameters:
 *       - in: query
 *         name: schema_version
 *         required: false
 *         schema:
 *           type: string
 *         description: Optional schema version override. If omitted, the version from the posted feed is used.
 *         example: "0.1.12"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: A Bioenergy.org data feed object with top-level schema_version and datasets, or a legacy top-level array of dataset objects.
 *           examples:
 *             feedObject:
 *               summary: Feed object with schema version and datasets array
 *               value:
 *                 schema_version: "0.1.12"
 *                 datasets:
 *                   - brc: "JBEI"
 *                     identifier: "10.1038-example"
 *                     dataset_url: "https://example.org/dataset/10.1038-example"
 *                     title: "Example dataset"
 *             legacyArray:
 *               summary: Legacy top-level array of datasets
 *               value:
 *                 - brc: "JBEI"
 *                   identifier: "10.1038-example"
 *                   dataset_url: "https://example.org/dataset/10.1038-example"
 *                   title: "Example dataset"
 *     responses:
 *       200:
 *         description: Validation completed successfully. The response may still include invalid_records or duplicate_records if problems were found in the submitted feed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             examples:
 *               cleanFeed:
 *                 summary: Feed with no validation problems
 *                 value:
 *                   feed_name: "uploaded feed"
 *                   feed_source: "api"
 *                   schema_version: "0.1.12"
 *                   schema_filename: "brc_schema_0.1.12.json"
 *                   summary:
 *                     valid: 1782
 *                     invalid: 0
 *                     duplicate: 0
 *                   feed_validation:
 *                     valid: true
 *                     errors: []
 *                   invalid_records: []
 *                   duplicate_records: []
 *       400:
 *         description: Invalid request body, unsupported schema version, or invalid feed structure
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 code:
 *                   type: string
 *       500:
 *         description: Internal server error
 */
const router = require("express").Router();
const controller = require("../controllers/validate.controller");

router.post("/", controller.validateUploadedFeed);

module.exports = router;
