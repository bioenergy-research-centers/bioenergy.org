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
 * /:
 *   get:
 *    summary: Returns the list of all the datasets
 *    tags: [Datasets]
 *   responses:
 *    200:
 *     description: The list of the datasets
 *    content:
 *      application/json:
 *        schema:
 *          type: array
 *          items:
 *            $ref: '#/components/schemas/Dataset'
 *   500:
 *     description: Some server error
 *   post:
 *     summary: Create a new dataset
 *     tags: [Datasets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Dataset'
 *     responses:
 *       200:
 *         description: The created dataset.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dataset'
 *       500:
 *         description: Some server error
 *
 */

module.exports = app => {
  const datasets = require("../controllers/dataset.controller.js");

  var router = require("express").Router();


  // Create a new Tutorial
  router.post("/", datasets.create);

  // Retrieve all Tutorials
  router.get("/", datasets.findAll);

  // Retrieve all published Tutorials
  router.get("/published", datasets.findAllPublished);

  // Retrieve a single Tutorial with id
  router.get("/:id", datasets.findOne);

  // Update a Tutorial with id
  router.put("/:id", datasets.update);

  // Delete a Tutorial with id
  router.delete("/:id", datasets.delete);

  // Create a new Tutorial
  router.delete("/", datasets.deleteAll);

  app.use('/api/datasets', router);
};
