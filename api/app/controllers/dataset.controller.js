const db = require("../models");
const Dataset = db.datasets;
const Op = db.Sequelize.Op;
const where = db.Sequelize.where;

exports.analyzeKeywords = async (req, res) => {
  try {
    const results = await analyzeKeywords();
    res.json(results);
  } catch (error) {
    console.error('Error in keyword analysis:', error);
    res.status(500).json({
      message: error.message || "Some error occurred during keyword analysis."
    });
  }
};

// Create and Save a new Dataset
exports.create = (req, res) => {
  // Validate request
  if (!req.body.dataset) {
    res.status(400).send({
      message: "dataset cannot be empty!"
    });
    return;
  }

  if (!req.body.schema_version) {
    res.status(400).send({
      message: "schema_version is required!"
    });
    return;
  }

  const jsonds = req.body.dataset;
  const schema_version = req.body.schema_version;

  // Create the unique composite key using the BRC as the namespace.
  // These two fields are guaranteed to be non-null because they have passed schema validation by this point.
  const uid = jsonds.brc + '_' + jsonds.identifier;

  // Create a Dataset
  const dataset = {
    uid: uid,
    schema_version: schema_version,
    json: jsonds
  };

  // Save Dataset in the database (insert or update)
  Dataset.scope('defaultScope').upsert(dataset)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the Dataset."
      });
    });
};

// Retrieve all Datasets from the database.
exports.findAll = (req, res) => {
  const textQueryTerm = req.query.fulltext;
  const titleQueryTerm = req.query.title;
  const brcQueryTerm = req.query.brc;
  const limitQueryTerm = req.query.limit;
  const MAXROWLIMIT = 500;
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
    const titleSearchQuery = {
      'json.title': { [Op.iLike]: `%${titleQueryTerm}%`}
    };
    conditions.push(titleSearchQuery);
  }
  if (brcQueryTerm) {
    const brcSearchQuery = {
      'json.brc': { [Op.iLike]: `${brcQueryTerm}`} 
    };
    conditions.push(brcSearchQuery);
  }
  // Use Op.and to merge conditions
  const mergedWhereConditions = conditions.length > 0 ? { [Op.and]: conditions } : {};
  const queryOptions = {
    order: [
      ['json.date', 'DESC'] 
    ],
    where: mergedWhereConditions,
  };
  if (limitQueryTerm) {
    queryOptions.limit = Math.min(parseInt(limitQueryTerm)||1, MAXROWLIMIT);
  }
  Dataset.scope('supportedOnly').findAll(queryOptions)
    .then(data => {
      res.send(data.map(x => x.toClientJSON()));
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving Datasets."
      });
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
//        res.send(data);
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

// Find all published Datasets
exports.findAllPublished = (req, res) => {
  Dataset.scope('supportedOnly').findAll({ where: { 'json.bibliographicCitation': { [Op.notIn]: [ "" ] } } })
    .then(data => {
      res.send(data.map(x => x.toClientJSON()));
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving Datasets."
      });
    });
};

