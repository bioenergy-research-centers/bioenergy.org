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

// Update a Dataset by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  Dataset.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Dataset was updated successfully."
        });
      } else {
        res.send({
          message: `Cannot update Dataset with id=${id}. Maybe Dataset was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating Dataset with id=" + id
      });
    });
};

// Delete a Dataset with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  Dataset.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Dataset was deleted successfully!"
        });
      } else {
        res.send({
          message: `Cannot delete Dataset with id=${id}. Maybe Dataset was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete Dataset with id=" + id
      });
    });
};

// Delete all Datasets from the database.
exports.deleteAll = (req, res) => {
  Dataset.destroy({
    where: {},
    truncate: false
  })
    .then(nums => {
      res.send({ message: `${nums} Datasets were deleted successfully!` });
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while removing all datasets."
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
