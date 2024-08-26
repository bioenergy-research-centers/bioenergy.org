const db = require("../models");
const Dataset = db.datasets;
const Op = db.Sequelize.Op;
const where = db.Sequelize.where;

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
  const textQueryTerm = req.query.fulltext;
  const titleQueryTerm = req.query.title;
  const brcQueryTerm = req.query.brc;

  // Initialize an empty array for search the conditions
  const conditions = [];

  if (textQueryTerm) {
    // Setup a search across all JSON data using postgres built-in full text search.
    // This works okay for matching multiple terms after manually adding a wildcard prefix to support partial matches.
    // Supporting special characters makes the token processing more complicated.
    // https://www.postgresql.org/docs/15/textsearch-controls.html#TEXTSEARCH-PARSING-QUERIES
    // https://www.postgresql.org/docs/15/datatype-textsearch.html#DATATYPE-TSQUERY

    // NOT and OR boolean terms are supported along with characters '!' and '|'
    // Parenthesis can be used to group and set precedence  term1 and term2 OR (term3 NOT term4)

    // Split the input into terms on whitespace
    const specialTokens = ['OR', '|', '!', '(', ')'];
    const searchTerms = textQueryTerm.trim().match(/(\(|\)|\bOR\b|\bNOT\b|[^\s()]+)/gi);
    const tokenizedSearchTerms = searchTerms.filter(t => t).map(token => {
      // convert keywords to characters
      if (token.toUpperCase() == 'OR') {
        return '|';
      }
      if (token.toUpperCase() == 'NOT') {
        return '!';
      }
      if (token == ')') {
        return ') &';
      }
      // don't add wildcard to special tokens
      if (specialTokens.includes(token.toUpperCase())) {
        return token;
      } 
      else {
        // Add wildcard for partial matching
        return `${token}:* &`;
      }
    });
    let tokenizedSearchTerm = tokenizedSearchTerms.join(' ');
    // remove any extra trailing &. Quick hack to avoid more complicated processing of the terms
    tokenizedSearchTerm = tokenizedSearchTerm.replace(/\&$/, "").replace(/\&\s+\|/g, "|").replace(/\&\s+\)/g,")");
    const textSearchQuery = where(
      db.Sequelize.fn(
        'to_tsvector',
        'simple',
        db.Sequelize.cast(db.Sequelize.col('json'), 'text')
      ),
      {
        [Op.match]: db.Sequelize.fn(
          'to_tsquery',
          'simple',
          tokenizedSearchTerm
        )
      }
    );
    conditions.push(textSearchQuery);
  }
  
  if (titleQueryTerm) {
    const titleSearchQuery = {
      'json.title': { [Op.iLike]: `%${titleQueryTerm}%`}
    };
    conditions.push(titleSearchQuery);
  }
  if (brcQueryTerm) {
    const brcSearchQuery = {
      'json.brc': { [Op.iLike]: `${brcQueryTerm}`} 
    };
    conditions.push(brcSearchQuery);
  }

  // Use Op.and to merge conditions
  const mergedWhereConditions = conditions.length > 0 ? { [Op.and]: conditions } : {};

  Dataset.findAll({
    where: mergedWhereConditions,
  })
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
