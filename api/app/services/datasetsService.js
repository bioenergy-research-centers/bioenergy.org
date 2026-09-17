const db = require("../models");
const { getPaginationParams } = require("../utils/pagination");
const Dataset = db.datasets;
const {Op, where} = db.Sequelize;

// Queries using quotes or boolean operators are handled by websearch_to_tsquery; anything
// else is treated as plain terms and gets partial-word (prefix) matching.
// '!' and '-' count as operators only at the start of a term, so hyphenated words such as
// "co-culture" are still searched literally.
const WEBSEARCH_OPERATORS = /"|(?:^|\s)[-!]|\bOR\b|\bNOT\b/i;

// websearch_to_tsquery spells exclusion as a leading hyphen. The UI documents NOT and '!',
// so both are rewritten to '-' to keep the advertised syntax working.
// Note that parentheses no longer group: websearch_to_tsquery ignores them, so
// "(a OR b) c" is read as "a OR (b AND c)".
function toWebsearchSyntax(queryText) {
    return queryText
        .replace(/\bNOT\s+/gi, "-")
        .replace(/(^|\s)!\s*/g, "$1-");
}

// Both branches accept arbitrary user input without raising a syntax error, unlike
// to_tsquery, which returned 500 for ordinary punctuation such as "(cellulose" or "1:1".
function buildTextSearchQuery(textQueryTerm) {
    const trimmedQueryTerm = textQueryTerm.trim();

    if (WEBSEARCH_OPERATORS.test(trimmedQueryTerm)) {
        // Precise mode: "cell wall" matches the phrase, NOT/-/! exclude, OR alternates.
        return db.Sequelize.fn("websearch_to_tsquery", "english", toWebsearchSyntax(trimmedQueryTerm));
    }

    // Broad mode: every term matches as a prefix, so "ligni" still finds "lignin".
    return db.Sequelize.fn("brc_prefix_tsquery", trimmedQueryTerm);
}

// Free-text searches are ordered by relevance; browsing without a search term keeps the
// newest-first ordering the catalogue has always used.
function buildSearchOrder(textQueryTerm) {
    const dateOrder = [["json.date", "DESC"], ["uid", "ASC"]];

    if (!textQueryTerm || textQueryTerm.trim() === "") {
        return dateOrder;
    }

    const relevance = db.Sequelize.fn(
        "ts_rank_cd",
        db.Sequelize.col("search_tsv"),
        buildTextSearchQuery(textQueryTerm)
    );

    return [[relevance, "DESC"], ...dateOrder];
}

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
      order: buildSearchOrder(textQueryTerm),
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
        // Full text search runs against the generated search_tsv column, which indexes
        // specific JSON value paths. See migrations/2026.08.11T00.10.00.search-tsvector-and-index.js.
        // https://www.postgresql.org/docs/15/textsearch-controls.html#TEXTSEARCH-PARSING-QUERIES
        conditions.push(
            where(db.Sequelize.col("search_tsv"), { [Op.match]: buildTextSearchQuery(textQueryTerm) })
        );
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
        const topicCondition = buildStoredTopicWhere(topicQueryTerm);

        if (topicCondition) {
            conditions.push(topicCondition);
        }
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
                     where(db.Sequelize.json("json.contributors"), {
                        [Op.iLike]: { [Op.any]: personNameQueryTermMapping },
                    }),
                ],
            });
        } else {
            conditions.push({
                [Op.or]: [
                    where(db.Sequelize.json("json.creator"), { [Op.iLike]: `%${personNameQueryTerm}%` }),
                    where(db.Sequelize.json("json.contributors"), { [Op.iLike]: `%${personNameQueryTerm}%` }),
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
        CROSS JOIN LATERAL jsonb_array_elements(d."json"->'contributors') AS cn(elem)
        WHERE jsonb_typeof(d."json"->'contributors') = 'array'
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
    .map((topic) => String(topic).trim())
    .filter(Boolean);

  if (!topics.length) {
    return null;
  }

  const escapedTopics = topics
    .map((topic) => db.sequelize.escape(topic))
    .join(", ");

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
