const db = require("../models");
const { getPaginationParams } = require("../utils/pagination");

const Dataset = db.datasets;
const Op = db.Sequelize.Op;
const where = db.Sequelize.where;
const json = db.Sequelize.json;
const fn = db.Sequelize.fn;

// Retrieve all Datasets from the database.
exports.findAll = async (req, res) => {
  const textQueryTerm = req.query.q;
  const titleQueryTerm = req.query.filters?.title;
  const brcQueryTerm = req.query.filters?.brc;
  const categoryQueryTerm = req.query.filters?.topic;
  const yearQueryTerm = req.query.filters?.year;
  const personNameQueryTerm = req.query.filters?.personName;
  const repositoryQueryTerm = req.query.filters?.repository;
  const speciesQueryTerm = req.query.filters?.species;
  const analysisTypeQueryTerm = req.query.filters?.analysisType;
  const themeQueryTerm = req.query.filters?.theme;
  const includeFacets = !req.query.nofacets;
  const { page, limit, offset } = getPaginationParams(req.query);

  // Initialize an empty array for search conditions
  const conditions = [];
  if (textQueryTerm && textQueryTerm.trim() !== '') {
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
    conditions.push(
      where(json("json.title"), { [Op.iLike]: `%${titleQueryTerm}%` })
    );
  }
  
  if (brcQueryTerm) {
    if(Array.isArray(brcQueryTerm)) {
      conditions.push(
        where(json("json.brc"), { [Op.in]: brcQueryTerm })
      );
    } else{
      conditions.push(
        where(json("json.brc"), { [Op.eq]: `${brcQueryTerm}` })
      );
    }
  }

  if (repositoryQueryTerm) {
    if(Array.isArray(repositoryQueryTerm)) {
      conditions.push(
        where(json("json.repository"), { [Op.in]: repositoryQueryTerm })
      );
    } else{
      conditions.push(
        where(json("json.repository"), { [Op.eq]: `${repositoryQueryTerm}` })
      );
    }
  }

  if (analysisTypeQueryTerm) {
    if(Array.isArray(analysisTypeQueryTerm)) {
      conditions.push(
        where(json("json.analysisType"), { [Op.iLike]: { [Op.any]: analysisTypeQueryTerm } })
      );
    } else{
      conditions.push(
        where(json("json.analysisType"), { [Op.iLike]: `${analysisTypeQueryTerm}` })
      );
    }
  }

  if (speciesQueryTerm) {   
    if(Array.isArray(speciesQueryTerm)) {
      const speciesQueryTermArray = speciesQueryTerm.map(t => {return `%${t}%`;});
      conditions.push(
        where(json("json.species"), { [Op.iLike]: { [Op.any]: speciesQueryTermArray } })
      );
    } else{
      conditions.push(
        where(json("json.species"), { [Op.iLike]: `%${speciesQueryTerm}%` })
      );
    } 
  }

  if (themeQueryTerm) {   
    if(Array.isArray(themeQueryTerm)) {
      const themeQueryTermArray = themeQueryTerm.map(t => {return `%${t}%`;});
      conditions.push(
        where(json("json.theme"), { [Op.iLike]: { [Op.any]: themeQueryTermArray } })
      );
    } else{
      conditions.push(
        where(json("json.theme"), { [Op.iLike]: `%${themeQueryTerm}%` })
      );
    } 
  }

  if (categoryQueryTerm) {
    conditions.push(buildStoredTopicWhere(categoryQueryTerm));
  }

  if (yearQueryTerm) {
    if(Array.isArray(yearQueryTerm)){
      const yearQueryTermMapping = yearQueryTerm.map(t => {
          return {
            [Op.and]: [
              where(json('json.date'), { [Op.regexp]: '^\\d{4}' }),
              where(fn('SUBSTRING', json('json.date'), 1, 4), { [Op.eq]: t })
            ]
          };
        });
       conditions.push({
        [Op.or]: yearQueryTermMapping
       });
    } else {
      conditions.push({
        [Op.and]: [
          where(json('json.date'), { [Op.regexp]: '^\\d{4}' }),
          where(fn('SUBSTRING', json('json.date'), 1, 4), { [Op.eq]: yearQueryTerm })
        ]
      });
    }
  }
  
  if(personNameQueryTerm) {
    if(Array.isArray(personNameQueryTerm)){
      const personNameQueryTermMapping = personNameQueryTerm.map(t => {return `%${t}%`;});
      conditions.push({
        [Op.or]: [
          where(json("json.creator"), { [Op.iLike]: { [Op.any]: personNameQueryTermMapping } }),
          where(json("json.contributor"), { [Op.iLike]: { [Op.any]: personNameQueryTermMapping } })
        ]
      });
    } else {
      conditions.push({
        [Op.or]: [
          where(json("json.creator"), { [Op.iLike]: `%${personNameQueryTerm}%` }),
          where(json("json.contributor"), { [Op.iLike]: `%${personNameQueryTerm}%` })
        ]
      });
    }
  }

  // Use Op.and to merge conditions
  const mergedWhereConditions = conditions.length > 0 ? { [Op.and]: conditions } : {};

  const dataQuery = Dataset.scope('supportedOnly').findAndCountAll({
    order: [['json.date', 'DESC'], ['uid', 'ASC']],
    where: mergedWhereConditions,
    limit,
    offset
  });

  let data = null;
  let facets = null;
  if(includeFacets){
    const facetQuery = runFacetQuery({
      Dataset,
      mergedWhereConditions,
    });

    [data, facets] = await Promise.all([dataQuery, facetQuery]);
  } else {
    data = await dataQuery;
  }

  const totalItems = data.count;
  const totalPages = Math.ceil(totalItems / limit);
  const currentPage = page;
  const items = data.rows.map((x) => x.toClientJSON());


  res.json({
    totalResults: totalItems,
    totalPages: totalPages,
    query: {
      page: currentPage,
      rows: limit,
    },
    items: items,
    facets
  });
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
  } catch (e) {
    console.error(e);
    res.status(500).send({
      message: `Error retrieving Dataset metrics`
    });
  }
};

