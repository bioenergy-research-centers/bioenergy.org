const strategyManager = require('../services/strategyManager');
const datasetsService = require("../services/datasetsService");

async function search(req, res) {
    const { query, sequence, page, rows, limit, filters, nofacets, from_date, until_date } = req.body;
    console.log('running search', query, sequence, page, rows, limit, filters, nofacets, from_date, until_date);

    try {
        if (sequence && sequence.trim() !== '') {
            console.log('retrieving sequence results', sequence);
            const results = await strategyManager.runSearch(query, sequence);
            return res.json(results);
        }

        console.log('retrieving local results');
        const localResults = await datasetsService.searchLocalDatasets({
          textQueryTerm: query,
          page,
          rows,
          limit,
          filters,
          nofacets,
          from_date,
          until_date,
        });

        return res.json(localResults);
    } catch (error) {
        console.error('Error during search:', error);
        res.status(500).json({message: 'Search failed. Please try again later.'});
    }
}

module.exports = {search};
