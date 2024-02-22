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

