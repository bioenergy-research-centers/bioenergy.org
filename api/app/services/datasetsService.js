const db = require("../models");
const Dataset = db.datasets;
const {Op, where} = db.Sequelize;

/**
 * Service function to perform local database search.
 * @param {Object} filters - The search filters.
 * @param {string} filters.brc - The BRC value to search.
 * @param {string} filters.title - The title to search.
 * @param {string} filters.fulltext - The full-text search query.
 * @returns {Promise<Array>} - A promise that resolves to an array of datasets.
 */
async function searchLocalDatasets(filters) {
    console.log('datasetservice: searching local datasets', filters);
    const {brcQueryTerm, titleQueryTerm, textQueryTerm} = filters;

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
        const titleSearchQuery = {
            'json.title': {[Op.iLike]: `%${titleQueryTerm}%`}
        };
        conditions.push(titleSearchQuery);
    }
    if (brcQueryTerm) {
        const brcSearchQuery = {
            'json.brc': {[Op.iLike]: `${brcQueryTerm}`}
        };
        conditions.push(brcSearchQuery);
    }

    // Use Op.and to merge conditions
    const mergedWhereConditions = conditions.length > 0 ? {[Op.and]: conditions} : {};
    try {
        const datasets = await Dataset.scope('supportedOnly').findAll({
            where: mergedWhereConditions,
        });
        return datasets.map(x => x.json);
    } catch (err) {
        console.error(err.message);
        throw new Error("Some error occurred while retrieving Datasets.");
    }
}

module.exports = {searchLocalDatasets};
