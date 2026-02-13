/**
 * @swagger
 * components:
 *   schemas:
 *     Dataset:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - published
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the dataset
 *         title:
 *           type: string
 *           description: The title of your dataset
 *         description:
 *           type: string
 *           description: The dataset description
 *         published:
 *           type: boolean
 *           description: Whether the dataset is published or not
 *       example:
 *         id: d5fE_asz
 *         title: The Best Bioenergy Dataset
 *         description: Some revolutionary dataset that will change the world
 *         published: true
 * tags:
 *   name: Datasets
 *   description: The datasets managing API
 * /api/datasets/:
 *   get:
 *    summary: Returns a list of datasets matching optional filters.
 *    tags: [Datasets]
 *    responses:
 *      200:
 *        description: The list of the datasets
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                 $ref: '#/components/schemas/Dataset'
 *      500:
 *        description: Some server error
 * /api/datasets/{id}:
 *  get:
 *    summary: Get the dataset by id
 *    tags: [Datasets]
 *    parameters:
 *      - in: path
 *        name: id
 *        schema:
 *          type: string
 *        required: true
 *        description: The dataset id
 *    responses:
 *      200:
 *        description: The dataset by id
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Dataset'
* /api/datasets/metrics:
 *  get:
 *    summary: Get dataset metrics
 *    responses:
 *      200:
 *        description: Object with dataset count metrics
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                totalDatasets:
 *                  type: integer
 *                  description: Count of total imported datasets.
 *                totalPrimaryCreators:
 *                  type: integer
 *                  description: Count of total unique email addresses for dataset creators noted as primary contact.
 *                totalTaxIds:
 *                  type: integer
 *                  description: Count of total unique NCBI Taxonomy ID values for dataset species field.
 *                repositoryCounts:
 *                  type: integer
 *                  description: Count of total unique repositories for datasets.
 */


const datasets = require("../controllers/dataset.controller.js");
const router = require("express").Router();
const {search} = require("../controllers/searchController");

// Retrieve all Datasets
router.get("/", datasets.findAll);

// Retrieve aggregated metrics on Dataasets
router.get("/metrics", datasets.getMetrics);

// POST /api/datasets -> search
router.post("/", search);

// Must be last - catches all /:id patterns
router.get("/:id", datasets.findOne);

module.exports = router;