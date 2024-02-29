const db = require("../models");
const Dataset = db.datasets;
const Op = db.Sequelize.Op;

// Create and Save a new Dataset
exports.create = (req, res) => {
  // Validate request
  if (!req.body.title) {
    res.status(400).send({
      message: "Content can not be empty!"
    });
    return;
  }

  // Create a Dataset
  const dataset = {
    title: req.body.title,
    description: req.body.description,
    published: req.body.published ? req.body.published : false
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
  const title = req.query.title;
  var condition = title ? { title: { [Op.iLike]: `%${title}%` } } : null;

  Dataset.findAll({ where: condition })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving datasets."
      });
    });
};

// Find a single Dataset with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  Dataset.findByPk(id)
    .then(data => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Dataset with id=${id}.`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving Dataset with id=" + id
      });
    });
};

// Find all published Datasets
exports.findAllPublished = (req, res) => {
  Dataset.findAll({ where: { published: true } })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving datasets."
      });
    });
};
