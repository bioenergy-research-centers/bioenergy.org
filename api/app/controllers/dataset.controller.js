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
      from_date: req.query.from_date,
      until_date: req.query.until_date,
      shape: req.query.shape
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
  const shape = req.query.shape ?? 'detail';

  const condition = `${id}`;

  Dataset.scope('defaultScope').findByPk(condition)
    .then(data => {
      if (data) {
        res.send(datasetsService.serializeDatasetForClient(data, shape));
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
    const relatedItemIdentifiers = (Array.isArray(sourceDataset.json?.relatedItem) ? sourceDataset.json.relatedItem : [])
      .map((item) => String(item?.relatedItemIdentifier || "").trim().toLowerCase())
      .filter((identifier) => identifier);

    if (!identifier && !dataset_url && !relatedItemIdentifiers.length) {
      return res.status(400).send({
        message: "Source dataset does not contain an identifier, dataset_url, or related item identifier."
      });
    }

    const sharedRelatedItemDatasets = relatedItemIdentifiers.length ? await db.sequelize.query(`
      SELECT DISTINCT ON (d.uid) d.*
      FROM datasets d
      CROSS JOIN LATERAL (
        SELECT lower(trim(record->>'relatedItemIdentifier')) AS identifier
        FROM jsonb_array_elements(
          CASE
            WHEN jsonb_typeof(d.json->'relatedItem') = 'array'
            THEN d.json->'relatedItem'
            ELSE '[]'::jsonb
          END
        ) AS record
      ) AS related_item
      WHERE d.uid <> :uid AND related_item.identifier IN (:relatedItemIdentifiers)
      ORDER BY d.uid ASC
    `, {
      replacements: { uid, relatedItemIdentifiers },
      model: Dataset,
      mapToModel: true
    }) : [];

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

    const datasets = conditions.length ? await Dataset.findAll({
      where: {
        [db.Sequelize.Op.or]: conditions
      },
      order: [["uid", "ASC"]]
    }) : [];

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
      })),
      shared_related_item_datasets: sharedRelatedItemDatasets.map( (dataset) => 
        datasetsService.serializeDatasetForClient(dataset, "list-item")
      )
    });
  } catch (err) {
    return res.status(500).send({
      message: err.message || "Some error occurred while retrieving datasets."
    });
  }
};
