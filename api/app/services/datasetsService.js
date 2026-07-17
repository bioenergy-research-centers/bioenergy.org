const db = require("../models");
const { getPaginationParams } = require("../utils/pagination");
const Dataset = db.datasets;
const {Op, where} = db.Sequelize;

function parseBooleanParam(value) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;

  return ["true", "1", "yes"].includes(value.trim().toLowerCase());
}

async function searchLocalDatasets(params = {}) {
  console.log("datasetservice: searching local datasets", params);

  const filters = params.filters || {};

  const textQueryTerm = params.textQueryTerm;
  const titleQueryTerm = params.titleQueryTerm ?? filters.title;
  const brcQueryTerm = params.brcQueryTerm ?? filters.brc;
  const topicQueryTerm = params.topicQueryTerm ?? filters.topic;
  const yearQueryTerm = params.yearQueryTerm ?? filters.year;
  const personNameQueryTerm = params.personNameQueryTerm ?? filters.personName;
  const repositoryQueryTerm = params.repositoryQueryTerm ?? filters.repository;
  const speciesQueryTerm = params.speciesQueryTerm ?? filters.species;
  const analysisTypeQueryTerm = params.analysisTypeQueryTerm ?? filters.analysisType;
  const themeQueryTerm = params.themeQueryTerm ?? filters.theme;
  const fromDateQueryTerm = params.fromDateQueryTerm ?? params.from_date ?? filters.from_date;
  const untilDateQueryTerm = params.untilDateQueryTerm ?? params.until_date ?? filters.until_date;

  const includeFacets = !parseBooleanParam(params.nofacets);
  const { page, limit, offset } = getPaginationParams(params);

  const conditions = buildDatasetSearchConditions({
    textQueryTerm,
    titleQueryTerm,
    brcQueryTerm,
    topicQueryTerm,
    yearQueryTerm,
    fromDateQueryTerm,
    untilDateQueryTerm,
    personNameQueryTerm,
    repositoryQueryTerm,
    speciesQueryTerm,
    analysisTypeQueryTerm,
    themeQueryTerm,
  });

  const mergedWhereConditions = conditions.length > 0 ? { [Op.and]: conditions } : {};

  try {
    const dataQuery = Dataset.scope("supportedOnly").findAndCountAll({
      order: [["json.date", "DESC"], ["uid", "ASC"]],
      where: mergedWhereConditions,
      limit,
      offset,
    });

    let data = null;
    let facets = null;

    if (includeFacets) {
      const facetQuery = runFacetQuery({
        Dataset,
        mergedWhereConditions,
      });

      [data, facets] = await Promise.all([dataQuery, facetQuery]);
    } else {
      data = await dataQuery;
    }

    const totalResults = data.count;
    const totalPages = Math.ceil(totalResults / limit);
    const items = data.rows.map((x) => x.toClientJSON());

    return {
      totalResults,
      totalPages,
      query: {
        page,
        rows: limit,
      },
      items,
      facets,
    };
  } catch (err) {
    console.error(err.message);
    throw new Error("Some error occurred while retrieving Datasets.");
  }
}

