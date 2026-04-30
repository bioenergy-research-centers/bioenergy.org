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
 * /api/datasets/lookup/{uid}:
 *   get:
 *     summary: Lookup related datasets using a source dataset uid
 *     tags: [Datasets]
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Dataset uid used to find related records by identifier and/or dataset URL
 *         example: GLBRC_GSE218642
 *     responses:
 *       200:
 *         description: Matching datasets and count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uid:
 *                   type: string
 *                   description: Source dataset uid used for the lookup
 *                 identifier:
 *                   type: string
 *                   nullable: true
 *                   description: Identifier extracted from the source dataset
 *                 dataset_url:
 *                   type: string
 *                   nullable: true
 *                   description: Dataset URL extracted from the source dataset
 *                 count:
 *                   type: integer
 *                   description: Number of matching datasets
 *                 datasets:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       uid:
 *                         type: string
 *                       brc:
 *                         type: string
 *                         nullable: true
 *                       identifier:
 *                         type: string
 *                         nullable: true
 *                       dataset_url:
 *                         type: string
 *                         nullable: true
 *                       is_source:
 *                          type: boolean
 *                          description: Indicates whether this record is the source dataset used for the lookup
 *               example:
 *                 uid: GLBRC_GSE218642
 *                 identifier: GSE218642
 *                 dataset_url: null
 *                 count: 2
 *                 datasets:
 *                   - uid: CABBI_GSE218642
 *                     brc: CABBI
 *                     identifier: GSE218642
 *                     dataset_url: https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE218642
 *                   - uid: GLBRC_GSE218642
 *                     brc: GLBRC
 *                     identifier: GSE218642
 *                     dataset_url: null
 *       400:
 *         description: Dataset uid is missing or the source dataset has neither identifier nor dataset URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Dataset not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               example:
 *                 message: Dataset not found.
 *       500:
 *         description: Some server error
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

// Lookup datasets by uid using the source dataset's identifier and/or dataset_url
router.get("/lookup/:uid", datasets.lookupByUid);

// POST /api/datasets -> search
router.post("/", search);

// Get the latest dataset for each BRC.
router.get("/latest", datasets.getLatestByBrc);

// Must be last - catches all /:id patterns
router.get("/:id", datasets.findOne);

module.exports = router;