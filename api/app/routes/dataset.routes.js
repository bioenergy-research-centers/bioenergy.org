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
 *     DatasetSearchResponse:
 *       type: object
 *       properties:
 *         totalResults:
 *           type: integer
 *           description: Total number of datasets matching the query
 *         totalPages:
 *           type: integer
 *           description: Total number of result pages
 *         query:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               description: Current page number
 *             rows:
 *               type: integer
 *               description: Number of rows returned per page
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Dataset'
 *         facets:
 *           type: object
 *           nullable: true
 *           description: Facet counts for the filtered result set
 *
 * tags:
 *   name: Datasets
 *   description: The datasets managing API
 *
 * /api/datasets/:
 *   get:
 *     summary: Returns a paginated list of datasets matching optional filters.
 *     tags: [Datasets]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Full-text search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number to return
 *       - in: query
 *         name: rows
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 500
 *         description: Number of rows per page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 500
 *         description: Legacy alias for rows
 *       - in: query
 *         name: nofacets
 *         schema:
 *           type: boolean
 *         description: Exclude facets from the response when present
 *       - in: query
 *         name: filters[title]
 *         schema:
 *           type: string
 *         description: Filter by dataset title
 *       - in: query
 *         name: filters[brc]
 *         schema:
 *           oneOf:
 *             - type: string
 *               enum:
 *                 - JBEI
 *                 - GLBRC
 *                 - CABBI
 *                 - CBI
 *             - type: array
 *               items:
 *                 type: string
 *                 enum:
 *                   - JBEI
 *                   - GLBRC
 *                   - CABBI
 *                   - CBI
 *         description: Filter by Bioenergy Research Center
 *       - in: query
 *         name: filters[topic]
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *         description: Filter by topic category
 *       - in: query
 *         name: filters[year]
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *         description: Filter by dataset year
 *       - in: query
 *         name: filters[personName]
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *         description: Filter by creator or contributor name
 *       - in: query
 *         name: filters[repository]
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *         description: Filter by repository
 *       - in: query
 *         name: filters[species]
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *         description: Filter by species
 *       - in: query
 *         name: filters[analysisType]
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *         description: Filter by analysis type
 *       - in: query
 *         name: filters[theme]
 *         schema:
 *           oneOf:
 *             - type: string
 *             - type: array
 *               items:
 *                 type: string
 *         description: Filter by theme
 *     responses:
 *       200:
 *         description: Paginated dataset search results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DatasetSearchResponse'
 *       500:
 *         description: Some server error
 *
 *   post:
 *     summary: Search datasets or run a sequence search.
 *     tags: [Datasets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: Text query for local dataset search or sequence search context
 *               sequence:
 *                 type: string
 *                 description: Optional sequence. When provided, a federated sequence search is run.
 *               page:
 *                 type: integer
 *                 default: 1
 *                 description: Page number to return for local dataset search
 *               rows:
 *                 type: integer
 *                 default: 50
 *                 maximum: 500
 *                 description: Number of rows per page for local dataset search
 *               limit:
 *                 type: integer
 *                 maximum: 500
 *                 description: Legacy alias for rows
 *               nofacets:
 *                 type: boolean
 *                 description: Exclude facets from local dataset search response
 *               filters:
 *                 type: object
 *                 description: Optional local dataset search filters
 *                 properties:
 *                   title:
 *                     type: string
 *                   brc:
 *                     oneOf:
 *                       - type: string
 *                         enum:
 *                           - JBEI
 *                           - GLBRC
 *                           - CABBI
 *                           - CBI
 *                       - type: array
 *                         items:
 *                           type: string
 *                           enum:
 *                             - JBEI
 *                             - GLBRC
 *                             - CABBI
 *                             - CBI
 *                   topic:
 *                     oneOf:
 *                       - type: string
 *                       - type: array
 *                         items:
 *                           type: string
 *                   year:
 *                     oneOf:
 *                       - type: string
 *                       - type: array
 *                         items:
 *                           type: string
 *                   personName:
 *                     oneOf:
 *                       - type: string
 *                       - type: array
 *                         items:
 *                           type: string
 *                   repository:
 *                     oneOf:
 *                       - type: string
 *                       - type: array
 *                         items:
 *                           type: string
 *                   species:
 *                     oneOf:
 *                       - type: string
 *                       - type: array
 *                         items:
 *                           type: string
 *                   analysisType:
 *                     oneOf:
 *                       - type: string
 *                       - type: array
 *                         items:
 *                           type: string
 *                   theme:
 *                     oneOf:
 *                       - type: string
 *                       - type: array
 *                         items:
 *                           type: string
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/DatasetSearchResponse'
 *                 - type: object
 *                   description: Federated sequence search results
 *       500:
 *         description: Search failed
 *
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
 *                         type: boolean
 *                         description: Indicates whether this record is the source dataset used for the lookup
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
const {search} = require("../controllers/search.controller.js");

// Retrieve all Datasets
router.get("/", datasets.findAll);

// Retrieve aggregated metrics on Datasets
router.get("/metrics", datasets.getMetrics);

// Lookup datasets by uid using the source dataset's identifier and/or dataset_url
router.get("/lookup/:uid", datasets.lookupByUid);

// POST /api/datasets -> search
router.post("/", search);

// Must be last - catches all /:id patterns
router.get("/:id", datasets.findOne);

module.exports = router;