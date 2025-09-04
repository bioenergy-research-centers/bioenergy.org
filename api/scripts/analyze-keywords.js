// scripts/analyze-keywords.js
const path = require('path');

// The models are in app/models, not just models
const db = require(path.join(__dirname, '..', 'app', 'models'));
const Dataset = db.datasets;

// Define your keyword categories
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

async function analyzeKeywords() {
  console.log('Starting keyword analysis...');
  
  try {
    // Get all datasets
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
    
    // Save results to a JSON file
    const fs = require('fs');
    const results = {
      categoryFrequency: sortedCategories,
      datasetCategories: datasetCategories,
      generatedAt: new Date().toISOString(),
      totalDatasets: datasets.length,
      categorizedDatasets: Object.keys(datasetCategories).length
    };
    
    // Save to the api directory so it's accessible
    const outputPath = path.join(__dirname, '..', 'keyword-analysis-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`Results saved to ${outputPath}`);
    
    return results;
    
  } catch (error) {
    console.error('Error analyzing keywords:', error);
  }
}

function extractSearchableText(dataset) {
  const textFields = [];
  
  // Extract text from various fields
  if (dataset.title) textFields.push(dataset.title.toLowerCase());
  if (dataset.description) textFields.push(dataset.description.toLowerCase());
  if (dataset.keywords && dataset.keywords.length > 0) {
    textFields.push(dataset.keywords.join(' ').toLowerCase());
  }
  
  // Extract from plasmid features
  if (dataset.plasmid_features) {
    dataset.plasmid_features.forEach(feature => {
      if (feature.description) textFields.push(feature.description.toLowerCase());
      if (feature.promoters) textFields.push(feature.promoters.join(' ').toLowerCase());
    });
  }
  
  // Extract from species
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

// Run the analysis
if (require.main === module) {
  analyzeKeywords().then(() => {
    console.log('Analysis complete!');
    process.exit(0);
  });
}

module.exports = { analyzeKeywords, keywordCategories };
