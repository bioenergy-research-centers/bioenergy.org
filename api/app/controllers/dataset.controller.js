const db = require("../models");
const datasetsService = require("../services/datasetsService");

const Dataset = db.datasets;

// Retrieve all Datasets from the database.
exports.findAll = async (req, res) => {
  try {
    const results = await datasetsService.searchLocalDatasets({
      textQueryTerm: req.query.q,
      filters: req.query.filters,
      page: req.query.page,
      rows: req.query.rows,
      limit: req.query.limit,
      nofacets: req.query.nofacets,
    });

    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving Datasets.",
    });
  }
};

// Find a single Dataset with an id
exports.findOne = (req, res) => {
  const id = req.params.id;

  const condition = `${id}`;

  Dataset.scope('defaultScope').findByPk(condition)
    .then(data => {
      if (data) {
        res.send(data.toClientJSON());
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

exports.getMetrics = async (req, res) => {
  const metrics = {};
  try{
    metrics['totalDatasets'] = await Dataset.scope('supportedOnly').count();

    const primaryAuthorCounts = await db.sequelize.query(`
      SELECT COUNT(DISTINCT lower(trim(record->>'email')))::integer AS count
      FROM "datasets" d
      CROSS JOIN LATERAL jsonb_array_elements(d."json"->'creator') AS record
      WHERE (record->>'primaryContact')::boolean = true
    `, {type: db.sequelize.QueryTypes.SELECT});
    metrics['totalPrimaryCreators']=primaryAuthorCounts[0].count;

    const taxonCounts = await db.sequelize.query(`
      SELECT COUNT(DISTINCT lower(trim(record->>'NCBITaxID')))::integer AS count
      FROM "datasets" d
      CROSS JOIN LATERAL jsonb_array_elements(d."json"->'species') AS record
    `, {type: db.sequelize.QueryTypes.SELECT});
    metrics['totalTaxIds']=taxonCounts[0].count;
    
    const repositoryCounts = await db.sequelize.query(`
      SELECT COUNT(DISTINCT lower(trim(d."json"->>'repository')))::integer AS count
      FROM "datasets" d
    `, { type: db.sequelize.QueryTypes.SELECT });
    metrics['repositoryCounts'] = repositoryCounts[0].count;

    res.send(metrics);
  }catch (e) {
    console.error(e);
    res.status(500).send({
      message: `Error retrieving Dataset metrics`
    });
  }
};

exports.lookupByUid = async (req, res) => {
  try {
    const uid = String(req.params.uid || "").trim();

    if (!uid) {
      return res.status(400).send({
        message: "Dataset uid is required."
      });
    }

    const sourceDataset = await Dataset.findByPk(uid);

    if (!sourceDataset) {
      return res.status(404).send({
        message: "Dataset not found."
      });
    }

    const identifier = String(sourceDataset.json?.identifier || "").trim();
    const dataset_url = String(sourceDataset.json?.dataset_url || "").trim();

    if (!identifier && !dataset_url) {
      return res.status(400).send({
        message: "Source dataset does not contain an identifier or dataset_url."
      });
    }

    const conditions = [];

    if (identifier) {
      conditions.push(
        db.Sequelize.where(
          db.Sequelize.json("json.identifier"),
          identifier
        )
      );
    }

    if (dataset_url) {
      conditions.push(
        db.Sequelize.where(
          db.Sequelize.json("json.dataset_url"),
          dataset_url
        )
      );
    }

    const datasets = await Dataset.findAll({
      where: {
        [db.Sequelize.Op.or]: conditions
      },
      order: [["uid", "ASC"]]
    });

    return res.send({
      uid,
      identifier: identifier || null,
      dataset_url: dataset_url || null,
      count: datasets.length,
      datasets: datasets.map((dataset) => ({
        uid: dataset.uid,
        brc: dataset.json?.brc ?? null,
        identifier: dataset.json?.identifier ?? null,
        dataset_url: dataset.json?.dataset_url ?? null,
        is_source: dataset.uid === uid
      }))
    });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving datasets."
    });
  }
};