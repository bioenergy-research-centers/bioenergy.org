<script setup lang="ts">
import DatasetDataService from "../services/DatasetDataService";
import {ref, watch, onMounted, nextTick} from "vue";
import { resolveComponentVersion } from './datasets/versionComponentMap';
import { useRouter } from 'vue-router';

// Add D3 imports
import { select, scaleLinear, scaleBand, axisBottom, axisLeft, pie, arc, schemeCategory10 } from 'd3';

const router = useRouter();

const results = ref([]);
const loading = ref(true);
const error = ref(null);
const selectedResult = ref(null);

// Add refs for D3 containers and chart state
const chartContainer = ref<HTMLElement>();
const showChart = ref(false);
const activeTab = ref('count'); // 'count', 'sources', 'topics', 'resources'

const activeFilters = ref({
  brc: null,        // For sources chart
  repository: null, // For resources chart
  species: null,    // For species chart
  analysisType: null, // For analysis type chart
});

const props = defineProps({
  filter: String,
  dnaSequence: String,
});

// New emit for search updates
const emit = defineEmits(['clear-dna-sequence', 'update-search']);

// Add a reactive trigger for visualization updates
const visualizationTrigger = ref(0);

// Updated handleSearch to ensure proper chart updates after filtering
const handleSearch = async () => {
  // If both filter and dnaSequence are empty, fetch all data
  if (!props.filter && !props.dnaSequence) {
    await fetchAllData();
    return;
  }

  loading.value = true;
  error.value = null;
  results.value = [];
  selectedResult.value = null;

  try {
    const response = await DatasetDataService.runAdvancedSearch(
        props.filter,
        props.dnaSequence
    );
    
    // Apply client-side filtering based on active filters
    let filteredResults = response.data;
    
    if (activeFilters.value.brc) {
      filteredResults = filteredResults.filter(result => result.brc === activeFilters.value.brc);
    }
    
    if (activeFilters.value.repository) {
      filteredResults = filteredResults.filter(result => result.repository === activeFilters.value.repository);
    }
    
    if (activeFilters.value.species) {
      filteredResults = filteredResults.filter(result => {
        if (activeFilters.value.species === 'Not Specified') {
          return !result.species || result.species.length === 0;
        }
        // Check if any species in the array matches the filter
        return result.species && result.species.some(species => {
          if (typeof species === 'string') {
            return species.trim() === activeFilters.value.species;
          } else if (typeof species === 'object' && species !== null) {
            // Handle object species data
            const speciesName = species.name || species.scientificName || species.commonName || species.organism || species.species;
            return speciesName === activeFilters.value.species;
          }
          return false;
        });
      });
    }
    
    if (activeFilters.value.analysisType) {
      filteredResults = filteredResults.filter(result => {
        if (activeFilters.value.analysisType === 'Not Specified') {
          return !result.analysisType || result.analysisType === 'not specified';
        }
        return result.analysisType === activeFilters.value.analysisType;
      });
    }
    
    results.value = filteredResults;
    selectedResult.value = results.value.length > 0 ? results.value[0] : null;
    
    console.log('Filtered results count:', results.value.length); // Debug log
    
  } catch (err) {
    results.value = [];
    console.error('error', err);
    error.value = 'Failed to fetch search results.';
  } finally {
    loading.value = false;
    
    // Force visualization update after filtering is complete
    await nextTick();
    if (showChart.value) {
      console.log('Creating visualization after filtering');
      createVisualization();
    }
  }
};

