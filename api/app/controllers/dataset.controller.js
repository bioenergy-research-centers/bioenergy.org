const db = require("../models");
const Dataset = db.datasets;
const Op = db.Sequelize.Op;

// Create and Save a new Dataset
exports.create = (req, res) => {
  // Validate request
  if (!req.body.dataset) {
    res.status(400).send({
      message: "Dataset cannot be empty!"
    });
    return;
  }

  // Create a Dataset
  const dataset = {
    json: req.body.dataset
  };

  // Save Dataset in the database
  Dataset.create(dataset)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Dataset."
      });
    });
};

// Retrieve all Datasets from the database.
exports.findAll = (req, res) => {
  const term = req.query.title;
  const condition = term ? { 'json.title': { [Op.iLike]: `%${term}%` } } : null;

//  const term = req.query.brc;
//  let condition = term ? { 'json.brc': `${term}` } : null;

  Dataset.findAll({ where: condition })
    .then(data => {
      res.send(data.map(x => x.json));
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving Datasets."
      });
    });
};

// Find a single Dataset with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  const condition = `${id}`;

  Dataset.findByPk(condition)
    .then(data => {
      if (data) {
        res.send(data.json);
//        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Dataset with identifier: ${id}`
        });
      }
    })
    .catch(err => {
      console.error(err.message);
      res.status(500).send({
        message: `Error retrieving Dataset with identifier: ${id}`
      });
    });
};

// Find all published Datasets
exports.findAllPublished = (req, res) => {
  Dataset.findAll({ where: { 'json.bibliographicCitation': { [Op.notIn]: [ "" ] } } })
    .then(data => {
      res.send(data.map(x => x.json));
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving Datasets."
      });
    });
};