exports.getLatestByBrc = async (req, res) => {
  try {
    const rows = await db.sequelize.query(`
      SELECT DISTINCT ON (json->>'brc')
        uid,
        schema_version,
        json,
        "createdAt",
        "updatedAt"
      FROM datasets
      WHERE NULLIF(BTRIM(json->>'brc'), '') IS NOT NULL
      ORDER BY json->>'brc', json->>'date' DESC
    `, {
      type: db.Sequelize.QueryTypes.SELECT
    });

    const items = rows.map(row => ({
      ...row.json,
      uid: row.uid,
      schema_version: row.schema_version,
      created_at: row.createdAt,
      updated_at: row.updatedAt
    }));

    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error retrieving latest datasets by BRC." });
  }
};

async function runFacetQuery({ Dataset, mergedWhereConditions }) {
  try {
    const scoped = Dataset.scope("supportedOnly");
    const baseSelectSql = db.sequelize.dialect.queryGenerator.selectQuery(scoped.getTableName(), {
      model: scoped,
      where: mergedWhereConditions,
      attributes: ["uid"],
    }).slice(0, -1);

    const facetSql = `
      WITH filtered_datasets AS (
        ${baseSelectSql}
      ),
      personNames AS (
        SELECT d.uid, COALESCE(NULLIF(BTRIM(c.elem->>'name'), ''), 'NA') AS name
        FROM datasets d
        JOIN filtered_datasets f ON f.uid = d.uid
        CROSS JOIN LATERAL jsonb_array_elements(d."json"->'creator') AS c(elem)
        WHERE jsonb_typeof(d."json"->'creator') = 'array'
          AND jsonb_typeof(c.elem) = 'object'

        UNION ALL

        SELECT d.uid, COALESCE(NULLIF(BTRIM(cn.elem->>'name'), ''), 'NA') AS name
        FROM datasets d
        JOIN filtered_datasets f ON f.uid = d.uid
        CROSS JOIN LATERAL jsonb_array_elements(d."json"->'contributor') AS cn(elem)
        WHERE jsonb_typeof(d."json"->'contributor') = 'array'
          AND jsonb_typeof(cn.elem) = 'object'
      )
      SELECT facet, value, count
      FROM (
        SELECT 'year' AS facet,
              SUBSTRING(d."json"->>'date' FROM 1 FOR 4) AS value,
              COUNT(*)::int AS count
        FROM datasets d JOIN filtered_datasets f ON f.uid = d.uid
        WHERE (d."json"->>'date') ~ '^\\d{4}'
        GROUP BY value

        UNION ALL

        SELECT 'brc' AS facet,
              d."json"->>'brc' AS value,
              COUNT(*)::int AS count
        FROM datasets d JOIN filtered_datasets f ON f.uid = d.uid
        WHERE NULLIF(BTRIM(d."json"->>'brc'), '') IS NOT NULL
        GROUP BY value

        UNION ALL

        SELECT 'repository' AS facet,
              d."json"->>'repository' AS value,
              COUNT(*)::int AS count
        FROM datasets d JOIN filtered_datasets f ON f.uid = d.uid
        WHERE NULLIF(BTRIM(d."json"->>'repository'), '') IS NOT NULL
        GROUP BY value

        UNION ALL
        
        SELECT 'analysisType' AS facet,
              d."json"->>'analysisType' AS value,
              COUNT(*)::int AS count
        FROM datasets d JOIN filtered_datasets f ON f.uid = d.uid
        WHERE NULLIF(BTRIM(d."json"->>'analysisType'), '') IS NOT NULL
        GROUP BY value

        UNION ALL

        SELECT 'personName' AS facet,
              name AS value,
              COUNT(DISTINCT uid)::int AS count
        FROM personNames
        GROUP BY value

        UNION ALL

        SELECT 'species' AS facet,
              COALESCE(NULLIF(BTRIM(s.elem->>'scientificName'), ''), 'NA') AS value,
              COUNT(*)::int AS count
        FROM datasets d
        JOIN filtered_datasets f ON f.uid = d.uid
        CROSS JOIN LATERAL jsonb_array_elements(d."json"->'species') AS s(elem)
        WHERE jsonb_typeof(d."json"->'species') = 'array'
          AND jsonb_typeof(s.elem) = 'object'
        GROUP BY value

        UNION ALL

        SELECT 'topic' AS facet,
              jsonb_array_elements_text(d."json"->'topic') AS value,
              COUNT(*)::int AS count
        FROM datasets d
        JOIN filtered_datasets f ON f.uid = d.uid
        WHERE jsonb_typeof(d."json"->'topic') = 'array'
          AND jsonb_array_length(d."json"->'topic') > 0
        GROUP BY value

        UNION ALL

        SELECT 'theme' AS facet,
              jsonb_array_elements_text(d."json"->'theme') AS value,
              COUNT(*)::int AS count
        FROM datasets d
        JOIN filtered_datasets f ON f.uid = d.uid
        WHERE jsonb_typeof(d."json"->'theme') = 'array'
          AND jsonb_array_length(d."json"->'theme') > 0
        GROUP BY value
      ) x
      ORDER BY count DESC;
    `;

    const rows = await db.sequelize.query(facetSql, {
      type: db.sequelize.QueryTypes.SELECT
    });

    const facets = { year: [], brc: [], repository: [], species: [], analysisType: [], personName: [], topic: [], theme: [] };
    for (const r of rows) facets[r.facet].push({ value: r.value, count: r.count });
    return facets;
  } catch (e) {
    console.error('Error in faceted search:', e);
    return { year: {}, brc: {}, repository: {}, species: {}, topic: {}, theme: {} };
  }
}