const fetchAllData = async () => {
  console.log('fetchAllData called');
  loading.value = true;
  error.value = null;

  try {
    const response = await DatasetDataService.getAll();
    
    // Apply client-side filtering based on active filters
    let filteredResults = response.data;
    
    if (activeFilters.value.brc) {
      filteredResults = filteredResults.filter(result => result.brc === activeFilters.value.brc);
    }
    
    if (activeFilters.value.repository) {
      filteredResults = filteredResults.filter(result => result.repository === activeFilters.value.repository);
    }
    
    if (activeFilters.value.species) {
      filteredResults = filteredResults.filter(result => {
        if (activeFilters.value.species === 'Not Specified') {
          return !result.species || result.species.length === 0;
        }
        // Check if any species in the array matches the filter
        return result.species && result.species.some(species => {
          if (typeof species === 'string') {
            return species.trim() === activeFilters.value.species;
          } else if (typeof species === 'object' && species !== null) {
            // Handle object species data
            const speciesName = species.name || species.scientificName || species.commonName || species.organism || species.species;
            return speciesName === activeFilters.value.species;
          }
          return false;
        });
      });
    }
    
    if (activeFilters.value.analysisType) {
      filteredResults = filteredResults.filter(result => {
        if (activeFilters.value.analysisType === 'Not Specified') {
          return !result.analysisType || result.analysisType === 'not specified';
        }
        return result.analysisType === activeFilters.value.analysisType;
      });
    }
    
    results.value = filteredResults;
    selectedResult.value = results.value.length > 0 ? results.value[0] : null;
    
    console.log('fetchAllData - filtered results count:', results.value.length); // Debug log
    
  } catch (e) {
    error.value = 'There was an error while fetching search results.';
    console.error(e);
    results.value = [];
  } finally {
    loading.value = false;
    
    // Force visualization update after filtering is complete
    await nextTick();
    if (showChart.value) {
      console.log('fetchAllData - creating visualization after filtering');
      createVisualization();
    }
  }
};


const forceVisualizationUpdate = async () => {
  if (showChart.value && results.value.length > 0) {
    await nextTick();
    createVisualization();
  }
};

// Main visualization function that routes to specific chart types
const createVisualization = () => {
  if (!chartContainer.value || !results.value.length) return;

  // Clear any existing chart
  select(chartContainer.value).selectAll("*").remove();

  console.log('Creating visualization for tab:', activeTab.value);
  console.log('Sample data:', results.value[0]); // Debug: see data structure

  switch (activeTab.value) {
    case 'count':
      createCountVisualization();
      break;
    case 'sources':
      createSourcesVisualization();
      break;
    case 'topics':
      createTopicsVisualization();
      break;
    case 'resources':
      createResourcesVisualization();
      break;
    case 'species':
      createSpeciesVisualization();
      break;
    case 'analysis':
      createAnalysisVisualization();
      break;
    default:
      createCountVisualization();
  }
};

// 1. Dataset Count Visualization (by year)
const createCountVisualization = () => {
  const parseDate = (dateStr) => {
    try {
      if (!dateStr) return 'Unknown';
      const str = dateStr.toString();
      if (str.includes('-')) {
        return str.split('-')[0];
      } else if (str.length === 4) {
        return str;
      } else {
        return new Date(dateStr).getFullYear().toString();
      }
    } catch (e) {
      return 'Unknown';
    }
  };

  const dataByYear = {};
  results.value.forEach(result => {
    const year = parseDate(result.date);
    dataByYear[year] = (dataByYear[year] || 0) + 1;
  });

  const chartData = Object.entries(dataByYear)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year.localeCompare(b.year));

  createBarChart(chartData, 'year', 'count', 'Dataset Count by Year', 'Year', 'Number of Datasets');
};

// 2. Sources Visualization - Based on BRC field
const createSourcesVisualization = () => {
  const brcCount = {};
  
  results.value.forEach(result => {
    let brc = 'Unknown';
    
    if (result.brc) {
      brc = result.brc;
    }
    
    brcCount[brc] = (brcCount[brc] || 0) + 1;
  });

  console.log('BRC distribution:', brcCount);

  const chartData = Object.entries(brcCount)
    .map(([brc, count]) => ({ label: brc, value: count }))
    .sort((a, b) => b.value - a.value);

  // Enable clickable labels for Sources chart with chart type
  createPieChart(chartData, 'Dataset Distribution by BRC (Bioenergy Research Center)', true, 'sources');
};


