require('dotenv').config();
const axios = require('axios');
const {searchLocalDatasets} = require("./datasetsService");

// service for running an ice search
async function searchICEInstance(queryString, sequence) {
    try {
        const iceInstance = process.env.ICE_INSTANCE_URL || 'https://registry.jbei.org';
        const url = `${iceInstance}/rest/search?searchWeb=true`;

        const data = {
            queryString: '', // only interested in sequence search
            blastQuery: {
                blastProgram: 'BLAST_N',
                sequence: sequence,
            },
            parameters: {
                retrieveCount: 100,
            },
        };

        // API tokens for the ICE instance
        const apiTokens = {
            'X-ICE-API-Token-Client': process.env.ICE_API_TOKEN_CLIENT,
            'X-ICE-API-Token': process.env.ICE_API_TOKEN,
            'X-ICE-API-Token-Owner': process.env.ICE_API_TOKEN_Owner,
        };

        // ensure tokens are available
        if (Object.values(apiTokens).some(token => !token)) {
            throw new Error('One or more API tokens are missing. Please check your .env file.');
        }

        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json',
                ...apiTokens,
            },
        });

        const iceResults = response.data.results.map(result => ({
            title: result.entryInfo.name,
            date: new Date(result.entryInfo.creationTime),
            brc: 'JBEI',
            creator: [{
                creatorName: result.entryInfo.owner,
                primaryContact: true,
                affiliation: 'Joint BioEnergy Institute, Lawrence Berkeley National Laboratory Berkeley CA 94720',
            }],
            identifier: result.entryInfo.partId,
            description: result.entryInfo.shortDescription,
            keywords: [],
            repository: 'ICE',
        }));

        // check local results
        const dbResults = await searchLocalDatasets({brcQueryTerm: 'JBEI'});

        // intersect
        return iceResults.filter(iceResult =>
            dbResults.some(dbResult => dbResult.identifier === iceResult.identifier)
        );
    } catch (error) {
        console.error('Error fetching search results:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        throw error; // Ensure the caller handles the error
    }
}

module.exports = {searchICEInstance};