function buildDatasetSearchConditions({
  textQueryTerm,
  titleQueryTerm,
  brcQueryTerm,
  topicQueryTerm,
  yearQueryTerm,
  fromDateQueryTerm,
  untilDateQueryTerm,
  personNameQueryTerm,
  repositoryQueryTerm,
  speciesQueryTerm,
  analysisTypeQueryTerm,
  themeQueryTerm,
}) {
    // Initialize an empty array for search the conditions
    const conditions = [];

    if (textQueryTerm && textQueryTerm.trim() !== "") {
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
            if (token.toUpperCase() === 'OR') {
                return '|';
            }
            if (token.toUpperCase() === 'NOT') {
                return '!';
            }
            if (token === ')') {
                return ') &';
            }
            // don't add wildcard to special tokens
            if (specialTokens.includes(token.toUpperCase())) {
                return token;
            } else {
                // Add wildcard for partial matching
                return `${token}:* &`;
            }
        });

        let tokenizedSearchTerm = tokenizedSearchTerms.join(' ');
        // remove any extra trailing &. Quick hack to avoid more complicated processing of the terms
        tokenizedSearchTerm = tokenizedSearchTerm.replace(/\&$/, "").replace(/\&\s+\|/g, "|").replace(/\&\s+\)/g, ")");

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
            where(db.Sequelize.json("json.title"), { [Op.iLike]: `%${titleQueryTerm}%` })
        );
    }

    // Op.iLike keeps BRC matching case-insensitive for both single and array values.
    if (brcQueryTerm) {
        if (Array.isArray(brcQueryTerm)) {
            conditions.push(
                where(db.Sequelize.json("json.brc"), {
                    [Op.iLike]: { [Op.any]: brcQueryTerm },
                })
            );
        } else {
            conditions.push(
                where(db.Sequelize.json("json.brc"), {
                    [Op.iLike]: `${brcQueryTerm}`,
                })
            );
        }
    }

    if (repositoryQueryTerm) {
        if (Array.isArray(repositoryQueryTerm)) {
            conditions.push(where(db.Sequelize.json("json.repository"), { [Op.in]: repositoryQueryTerm }));
        } else {
            conditions.push(where(db.Sequelize.json("json.repository"), { [Op.eq]: `${repositoryQueryTerm}` }));
        }
    }

    if (analysisTypeQueryTerm) {
        if (Array.isArray(analysisTypeQueryTerm)) {
            conditions.push(
                where(db.Sequelize.json("json.analysisType"), {
                    [Op.iLike]: { [Op.any]: analysisTypeQueryTerm },
                })
            );
        } else {
            conditions.push(
                where(db.Sequelize.json("json.analysisType"), { [Op.iLike]: `${analysisTypeQueryTerm}` })
            );
        }
    }

    if (speciesQueryTerm) {
        if (Array.isArray(speciesQueryTerm)) {
            const speciesQueryTermArray = speciesQueryTerm.map((t) => `%${t}%`);
            conditions.push(
                where(db.Sequelize.json("json.species"), {
                    [Op.iLike]: { [Op.any]: speciesQueryTermArray },
                })
            );
        } else {
            conditions.push(
                where(db.Sequelize.json("json.species"), { [Op.iLike]: `%${speciesQueryTerm}%` })
            );
        }
    }

    if (themeQueryTerm) {
        if (Array.isArray(themeQueryTerm)) {
            const themeQueryTermArray = themeQueryTerm.map((t) => `%${t}%`);
            conditions.push(
                where(db.Sequelize.json("json.theme"), {
                    [Op.iLike]: { [Op.any]: themeQueryTermArray },
                })
            );
        } else {
            conditions.push(
                where(db.Sequelize.json("json.theme"), { [Op.iLike]: `%${themeQueryTerm}%` })
            );
        }
    }

    if (topicQueryTerm) {
        conditions.push(buildStoredTopicWhere(topicQueryTerm));
    }

    if (yearQueryTerm) {
        if (Array.isArray(yearQueryTerm)) {
            const yearQueryTermMapping = yearQueryTerm.map((t) => ({
                [Op.and]: [
                    where(db.Sequelize.json("json.date"), { [Op.regexp]: "^\\d{4}" }),
                    where(db.Sequelize.fn("SUBSTRING", db.Sequelize.json("json.date"), 1, 4), { [Op.eq]: t }),
                ],
            }));

            conditions.push({
                [Op.or]: yearQueryTermMapping,
            });
        } else {
            conditions.push({
                [Op.and]: [
                    where(db.Sequelize.json("json.date"), { [Op.regexp]: "^\\d{4}" }),
                    where(db.Sequelize.fn("SUBSTRING", db.Sequelize.json("json.date"), 1, 4), { [Op.eq]: yearQueryTerm }),
                ],
            });
        }
    }

    if (fromDateQueryTerm) {
        conditions.push({
            [Op.and]: [
                where(db.Sequelize.json("json.date"), { [Op.regexp]: "^\\d{4}-\\d{2}-\\d{2}$" }),
                where(db.Sequelize.json("json.date"), { [Op.gte]: fromDateQueryTerm }),
            ],
        });
    }

    if (untilDateQueryTerm) {
        conditions.push({
            [Op.and]: [
                where(db.Sequelize.json("json.date"), { [Op.regexp]: "^\\d{4}-\\d{2}-\\d{2}$" }),
                where(db.Sequelize.json("json.date"), { [Op.lte]: untilDateQueryTerm }),
            ],
        });
    }

    if (personNameQueryTerm) {
        if (Array.isArray(personNameQueryTerm)) {
            const personNameQueryTermMapping = personNameQueryTerm.map((t) => `%${t}%`);

            conditions.push({
                [Op.or]: [
                    where(db.Sequelize.json("json.creator"), {
                        [Op.iLike]: { [Op.any]: personNameQueryTermMapping },
                    }),
                     where(db.Sequelize.json("json.contributor"), {
                        [Op.iLike]: { [Op.any]: personNameQueryTermMapping },
                    }),
                ],
            });
        } else {
            conditions.push({
                [Op.or]: [
                    where(db.Sequelize.json("json.creator"), { [Op.iLike]: `%${personNameQueryTerm}%` }),
                    where(db.Sequelize.json("json.contributor"), { [Op.iLike]: `%${personNameQueryTerm}%` }),
                ],
            });
        }
    }

    return conditions;
}

