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

module.exports = app => {
  const datasets = require("../controllers/dataset.controller.js");
  const router = require("express").Router();
  const {search} = require("../controllers/searchController");

  // Retrieve all Tutorials
  router.get("/", datasets.findAll);

  // Retrieve all published Tutorials
  router.get("/published", datasets.findAllPublished);

  // Retrieve a single Tutorial with id
  router.get("/:id", datasets.findOne);

  // POST /api/datasets -> search
  router.post("/", search);

  app.use('/api/datasets', router);
};