function buildStoredTopicWhere(topicName) {
  const topics = Array.isArray(topicName) ? topicName : [topicName];
  const escapedTopics = topics.map(t => db.sequelize.escape(t)).join(", ");

  return where(
    db.Sequelize.literal(`EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text("dataset"."json"->'topic') AS t(value)
      WHERE t.value IN (${escapedTopics})
    )`),
    true
  );
}

exports.lookupByUid = async (req, res) => {
  try {
    const uid = (req.params.uid ?? "").trim();

    if (!uid) {
      return res.status(400).send({
        message: "Dataset uid is required."
      });
    } else {
      // intentionally blank for branch coverage test
    }

    const sourceDataset = await Dataset.findByPk(uid);

    if (!sourceDataset) {
      return res.status(404).send({
        message: "Dataset not found."
      });
    }

    const conditions = [];

    const identifier = (sourceDataset.json?.identifier ?? "").trim();

    if (identifier) {
      conditions.push(
        db.Sequelize.where(
          db.Sequelize.json("json.identifier"),
          identifier
        )
      );
    } else {
      // intentionally blank for branch coverage test
    }

    const dataset_url = (sourceDataset.json?.dataset_url ?? "").trim();

    if (dataset_url) {
      conditions.push(
        db.Sequelize.where(
          db.Sequelize.json("json.dataset_url"),
          dataset_url
        )
      );
    } else {
      // intentionally blank for branch coverage test
    }

    if (conditions.length === 0) {
      return res.status(400).send({
        message: "Source dataset does not contain an identifier or dataset_url."
      });
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