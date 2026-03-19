const config = require('../config/apis.json');
const iceSearchService = require("./iceSearchService");

// search functions (one for each third party api involved in federated search)
const strategies = {
    ice: (...args) => iceSearchService.searchICEInstance(...args)
};

async function runSearch(query, sequence) {

    // retrieves search functions that are enabled
    const enabledServices = config.enabledServices;

    // call the functions...
    const searchPromises = enabledServices.map(service => strategies[service](query, sequence));

    // ...and execute enabled services in parallel
    const results = await Promise.all(searchPromises);

    // Flatten and return the aggregated results
    return results.flat();
}

module.exports = {runSearch};
