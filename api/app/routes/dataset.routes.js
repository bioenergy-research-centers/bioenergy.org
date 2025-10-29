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
 *    summary: Returns the list of all the datasets
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
* /api/datasets/published:
 *  get:
 *    summary: Get all published datasets
 *    tags: [Datasets]
 *    responses:
 *      200:
 *        description: The published dataset list
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Dataset'
 */


const datasets = require("../controllers/dataset.controller.js");
const router = require("express").Router();
const {search} = require("../controllers/searchController");

// Retrieve all Datasets
router.get("/", datasets.findAll);

// Retrieve all published Datasets
router.get("/published", datasets.findAllPublished);

// Note: These routes must come BEFORE the /:id route
router.get("/analyze-keywords", datasets.analyzeKeywords);
router.post("/analyze-keywords", datasets.analyzeKeywords);
router.post("/filters", datasets.findByFilters);  // Make sure this line exists

// Retrieve aggregated metrics on Dataasets
router.get("/metrics", datasets.getMetrics);

// POST /api/datasets -> search
router.post("/", search);

// Must be last - catches all /:id patterns
router.get("/:id", datasets.findOne);

module.exports = router;