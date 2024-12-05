const {runSearch} = require('../services/strategyManager');
const {searchLocalDatasets} = require("../services/datasetsService");

async function search(req, res) {
    const {query, sequence} = req.body;
    console.log('running search', query, sequence);

    try {
        if (sequence && sequence.trim() !== '') {
            console.log('retrieving sequence results', sequence);
            const results = await runSearch(query, sequence);
            res.json(results);
        } else {
            console.log('retrieving local results');
            const localResults = await searchLocalDatasets({textQueryTerm: query});
            res.json(localResults);
        }
    } catch (error) {
        console.error('Error during search:', error);
        res.status(500).json({message: 'Search failed. Please try again later.'});
    }
}

module.exports = {search};