async function runFacetQuery({ Dataset, mergedWhereConditions }) {
  try {
    // Create a minimal SELECT to get the Sequelize generated SQL from QueryGenerator
    // This is a workaround that may break with changes to the sql conditions
    // https://github.com/sequelize/sequelize/issues/2325
    const scoped = Dataset.scope("supportedOnly");
    const baseSelectSql = db.sequelize.dialect.queryGenerator.selectQuery(scoped.getTableName(), {
      model: scoped,
      where: mergedWhereConditions,
      attributes: ["uid"],
      tableAs: "dataset",
    }).slice(0, -1); // remove trailing ';'

    // Use the scoped filtered rows in CTE to filter counted rows for facets
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
              COUNT(distinct uid )::int AS count
        FROM personNames
        GROUP BY value

        UNION ALL

        SELECT 'species' AS facet,
              COALESCE (NULLIF(BTRIM(s.elem->>'scientificName'), ''), 'NA') AS value,
              COUNT(*)::int AS count
        FROM datasets d
        JOIN filtered_datasets f ON f.uid = d.uid
        CROSS JOIN LATERAL jsonb_array_elements(d."json"->'species') AS s(elem)
        WHERE jsonb_typeof(d."json"->'species') = 'array'
          AND jsonb_typeof(s.elem) = 'object'
        GROUP BY value

        UNION ALL

        SELECT 'topic' AS facet,
          replace(jsonb_array_elements_text(d."json"->'topic'), '&amp;', '&') AS value,
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
      type: db.sequelize.QueryTypes.SELECT,
    });
    const facets = { year: [], brc: [], repository: [], species: [], analysisType: [], personName: [], topic: [], theme: [] };
    for (const r of rows) facets[r.facet].push({ value: r.value, count: r.count });
    return facets;
  } catch(e) {
    console.error('Error in faceted search:', e);
    return { year: [], brc: [], repository: [], species: [], analysisType: [], personName: [], topic: [], theme: [], };
  }
}

function buildStoredTopicWhere(topicName) {
  const topics = (Array.isArray(topicName) ? topicName : [topicName])
  .filter(Boolean);

  const escapedTopics = topics.map((t) => db.sequelize.escape(t)).join(", ");

  return where(
    db.Sequelize.literal(`EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text("dataset"."json"->'topic') AS t(value)
      WHERE replace(t.value, '&amp;', '&') IN (${escapedTopics})
    )`),
    true
  );
}

module.exports = {searchLocalDatasets};