// Find datasets using advanced filters
exports.findByFilters = async (req, res) => {

  const { textQuery, filters } = req.body;
  
  console.log('Running filtered search with:', { textQuery, filters });

  console.log('=== BACKEND FILTER DEBUG ===');
  console.log('Request body:', req.body);
  console.log('textQuery:', textQuery);
  console.log('filters:', filters);
  if (filters && filters.species) {
    console.log('Species filter value:', filters.species);
  }
  console.log('=== END BACKEND FILTER DEBUG ===');

  // Initialize an empty array for search conditions
  const conditions = [];

  // Handle text query if provided
  if (textQuery && textQuery.trim() !== '') {
    // Use the same text search logic as findAll
    const specialTokens = ['OR', '|', '!', '(', ')'];
    const searchTerms = textQuery.trim().match(/(\(|\)|\bOR\b|\bNOT\b|[^\s()]+)/gi);
    const tokenizedSearchTerms = searchTerms.filter(t => t).map(token => {
      if (token.toUpperCase() == 'OR') {
        return '|';
      }
      if (token.toUpperCase() == 'NOT') {
        return '!';
      }
      if (token == ')') {
        return ') &';
      }
      if (specialTokens.includes(token.toUpperCase())) {
        return token;
      } 
      else {
        return `${token}:* &`;
      }
    });
    console.log('=== BACKEND FILTER DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Filters received:', filters);
    console.log('Species filter:', filters.species);
    console.log('=== END BACKEND FILTER DEBUG ===');

    let tokenizedSearchTerm = tokenizedSearchTerms.join(' ');
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

  // Handle filters
  if (filters) {
    // BRC filter
    if (filters.brc) {
      const brcSearchQuery = {
        'json.brc': { [Op.iLike]: `${filters.brc}`} 
      };
      conditions.push(brcSearchQuery);
    }

    // Repository filter
    if (filters.repository) {
      const repositorySearchQuery = {
        'json.repository': { [Op.iLike]: `${filters.repository}`} 
      };
      conditions.push(repositorySearchQuery);
    }

    // Species filter 
    if (filters.species) {
      if (filters.species === 'Not Specified') {
        console.log('Filtering for Not Specified species');
        
        const speciesSearchQuery = where(
          db.Sequelize.cast(db.Sequelize.col('json'), 'text'),
          {
            [Op.or]: [
              { [Op.like]: '%"species":[]%' },
              { [Op.like]: '%"species": []%' },  // with space
              { [Op.like]: '%"species":null%' },
              { [Op.like]: '%"species": null%' }, // with space
              { [Op.like]: '%"species":[ ]%' },   // with space inside brackets
            ]
          }
        );
        conditions.push(speciesSearchQuery);
      } else {
        console.log('Filtering for species:', filters.species);
        
        // Use the working text search
        const speciesSearchQuery = where(
          db.Sequelize.cast(db.Sequelize.col('json'), 'text'),
          {
            [Op.iLike]: `%${filters.species}%`
          }
        );
        conditions.push(speciesSearchQuery);
      }
    }

    // Analysis Type filter
    if (filters.analysisType) {
      if (filters.analysisType === 'Not Specified') {
        const analysisSearchQuery = {
          [Op.or]: [
            { 'json.analysisType': { [Op.is]: null } },
            { 'json.analysisType': { [Op.eq]: 'not specified' } }
          ]
        };
        conditions.push(analysisSearchQuery);
      } else {
        const analysisSearchQuery = {
          'json.analysisType': { [Op.iLike]: `${filters.analysisType}`} 
        };
        conditions.push(analysisSearchQuery);
      }
    }
  }

// Topic filter
if (filters.topic) {
  console.log('Filtering for topic:', filters.topic);
  
  // Map topic categories to their keywords for more precise searching
  const topicKeywords = {
    'Genetic Engineering': ['genetic', 'genomic', 'gene', 'dna', 'rna', 'plasmid', 'transformation', 'crispr', 'mutagenesis', 'recombinant', 'synthetic biology', 'metabolic engineering'],
    'Plant Biology': ['plant', 'crop', 'agriculture', 'photosynthesis', 'cell wall', 'starch', 'sugar', 'glucose', 'xylose', 'arabinose'],
    'Microbiology': ['fermentation', 'yeast', 'bacteria', 'microorganism', 'saccharomyces', 'escherichia', 'clostridium', 'zymomonas', 'microbial', 'cultivation'],
    'Analytics & Methods': ['analysis', 'chromatography', 'spectroscopy', 'sequencing', 'proteomics', 'metabolomics', 'transcriptomics', 'assay', 'characterization'],
    'Enzymes & Proteins': ['enzyme', 'protein', 'cellulase', 'xylanase', 'amylase', 'lipase', 'catalysis', 'biocatalyst', 'enzymatic', 'hydrolysis'],
    'Biomass & Feedstock': ['biomass', 'cellulose', 'lignin', 'hemicellulose', 'switchgrass', 'corn stover', 'wheat straw', 'wood chips', 'algae', 'microalgae', 'feedstock'],
    'Bioenergy Production': ['bioenergy', 'biofuel', 'bioethanol', 'biodiesel', 'biogas', 'methane', 'ethanol', 'butanol', 'renewable fuel', 'sustainable fuel'],
    'Process Engineering': ['pretreatment', 'distillation', 'purification', 'separation', 'reactor', 'bioprocess', 'optimization', 'scale-up', 'pilot plant']
  };
  
  const keywords = topicKeywords[filters.topic];
  if (keywords && keywords.length > 0) {
    // Create OR conditions for any of the keywords in this topic
    const keywordConditions = keywords.map(keyword => 
      where(
        db.Sequelize.cast(db.Sequelize.col('json'), 'text'),
        {
          [Op.iLike]: `%${keyword}%`
        }
      )
    );
    
    // Use OR to match any of the keywords for this topic
    const topicSearchQuery = {
      [Op.or]: keywordConditions
    };
    conditions.push(topicSearchQuery);
  } else {
    console.log('No keywords found for topic:', filters.topic);
  }
}

// Year filter - Hybrid approach: backend + client-side refinement
  if (filters.year) {
    console.log('Filtering for year:', filters.year);
    
    // Use the working broad search
    const yearSearchQuery = where(
      db.Sequelize.cast(db.Sequelize.col('json'), 'text'),
      {
        [Op.iLike]: `%${filters.year}%`
      }
    );
    conditions.push(yearSearchQuery);
    
    // we need client-side year refinement
    req.needsYearRefinement = filters.year;
  }

  // Person Name filter - Search in both creators and contributors
if (filters.personName) {
  console.log('Filtering for person name:', filters.personName);
  
  // Search for the name anywhere in creator or contributors sections
  const personSearchQuery = {
    [Op.or]: [
      // Search broadly in creator section
      where(
        db.Sequelize.cast(db.Sequelize.col('json'), 'text'),
        {
          [Op.iLike]: `%"creator"%${filters.personName}%`
        }
      ),
      // Search broadly in contributors section
      where(
        db.Sequelize.cast(db.Sequelize.col('json'), 'text'),
        {
          [Op.iLike]: `%"contributors"%${filters.personName}%`
        }
      )
    ]
  };
  conditions.push(personSearchQuery);
}

  // Use Op.and to merge conditions
  const mergedWhereConditions = conditions.length > 0 ? { [Op.and]: conditions } : {};

Dataset.scope('supportedOnly').findAll({
  order: [
      ['json.date', 'DESC'] 
    ],
  where: mergedWhereConditions,
})
  .then(data => {
    console.log(`Query returned ${data.length} results`);
    
    let finalResults = data;
    
    // Client-side year refinement
    if (req.needsYearRefinement) {
      const targetYear = req.needsYearRefinement;
      console.log('Applying client-side year refinement for:', targetYear);
      
      finalResults = data.filter(dataset => {
        const clientData = dataset.toClientJSON();
        if (clientData.date) {
          const datasetYear = clientData.date.toString().split('-')[0];
          return datasetYear === targetYear;
        }
        return false;
      });
      
      console.log(`After year refinement: ${finalResults.length} results`);
    }
    
    if (filters && filters.species && finalResults.length > 0) {
      console.log('First result species:', finalResults[0].toClientJSON().species);
    }
    if (filters && filters.species && finalResults.length === 0) {
      console.log('No results found for species filter:', filters.species);
    }
    
    res.send(finalResults.map(x => x.toClientJSON()));
  })
  .catch(err => {
    console.error('Error in findByFilters:', err);
    res.status(500).send({
      message: err.message || "Some error occurred while retrieving filtered Datasets."
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
  }catch (e) {
    console.error(e);
    res.status(500).send({
      message: `Error retrieving Dataset metrics`
    });
  }
};

// Add this to the END of your existing dataset.controller.js file

const path = require('path');
const fs = require('fs');

// Define keyword categories
const keywordCategories = {
  'Bioenergy Production': [
    'bioenergy', 'biofuel', 'bioethanol', 'biodiesel', 'biogas', 'methane',
    'ethanol', 'butanol', 'renewable fuel', 'sustainable fuel'
  ],
  'Biomass & Feedstock': [
    'biomass', 'cellulose', 'lignin', 'hemicellulose', 'switchgrass', 'corn stover',
    'wheat straw', 'wood chips', 'algae', 'microalgae', 'feedstock'
  ],
  'Microbiology': [
    'fermentation', 'yeast', 'bacteria', 'microorganism', 'saccharomyces', 
    'escherichia', 'clostridium', 'zymomonas', 'microbial', 'cultivation'
  ],
  'Genetic Engineering': [
    'genetic', 'genomic', 'gene', 'dna', 'rna', 'plasmid', 'transformation',
    'crispr', 'mutagenesis', 'recombinant', 'synthetic biology', 'metabolic engineering'
  ],
  'Enzymes & Proteins': [
    'enzyme', 'protein', 'cellulase', 'xylanase', 'amylase', 'lipase',
    'catalysis', 'biocatalyst', 'enzymatic', 'hydrolysis'
  ],
  'Plant Biology': [
    'plant', 'crop', 'agriculture', 'photosynthesis', 'cell wall', 
    'starch', 'sugar', 'glucose', 'xylose', 'arabinose'
  ],
  'Process Engineering': [
    'pretreatment', 'distillation', 'purification', 'separation', 'reactor',
    'bioprocess', 'optimization', 'scale-up', 'pilot plant'
  ],
  'Analytics & Methods': [
    'analysis', 'chromatography', 'spectroscopy', 'sequencing', 'proteomics',
    'metabolomics', 'transcriptomics', 'assay', 'characterization'
  ]
};

// Keyword analysis method
exports.analyzeKeywords = async (req, res) => {
  console.log('Starting keyword analysis via API...');
  
  try {
    // Get all datasets using the same pattern as your other methods
    const datasets = await Dataset.scope('supportedOnly').findAll();
    console.log(`Analyzing ${datasets.length} datasets...`);
    
    const keywordFrequency = {};
    const datasetCategories = {};
    
    datasets.forEach(dataset => {
      const data = dataset.toClientJSON();
      const searchableText = extractSearchableText(data);
      const categories = categorizeDataset(searchableText);
      
      if (categories.length > 0) {
        datasetCategories[data.id] = categories;
        
        // Count keyword frequencies
        categories.forEach(category => {
          keywordFrequency[category] = (keywordFrequency[category] || 0) + 1;
        });
      }
    });
    
    // Sort categories by frequency
    const sortedCategories = Object.entries(keywordFrequency)
      .sort(([,a], [,b]) => b - a)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
    
    console.log('Keyword frequency analysis:');
    console.log(sortedCategories);
    
    const results = {
      categoryFrequency: sortedCategories,
      datasetCategories: datasetCategories,
      generatedAt: new Date().toISOString(),
      totalDatasets: datasets.length,
      categorizedDatasets: Object.keys(datasetCategories).length
    };
    
    // Save results to a file (optional)
    try {
      const outputPath = path.join(__dirname, '..', 'keyword-analysis-results.json');
      fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
      console.log(`Results saved to ${outputPath}`);
    } catch (fileError) {
      console.warn('Could not save to file:', fileError.message);
    }
    
    // Return results via API
    res.json(results);
    
  } catch (error) {
    console.error('Error analyzing keywords:', error);
    res.status(500).json({
      message: error.message || "Some error occurred during keyword analysis."
    });
  }
};

// Helper functions
function extractSearchableText(dataset) {
  const textFields = [];
  
  if (dataset.title) textFields.push(dataset.title.toLowerCase());
  if (dataset.description) textFields.push(dataset.description.toLowerCase());
  if (dataset.keywords && dataset.keywords.length > 0) {
    textFields.push(dataset.keywords.join(' ').toLowerCase());
  }
  
  if (dataset.plasmid_features) {
    dataset.plasmid_features.forEach(feature => {
      if (feature.description) textFields.push(feature.description.toLowerCase());
      if (feature.promoters) textFields.push(feature.promoters.join(' ').toLowerCase());
    });
  }
  
  if (dataset.species) {
    dataset.species.forEach(species => {
      if (typeof species === 'string') {
        textFields.push(species.toLowerCase());
      } else if (species.scientificName) {
        textFields.push(species.scientificName.toLowerCase());
      }
    });
  }
  
  return textFields.join(' ');
}

function categorizeDataset(searchableText) {
  const categories = [];
  
  Object.entries(keywordCategories).forEach(([category, keywords]) => {
    const hasKeyword = keywords.some(keyword => 
      searchableText.includes(keyword.toLowerCase())
    );
    
    if (hasKeyword) {
      categories.push(category);
    }
  });
  
  return categories;
}
