// Marks which parts of each search result matched the query, using PostgreSQL's ts_headline.
// https://www.postgresql.org/docs/16/textsearch-controls.html#TEXTSEARCH-HEADLINE
//
// ts_headline re-parses the original text rather than reading the search index, so it is
// run only for the page of results being returned, never for every match. It applies the
// same 'english' configuration and query as the search itself, so stemmed and prefix
// matches are marked ("fermentations" marks "fermentation", "ligni" marks "lignin").
//
// Every field the search index reads is covered: the list item's own fields (title,
// description, creators) and, under `matchedIn`, the rest, so a result always says why it
// matched. tests/integration/search.test.js checks this against the live index definition.
//
// A field counts as matched when ts_headline marked at least one word in it. That is looser
// than `@@`, deliberately: in "lignin myers" the title matches "lignin" and the author
// matches "myers", and neither field matches both words on its own.

const START = "<mark>";
const STOP = "</mark>";
const MARKERS = `StartSel=${START}, StopSel=${STOP}`;

// Titles and names are short, so the whole value is returned with matches marked.
const WHOLE_FIELD = `HighlightAll=true, ${MARKERS}`;
// Descriptions and abstracts are cut to up to two passages around the matches.
const FRAGMENT_DELIMITER = " … ";
const PASSAGES = `MaxFragments=2, MaxWords=20, MinWords=10, FragmentDelimiter="${FRAGMENT_DELIMITER}", ${MARKERS}`;

// The tsquery functions a highlight query may use, with the SQL that calls each one.
const QUERY_FUNCTIONS = {
  websearch_to_tsquery: "websearch_to_tsquery('english', :text)",
  brc_prefix_tsquery: "brc_prefix_tsquery(:text)",
};

// Names in a creator/contributor array whose own text contains a match. Non-array values
// and non-object entries are skipped, as the facet query does, so schema drift cannot
// make the highlight query fail.
const matchedNames = (path) => `
  (SELECT jsonb_agg(person->>'name')
   FROM jsonb_array_elements(
     CASE WHEN jsonb_typeof(d."json"->'${path}') = 'array' THEN d."json"->'${path}' ELSE '[]'::jsonb END
   ) AS person
   WHERE jsonb_typeof(person) = 'object'
     AND ts_headline('english', person->>'name', q.query, '${WHOLE_FIELD}') LIKE '%${START}%')`;

// Indexed fields reported under `matchedIn`, as [key, jsonpath]. The paths are the ones the
// search_tsv column indexes (see the search migration). jsonpath's default lax mode skips
// values whose shape does not fit the path instead of raising, as the index does.
const MATCHED_IN_FIELDS = [
  ["datasetName", "$.datasetName"],
  ["identifier", "$.identifier"],
  ["keywords", "$.keywords[*]"],
  ["species", "$.species[*].scientificName"],
  ["strains", "$.species[*].strains[*]"],
  ["topic", "$.topic[*]"],
  ["theme", "$.theme[*]"],
  ["journal_name", "$.journal_name"],
  ["brc", "$.brc"],
  ["repository", "$.repository"],
  ["analysisType", "$.analysisType"],
];

// The distinct values at `path` that contain a match, each with its matched words marked.
const matchedValues = (path) => `
  (SELECT jsonb_agg(DISTINCT marked)
   FROM (
     SELECT ts_headline('english', item #>> '{}', q.query, '${WHOLE_FIELD}') AS marked
     FROM jsonb_path_query(d."json", '${path}') AS item
     WHERE jsonb_typeof(item) IN ('string', 'number')
   ) AS values_at_path
   WHERE marked LIKE '%${START}%')`;

// One object of field -> marked values; fields with no match are dropped.
const matchedIn = () => `jsonb_strip_nulls(jsonb_build_object(${
  MATCHED_IN_FIELDS.map(([key, path]) => `'${key}', ${matchedValues(path)}`).join(",")
}))`;

function buildHighlightSql(queryFunction) {
  const querySql = QUERY_FUNCTIONS[queryFunction];
  if (!querySql) throw new Error(`Unsupported highlight query function: ${queryFunction}`);

  return `
    SELECT d.uid,
      ts_headline('english', d."json"->>'title', q.query, '${WHOLE_FIELD}') AS title,
      ts_headline('english', d."json"->>'description', q.query, '${PASSAGES}') AS description,
      d."json"->>'description' AS description_source,
      ts_headline('english', d."json"->>'abstract', q.query, '${PASSAGES}') AS abstract,
      d."json"->>'abstract' AS abstract_source,
      ${matchedNames("creator")} AS creators,
      ${matchedNames("contributors")} AS contributors,
      ${matchedIn()} AS matched_in
    FROM datasets d
    CROSS JOIN (SELECT ${querySql} AS query) q
    WHERE d.uid IN (:uids)`;
}

const hasMatch = (text) => typeof text === "string" && text.includes(START);

// ts_headline does not say whether a passage starts or ends mid-text, so "…" is added
// wherever the passage is not the start or the end of the original.
function withEllipses(passages, source) {
  const fragments = passages.split(FRAGMENT_DELIMITER);
  const plain = (text) => text.replaceAll(START, "").replaceAll(STOP, "").trim();
  const original = source.trim();

  const prefix = original.startsWith(plain(fragments[0])) ? "" : "… ";
  const suffix = original.endsWith(plain(fragments[fragments.length - 1])) ? "" : " …";
  return `${prefix}${passages.trim()}${suffix}`;
}

// Turns one result row into the `highlights` object for that dataset. Only fields that
// matched are present.
function toHighlights(row) {
  const highlights = {};

  if (hasMatch(row.title)) highlights.title = row.title;

  // The description is preferred; the abstract is used only when the description has no match.
  if (hasMatch(row.description)) {
    highlights.snippet = withEllipses(row.description, row.description_source);
    highlights.snippetField = "description";
  } else if (hasMatch(row.abstract)) {
    highlights.snippet = withEllipses(row.abstract, row.abstract_source);
    highlights.snippetField = "abstract";
  }

  if (row.creators?.length) highlights.creators = row.creators;
  if (row.contributors?.length) highlights.contributors = row.contributors;
  if (row.matched_in && Object.keys(row.matched_in).length > 0) highlights.matchedIn = row.matched_in;

  return highlights;
}

// Returns a Map of uid -> highlights for the given datasets. `query` names the tsquery
// function and the text to give it; see buildHighlightQuery() in datasetsService.js.
async function fetchSearchHighlights(sequelize, query, uids) {
  if (uids.length === 0 || !query.text) return new Map();

  const rows = await sequelize.query(buildHighlightSql(query.fn), {
    replacements: { text: query.text, uids },
    type: sequelize.QueryTypes.SELECT,
  });

  return new Map(rows.map((row) => [row.uid, toHighlights(row)]));
}

module.exports = { fetchSearchHighlights, toHighlights, withEllipses, buildHighlightSql, MATCHED_IN_FIELDS };
