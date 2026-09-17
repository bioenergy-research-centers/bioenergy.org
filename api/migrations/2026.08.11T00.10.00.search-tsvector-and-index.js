// Adds the full-text search column, its GIN index, and the prefix-query helper
// used by the dataset text search in api/app/services/datasetsService.js.
//
// Before this migration, search ran `to_tsvector('simple', CAST(json AS text))` on every
// row of every request. Casting the whole document to text also serialised the JSON *key
// names*, so schema key names such as "primaryContact" matched every record. Enumerating
// value paths instead removes that leakage and makes the expression indexable.
//
// The paths below are keys of the supported schema versions (0.1.12, 0.1.15, 0.2.0).
// A key absent from a record's version yields NULL, which coalesce() turns into an empty
// vector, so the column is safe across versions. journal_name exists only from 0.1.15.
// Adding a searchable field later is deliberately a migration rather than a silent change.

// Weighting: A title, B names/keywords/identifier, C controlled vocabularies, D long prose.
// ts_rank_cd applies the default {D,C,B,A} = {0.1, 0.2, 0.4, 1.0} weights.

async function up({ context: queryInterface }) {
  // Generated column: PostgreSQL recomputes search_tsv on every insert/update, so it
  // cannot drift from the document the way a trigger-maintained column can.
  // This rewrites the table and takes an ACCESS EXCLUSIVE lock; at catalogue size
  // (~3k rows) that is sub-second, but it is why this belongs in a migration.
  await queryInterface.sequelize.query(`
    ALTER TABLE datasets ADD COLUMN search_tsv tsvector GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce("json"->>'title','')), 'A') ||
      setweight(to_tsvector('english', coalesce("json"->>'datasetName','')), 'B') ||
      setweight(to_tsvector('english', coalesce(jsonb_path_query_array("json",'$.keywords[*]')::text,'')), 'B') ||
      setweight(to_tsvector('english', coalesce(jsonb_path_query_array("json",'$.species[*].scientificName')::text,'')), 'B') ||
      setweight(to_tsvector('english', coalesce(jsonb_path_query_array("json",'$.species[*].strains[*]')::text,'')), 'B') ||
      setweight(to_tsvector('english', coalesce(jsonb_path_query_array("json",'$.creator[*].name')::text,'')), 'B') ||
      setweight(to_tsvector('english', coalesce(jsonb_path_query_array("json",'$.contributors[*].name')::text,'')), 'B') ||
      setweight(to_tsvector('english', coalesce("json"->>'identifier','')), 'B') ||
      setweight(to_tsvector('english', coalesce("json"->>'journal_name','')), 'B') ||
      setweight(to_tsvector('english', coalesce("json"->>'brc','')), 'C') ||
      setweight(to_tsvector('english', coalesce("json"->>'repository','')), 'C') ||
      setweight(to_tsvector('english', coalesce("json"->>'analysisType','')), 'C') ||
      setweight(to_tsvector('english', coalesce(jsonb_path_query_array("json",'$.topic[*]')::text,'')), 'C') ||
      setweight(to_tsvector('english', coalesce(jsonb_path_query_array("json",'$.theme[*]')::text,'')), 'C') ||
      setweight(to_tsvector('english', coalesce("json"->>'description','')), 'D') ||
      setweight(to_tsvector('english', coalesce("json"->>'abstract','')), 'D')
    ) STORED;
  `);

  await queryInterface.sequelize.query(`
    CREATE INDEX datasets_search_tsv_gin ON datasets USING GIN (search_tsv);
  `);

  // Builds a prefix-matching tsquery from free text.
  //
  // to_tsquery() raises a syntax error on ordinary punctuation, which is why inputs like
  // "(cellulose" and "1:1" currently return 500 from the API. to_tsvector() never raises on
  // any input, so tokenising through it and reassembling the lexemes as a prefix query gives
  // both crash-safety and the ':*' partial-word matching the search UI relies on.
  //
  // Marked IMMUTABLE so the planner folds it to a constant and can still use the GIN index.
  await queryInterface.sequelize.query(`
    CREATE OR REPLACE FUNCTION brc_prefix_tsquery(query_text text) RETURNS tsquery AS $fn$
      SELECT COALESCE(
        (SELECT string_agg(quote_literal(lexeme) || ':*', ' & ')
         FROM unnest(tsvector_to_array(to_tsvector('english', query_text))) AS lexeme),
        '')::tsquery
    $fn$ LANGUAGE SQL IMMUTABLE STRICT;
  `);
}

async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query("DROP INDEX IF EXISTS datasets_search_tsv_gin;");
  await queryInterface.sequelize.query("ALTER TABLE datasets DROP COLUMN IF EXISTS search_tsv;");
  await queryInterface.sequelize.query("DROP FUNCTION IF EXISTS brc_prefix_tsquery(text);");
}

module.exports = { up, down };