// 3. Topics Visualization
const createTopicsVisualization = () => {
  const topicCount = {};
  
  results.value.forEach(result => {
    let topics = [];
    
    // 1. Try to extract from keywords field (if it exists and has content)
    if (result.keywords && result.keywords.length > 0) {
      topics = Array.isArray(result.keywords) ? result.keywords : result.keywords.split(',');
    }
    
    // 2. Extract from plasmid features
    else if (result.plasmid_features && result.plasmid_features.length > 0) {
      const featureTopics = new Set();
      
      result.plasmid_features.forEach(feature => {
        // Extract from promoters
        if (feature.promoters && feature.promoters.length > 0) {
          feature.promoters.forEach(promoter => {
            featureTopics.add(`Promoter: ${promoter}`);
          });
        }
        
        // Extract from selection markers
        if (feature.selection_markers && feature.selection_markers.length > 0) {
          feature.selection_markers.forEach(marker => {
            featureTopics.add(`Selection: ${marker}`);
          });
        }
        
        // Extract from origins of replication
        if (feature.ori) {
          featureTopics.add(`Origin: ${feature.ori}`);
        }
        
        // Extract from backbone types
        if (feature.backbone) {
          // Extract meaningful parts from backbone names
          const backboneName = feature.backbone.toLowerCase();
          if (backboneName.includes('gfp')) featureTopics.add('GFP Reporter');
          if (backboneName.includes('rfp')) featureTopics.add('RFP Reporter');
          if (backboneName.includes('biobrick') || backboneName.includes('pbb')) featureTopics.add('BioBrick');
          if (backboneName.includes('pet')) featureTopics.add('Expression Vector');
        }
      });
      
      topics = Array.from(featureTopics);
    }
    
    // 3. Extract from species (if available)
    else if (result.species && result.species.length > 0) {
      topics = result.species.map(species => `Species: ${species}`);
    }
    
    // 4. Extract from title analysis (as fallback)
    else if (result.title) {
      const biologicalTerms = [
        'plasmid', 'vector', 'expression', 'promoter', 'gene', 'protein',
        'enzyme', 'fermentation', 'biofuel', 'bioenergy', 'biomass',
        'cellulose', 'lignin', 'metabolic', 'genomic', 'synthetic biology',
        'engineering', 'production', 'pathway', 'biosynthesis',
        'cloning', 'transformation', 'assembly', 'construction'
      ];
      
      const titleLower = result.title.toLowerCase();
      topics = biologicalTerms.filter(term => 
        titleLower.includes(term.toLowerCase())
      );
      
      // Also extract year-based topics from titles
      const yearMatch = result.title.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        topics.push(`Study Year: ${yearMatch[0]}`);
      }
    }
    
    // 5. Extract from analysis type
    if (result.analysisType && result.analysisType !== 'not specified') {
      topics.push(`Analysis: ${result.analysisType}`);
    }
    
    // 6. Extract from dataset type
    if (result.datasetType) {
      const typeMap = {
        'GD': 'Genetic Data',
        'MD': 'Metabolic Data',
        'PD': 'Protein Data',
        'CD': 'Chemical Data'
      };
      topics.push(`Type: ${typeMap[result.datasetType] || result.datasetType}`);
    }
    
    // 7. Default fallback
    if (topics.length === 0) {
      topics = ['General'];
    }
    
    // Count each topic
    topics.forEach(topic => {
      const cleanTopic = topic.toString().trim();
      if (cleanTopic) {
        topicCount[cleanTopic] = (topicCount[cleanTopic] || 0) + 1;
      }
    });
  });

  console.log('Topic distribution:', topicCount); // Debug log

  const chartData = Object.entries(topicCount)
    .map(([topic, count]) => ({ label: topic, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15); // Show top 15 topics 

  createBarChart(
    chartData.map(d => ({ category: d.label, count: d.value })), 
    'category', 
    'count', 
    'Research Topics Distribution', 
    'Topics', 
    'Number of Datasets'
  );
};

// 4. Resources Visualization - Based on Repository field
const createResourcesVisualization = () => {
  const repositoryCount = {};
  
  results.value.forEach(result => {
    let repository = 'Unknown';
    
    if (result.repository) {
      repository = result.repository;
    }
    
    repositoryCount[repository] = (repositoryCount[repository] || 0) + 1;
  });

  console.log('Repository distribution:', repositoryCount);

  const chartData = Object.entries(repositoryCount)
    .map(([repository, count]) => ({ label: repository, value: count }))
    .sort((a, b) => b.value - a.value);

  // Enable clickable labels for Resources chart with chart type
  createPieChart(chartData, 'Dataset Distribution by Repository', true, 'resources');
};

const createSpeciesVisualization = () => {
  const speciesCount = {};
  
  results.value.forEach(result => {
    if (result.species && result.species.length > 0) {
      result.species.forEach(species => {
        let speciesName = 'Unknown';
        
        // Handle different data structures for species
        if (typeof species === 'string') {
          speciesName = species.trim();
        } else if (typeof species === 'object' && species !== null) {
          if (species.name) {
            speciesName = species.name;
          } else if (species.scientificName) {
            speciesName = species.scientificName;
          } else if (species.commonName) {
            speciesName = species.commonName;
          } else if (species.organism) {
            speciesName = species.organism;
          } else if (species.species) {
            speciesName = species.species;
          } else {
            const keys = Object.keys(species);
            if (keys.length > 0) {
              speciesName = `${keys[0]}: ${species[keys[0]]}`;
            } else {
              speciesName = 'Unknown Species Object';
            }
          }
        }
        
        if (speciesName && speciesName !== 'Unknown') {
          speciesCount[speciesName] = (speciesCount[speciesName] || 0) + 1;
        } else {
          speciesCount['Unknown'] = (speciesCount['Unknown'] || 0) + 1;
        }
      });
    } else {
      speciesCount['Not Specified'] = (speciesCount['Not Specified'] || 0) + 1;
    }
  });

  console.log('Species distribution:', speciesCount);

  const chartData = Object.entries(speciesCount)
    .map(([species, count]) => ({ label: species, value: count }))
    .sort((a, b) => b.value - a.value);

  // Enable clickable labels for Species chart with chart type
  createPieChart(chartData, 'Dataset Distribution by Species', true, 'species');
};


// 6. Analysis Type Visualization - New chart
const createAnalysisVisualization = () => {
  const analysisCount = {};
  
  results.value.forEach(result => {
    let analysisType = 'Not Specified';
    
    if (result.analysisType && result.analysisType !== 'not specified') {
      analysisType = result.analysisType;
    }
    
    analysisCount[analysisType] = (analysisCount[analysisType] || 0) + 1;
  });

  console.log('Analysis type distribution:', analysisCount);

  const chartData = Object.entries(analysisCount)
    .map(([analysis, count]) => ({ label: analysis, value: count }))
    .sort((a, b) => b.value - a.value);

  // Enable clickable labels for Analysis chart with chart type
  createPieChart(chartData, 'Dataset Distribution by Analysis Type', true, 'analysis');
};

// Helper function to create bar charts
const createBarChart = (data, xKey, yKey, title, xLabel, yLabel) => {
  const margin = { top: 40, right: 30, bottom: 60, left: 60 };
  const width = 700 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = select(chartContainer.value)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const xScale = scaleBand()
    .domain(data.map(d => d[xKey]))
    .range([0, width])
    .padding(0.1);

  const yScale = scaleLinear()
    .domain([0, Math.max(...data.map(d => d[yKey]))])
    .range([height, 0]);

  // Create axes
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(axisBottom(xScale))
    .selectAll('text')
    .style('text-anchor', 'end')
    .attr('dx', '-.8em')
    .attr('dy', '.15em')
    .attr('transform', 'rotate(-45)');

  g.append('g')
    .call(axisLeft(yScale));

  // Create bars
  g.selectAll('.bar')
    .data(data)
    .enter().append('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d[xKey]))
    .attr('width', xScale.bandwidth())
    .attr('y', d => yScale(d[yKey]))
    .attr('height', d => height - yScale(d[yKey]))
    .attr('fill', '#72a530')
    .attr('opacity', 0.8);

  // Add value labels on bars
  g.selectAll('.label')
    .data(data)
    .enter().append('text')
    .attr('class', 'label')
    .attr('x', d => xScale(d[xKey]) + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d[yKey]) - 5)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .text(d => d[yKey]);

  // Add title
  svg.append('text')
    .attr('x', (width + margin.left + margin.right) / 2)
    .attr('y', margin.top / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .text(title);

  // Add axis labels
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 15)
    .attr('x', 0 - (height / 2) - margin.top)
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text(yLabel);

  svg.append('text')
    .attr('x', (width + margin.left + margin.right) / 2)
    .attr('y', height + margin.top + margin.bottom - 10)
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text(xLabel);
};

// Helper function to create pie charts
// Updated Helper function to create pie charts with clickable legends
// Updated createPieChart to handle chart types
const createPieChart = (data, title, enableClickableLabels = false, chartType = null) => {
  const width = 700;
  const height = 400;
  const radius = Math.min(width, height) / 2 - 40;

  const svg = select(chartContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const g = svg.append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`);

  const color = schemeCategory10;

  const pieGenerator = pie()
    .value(d => d.value)
    .sort(null);

  const arcGenerator = arc()
    .innerRadius(0)
    .outerRadius(radius);

  const arcs = g.selectAll('.arc')
    .data(pieGenerator(data))
    .enter().append('g')
    .attr('class', 'arc');

  arcs.append('path')
    .attr('d', arcGenerator)
    .attr('fill', (d, i) => color[i % color.length])
    .attr('opacity', 0.8);

  arcs.append('text')
    .attr('transform', d => `translate(${arcGenerator.centroid(d)})`)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .text(d => d.data.value);

  // Add legend with optional clickable functionality
  const legend = svg.append('g')
    .attr('transform', `translate(20, 20)`);

  const legendItems = legend.selectAll('.legend-item')
    .data(data)
    .enter().append('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => `translate(0, ${i * 20})`)
    .style('cursor', enableClickableLabels ? 'pointer' : 'default');

  legendItems.append('rect')
    .attr('width', 15)
    .attr('height', 15)
    .attr('fill', (d, i) => color[i % color.length]);

  const legendText = legendItems.append('text')
    .attr('x', 20)
    .attr('y', 12)
    .style('font-size', '12px')
    .text(d => `${d.label} (${d.value})`);

  // Add click functionality if enabled
  if (enableClickableLabels && chartType) {
    legendItems
      .on('mouseover', function() {
        select(this).select('text')
          .style('font-weight', 'bold')
          .style('text-decoration', 'underline');
      })
      .on('mouseout', function() {
        select(this).select('text')
          .style('font-weight', 'normal')
          .style('text-decoration', 'none');
      })
      .on('click', function(event, d) {
        handleLegendClick(d.label, chartType);
      });

    // Add visual indicator that items are clickable
    legendText.style('color', '#0066cc');
  }

  // Add title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .text(title);
};

// Function to handle legend clicks
// const handleLegendClick = (legendValue) => {
//     console.log('Legend clicked:', legendValue);
    
//     // Get current search filter
//     const currentFilter = props.filter || '';
    
//     // Create new search term by appending the legend value
//     const newFilter = currentFilter.trim() 
//       ? `${currentFilter.trim()} ${legendValue}` 
//       : legendValue;
    
//     console.log('New search filter:', newFilter);
    
//     // Update the URL with the new search term
//     // This will trigger the HeaderView to update and your component to re-fetch data
//     router.push({
//       path: '/data',
//       query: {
//         q: newFilter,
//       },
//     });
//   };

// Updated legend click handler for filtering
const handleLegendClick = (legendValue, chartType) => {
  console.log('Legend clicked:', legendValue, 'for chart:', chartType);
  
  // Update the appropriate filter
  if (chartType === 'sources') {
    activeFilters.value.brc = legendValue;
    console.log('Set BRC filter to:', legendValue);
  } else if (chartType === 'resources') {
    activeFilters.value.repository = legendValue;
    console.log('Set Repository filter to:', legendValue);
  } else if (chartType === 'species') {
    activeFilters.value.species = legendValue;
    console.log('Set Species filter to:', legendValue);
  } else if (chartType === 'analysis') {
    activeFilters.value.analysisType = legendValue;
    console.log('Set Analysis Type filter to:', legendValue);
  }
  
  console.log('Current active filters:', activeFilters.value);
  
  // Trigger data refresh with new filters
  if (!props.filter && !props.dnaSequence) {
    fetchAllData();
  } else {
    handleSearch();
  }
};



// Function to remove a specific filter
const removeFilter = (filterType) => {
  console.log('Removing filter:', filterType);
  
  if (filterType === 'brc') {
    activeFilters.value.brc = null;
  } else if (filterType === 'repository') {
    activeFilters.value.repository = null;
  } else if (filterType === 'species') {
    activeFilters.value.species = null;
  } else if (filterType === 'analysisType') {
    activeFilters.value.analysisType = null;
  }
  
  console.log('Active filters after removal:', activeFilters.value);
  
  // Trigger data refresh without the removed filter
  if (!props.filter && !props.dnaSequence) {
    fetchAllData();
  } else {
    handleSearch();
  }
};

// New function to handle internal search updates
const handleInternalSearchUpdate = async (newFilter) => {
  console.log('Updating internal search to:', newFilter);
  
  loading.value = true;
  error.value = null;
  results.value = [];
  selectedResult.value = null;

  try {
    const response = await DatasetDataService.runAdvancedSearch(
        newFilter,
        props.dnaSequence // Keep the existing DNA sequence if any
    );
    results.value = response.data;
    selectedResult.value = results.value.length > 0 ? results.value[0] : null;
    
    // Trigger visualization update
    visualizationTrigger.value++;
    
    await nextTick();
    if (showChart.value) {
      createVisualization();
    }
    
    // Also emit to parent component so it can update its search state if needed
    emit('update-search', newFilter);
    
  } catch (err) {
    results.value = [];
    console.error('error', err);
    error.value = 'Failed to fetch search results.';
  } finally {
    loading.value = false;
  }
};

// Watch for changes in props to trigger search
watch(
    () => [props.filter, props.dnaSequence],
    ([newFilter, newDnaSequence]) => {
      handleSearch();
    },
    { immediate: true }
);

// Watch for tab changes to update visualization
watch(activeTab, () => {
  if (showChart.value) {
    nextTick(() => {
      createVisualization();
    });
  }
});

watch(activeFilters, () => {
  console.log('Active filters changed:', activeFilters.value);
  if (showChart.value) {
    nextTick(() => {
      console.log('Updating visualization due to filter change');
      createVisualization();
    });
  }
}, { deep: true });

watch(visualizationTrigger, () => {
  if (showChart.value && results.value.length > 0) {
    nextTick(() => {
      createVisualization();
    });
  }
});

const onSelectResult = (result: any) => {
  selectedResult.value = result;
}

const toggleChart = () => {
  showChart.value = !showChart.value;
  if (showChart.value) {
    nextTick(() => {
      createVisualization();
    });
  }
};

const setActiveTab = (tab: string) => {
  activeTab.value = tab;
};
</script>

<template>
  <div class="page-container">
    <!-- Loading Indicator -->
    <div v-if="loading" class="loading-indicator">
      Running search...
    </div>

    <!-- No Results Found -->
    <div v-else-if="results && results.length === 0" class="no-results-container">
      <div class="no-results-message">
        <h2>Uh oh!</h2>
        <p>Your search did not match any records. Please refine your query and try again.</p>
      </div>
    </div>

    <!-- Results Found -->
    <div v-else class="results-container">
      <!-- Left Column: Search Results -->
      <div class="left-column">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="fw-bold text-center small">{{ results.length }} results found</div>
          <button 
            @click="toggleChart" 
            class="btn btn-sm btn-outline-primary"
          >
            {{ showChart ? 'Hide Analytics' : 'Show Analytics' }}
          </button>
        </div>

        <div class="list-group">
          <div
              class="list-group-item d-flex justify-content-between list-group-item-action cursor-pointer"
              v-for="result in results"
              :key="result.identifier"
              :class="{ active: selectedResult.identifier === result.identifier }"
              @click="onSelectResult(result)"
          >
            <div class="ms-2 me-auto">
              <div class="mb-2 fw-bold">{{ result.identifier }}</div>
              <div class="small">{{ result.title }}</div>
            </div>
            <small style="font-size: 0.75em">{{ result.date }}</small>
          </div>
        </div>
      </div>

      <!-- Right Column: Selected Result Details OR Chart -->
      <div class="right-column">
        <!-- Chart View -->
        <div v-if="showChart" class="chart-view">
          <div class="chart-header">
            <h4>Dataset Analytics</h4>
            <div class="chart-tabs">
              <button 
                v-for="tab in [
                  { key: 'count', label: 'Dataset Count' },
                  { key: 'sources', label: 'Sources' },
                  { key: 'topics', label: 'Topics' },
                  { key: 'resources', label: 'Resources' },
                  { key: 'species', label: 'Species' },
                  { key: 'analysis', label: 'Analysis Type' }
                ]"
                :key="tab.key"
                @click="setActiveTab(tab.key)"
                :class="['tab-button', { active: activeTab === tab.key }]"
              >
                {{ tab.label }}
              </button>
            </div>
            
            <!-- Filter Tags -->
              <div v-if="activeFilters.brc || activeFilters.repository || activeFilters.species || activeFilters.analysisType" class="filter-tags">
                <span class="filter-label">Active Filters:</span>
                <span 
                  v-if="activeFilters.brc" 
                  class="filter-tag"
                  @click="removeFilter('brc')"
                  title="Click to remove filter"
                >
                  BRC: {{ activeFilters.brc }}
                  <i class="bi bi-x"></i>
                </span>
                <span 
                  v-if="activeFilters.repository" 
                  class="filter-tag"
                  @click="removeFilter('repository')"
                  title="Click to remove filter"
                >
                  Repository: {{ activeFilters.repository }}
                  <i class="bi bi-x"></i>
                </span>
                <span 
                  v-if="activeFilters.species" 
                  class="filter-tag"
                  @click="removeFilter('species')"
                  title="Click to remove filter"
                >
                  Species: {{ activeFilters.species }}
                  <i class="bi bi-x"></i>
                </span>
                <span 
                  v-if="activeFilters.analysisType" 
                  class="filter-tag"
                  @click="removeFilter('analysisType')"
                  title="Click to remove filter"
                >
                  Analysis: {{ activeFilters.analysisType }}
                  <i class="bi bi-x"></i>
                </span>
              </div>
          </div>
          <div class="chart-container">
            <div ref="chartContainer" class="d3-chart"></div>
          </div>
        </div>

        <!-- Detail View -->
        <div v-else-if="selectedResult && !loading" class="detail-view">
          <component :is="resolveComponentVersion(selectedResult)" :selectedResult></component>
        </div>

        <!-- Default message when no result selected and no chart -->
        <div v-else class="no-selection-message">
          <p>Select a dataset from the left to view details, or click "Show Analytics" to view data visualizations.</p>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.page-container {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  position: relative;
}

/* Chart-specific styles */
.chart-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  padding: 20px 20px 0 20px;
  border-bottom: 1px solid #dee2e6;
  margin-bottom: 20px;
}

.chart-header h4 {
  margin-bottom: 15px;
  color: #333;
}

.chart-tabs {
  display: flex;
  gap: 5px;
  margin-bottom: 15px;
}

.tab-button {
  padding: 8px 16px;
  border: 1px solid #dee2e6;
  background: white;
  color: #666;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.tab-button:hover {
  background: #f8f9fa;
  color: #333;
}

.tab-button.active {
  background: #72a530;
  color: white;
  border-color: #72a530;
}

.chart-container {
  flex: 1;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 20px;
  margin: 0 20px 20px 20px;
  overflow: auto;
}

.d3-chart {
  width: 100%;
  text-align: center;
}

.detail-view {
  height: 100%;
  overflow-y: auto;
  padding: 20px; /* This is the fix - adds padding back to detail view */
}

.no-selection-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 20px; /* Also add padding here for consistency */
}

/* Loading Indicator Styles */
.loading-indicator {
  margin: auto;
  text-align: center;
  font-size: 1.5em;
  font-weight: bold;
}

/* No Results Container Styles */
.no-results-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  text-align: center;
  padding: 20px;
}

.no-results-message h2 {
  font-size: 2em;
  margin-bottom: 0.5em;
}

.no-results-message p {
  font-size: 1.2em;
  color: #555;
}

/* Results Container Styles */
.results-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Left Column Styles */
.left-column {
  min-width: 300px;
  width: 400px;
  overflow-y: auto;
  padding: 20px;
  border-right: 1px solid #ddd;
}

/* Right Column Styles */
.right-column {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Utility Classes */
.fs-7 {
  font-size: 0.7em;
}

.cursor-pointer {
  cursor: pointer;
}

/* Scrollbar Styling */
.left-column::-webkit-scrollbar,
.detail-view::-webkit-scrollbar,
.chart-container::-webkit-scrollbar {
  width: 8px;
}

.left-column::-webkit-scrollbar-thumb,
.detail-view::-webkit-scrollbar-thumb,
.chart-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .page-container {
    flex-direction: column;
  }

  .left-column {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #ddd;
  }

  .right-column {
    width: 100%;
  }

  .chart-tabs {
    flex-wrap: wrap;
  }

  .tab-button {
    font-size: 12px;
    padding: 6px 12px;
  }
}

/* Add these new styles to your existing CSS */

.filter-tags {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  background-color: #72a530;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  gap: 4px;
}

.filter-tag:hover {
  background-color: #5d8a26;
  transform: translateY(-1px);
}

.filter-tag i {
  font-size: 10px;
  opacity: 0.8;
}

.filter-tag i:hover {
  opacity: 1;
}

</style>
