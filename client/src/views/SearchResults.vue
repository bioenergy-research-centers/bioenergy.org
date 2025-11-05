<script setup lang="ts">
import DatasetDataService from "../services/DatasetDataService";
import {ref, watch, watchPostEffect, onMounted, nextTick} from "vue";
import { resolveComponentVersion } from './datasets/versionComponentMap';
import AuthorList from '@/components/AuthorList.vue';
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router';
import Search from '@/components/Search.vue';
import {useSearchStore} from '@/store/searchStore';
import { storeToRefs } from 'pinia'
// Add D3 imports
import { select, scaleLinear, scaleBand, axisBottom, axisLeft, pie, arc, schemeCategory10 } from 'd3';
import sanitizeHtml from 'sanitize-html';

const router = useRouter();
const route = useRoute()
const searchStore = useSearchStore();

const ALLOWED_HTML = { allowedTags: [ 'b', 'i', 'sub', 'sup'], allowedAttributes: {} };

// Creating a reactive value from the store requires destructuring with storeToRefs
// https://pinia.vuejs.org/core-concepts/#Destructuring-from-a-Store
const{searchResults, searchResultsLoading, searchResultsError} = storeToRefs(searchStore);
const results = searchResults;
const loading = searchResultsLoading;
const error = searchResultsError;
// Add refs for D3 containers and chart state
const chartContainer = ref<HTMLElement>();
const showChart = ref(true);
const activeTab = ref('resources'); // 'count', 'sources', 'topics', 'resources'


// Apply query params after any route change
// Use deep watcher for query param changes
watch(
  ()=>route.query,
  (newQuery, _oldQuery)=>{
    // this runs every time the URL query params are updated, including updates from the store
    searchStore.runSearchFromURL(newQuery);
  },
  { immediate: true, deep: true }
)

// When the search results change, redraw all charts
// Use post-flush to ensure DOM has been updated
// https://vuejs.org/guide/essentials/watchers#post-watchers
watchPostEffect(() => {
  console.log("SearchResults View - SearchStore.searchResults updated")
    console.log('Creating visualization after filtering');
    if (showChart.value) {
      createVisualization();
    }
})
// Watch for tab changes to update visualization
// Use post-flush to ensure DOM has been updated
// https://vuejs.org/guide/essentials/watchers#post-watchers
watchPostEffect(() => {
  if (showChart.value) {
      createVisualization();
  }
});

// Updated legend click handler that properly updates URL
const handleLegendClick = async (legendValue, chartType) => {
  console.log('=== LEGEND CLICK DEBUG ===');
  console.log('Legend clicked:', legendValue, 'for chart:', chartType);
  console.log('Current route query:', route.query);

  // Update the appropriate filter
  if (chartType === 'sources') {
    searchStore.brc = legendValue;
    console.log('Set BRC filter to:', legendValue);
  } else if (chartType === 'resources') {
    searchStore.repository = legendValue;
    console.log('Set Repository filter to:', legendValue);
  } else if (chartType === 'species') {
    searchStore.species = legendValue;
    console.log('Set Species filter to:', legendValue);
  } else if (chartType === 'analysis') {
    searchStore.analysisType = legendValue;
    console.log('Set Analysis Type filter to:', legendValue);
  }
  searchStore.runSearch();
  console.log('=== END LEGEND CLICK DEBUG ===');
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
    // case 'sources':
    //   createSourcesVisualization();
    //   break;
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

  // Enable clickable bars for count chart
  createBarChart(chartData, 'year', 'count', 'Dataset Count by Year', 'Year', 'Number of Datasets', true, 'count');
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

// Updated topics visualization that works with filtered results
const createTopicsVisualization = () => {
  // Define the same categories from your analysis
  const keywordCategories = {
    'Genetic Engineering': [
      'genetic', 'genomic', 'gene', 'dna', 'rna', 'plasmid', 'transformation',
      'crispr', 'mutagenesis', 'recombinant', 'synthetic biology', 'metabolic engineering'
    ],
    'Plant Biology': [
      'plant', 'crop', 'agriculture', 'photosynthesis', 'cell wall', 
      'starch', 'sugar', 'glucose', 'xylose', 'arabinose'
    ],
    'Microbiology': [
      'fermentation', 'yeast', 'bacteria', 'microorganism', 'saccharomyces', 
      'escherichia', 'clostridium', 'zymomonas', 'microbial', 'cultivation'
    ],
    'Analytics & Methods': [
      'analysis', 'chromatography', 'spectroscopy', 'sequencing', 'proteomics',
      'metabolomics', 'transcriptomics', 'assay', 'characterization'
    ],
    'Enzymes & Proteins': [
      'enzyme', 'protein', 'cellulase', 'xylanase', 'amylase', 'lipase',
      'catalysis', 'biocatalyst', 'enzymatic', 'hydrolysis'
    ],
    'Biomass & Feedstock': [
      'biomass', 'cellulose', 'lignin', 'hemicellulose', 'switchgrass', 'corn stover',
      'wheat straw', 'wood chips', 'algae', 'microalgae', 'feedstock'
    ],
    'Bioenergy Production': [
      'bioenergy', 'biofuel', 'bioethanol', 'biodiesel', 'biogas', 'methane',
      'ethanol', 'butanol', 'renewable fuel', 'sustainable fuel'
    ],
    'Process Engineering': [
      'pretreatment', 'distillation', 'purification', 'separation', 'reactor',
      'bioprocess', 'optimization', 'scale-up', 'pilot plant'
    ]
  };

  const topicCount = {};
  
  // Analyze the CURRENT filtered results, not all data
  results.value.forEach(result => {
    const searchableText = extractSearchableText(result);
    const categories = categorizeDataset(searchableText, keywordCategories);
    
    categories.forEach(category => {
      topicCount[category] = (topicCount[category] || 0) + 1;
    });
  });

  console.log('Topic distribution for current results:', topicCount);

  // Only show categories that have results in the current data
  const chartData = Object.entries(topicCount)
    .map(([topic, count]) => ({ label: topic, value: count }))
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    // Show message if no topics found
    const svg = select(chartContainer.value)
      .append('svg')
      .attr('width', 700)
      .attr('height', 400);

    svg.append('text')
      .attr('x', 350)
      .attr('y', 200)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('fill', '#666')
      .text('No topic categories found in current results');
    
    return;
  }

  createBarChart(
    chartData.map(d => ({ category: d.label, count: d.value })), 
    'category', 
    'count', 
    'Research Topics Distribution', 
    'Topics', 
    'Number of Datasets',
    true, // Enable clickable bars
    'topics' // Chart type
  );
};

// Helper function to extract searchable text from a dataset
const extractSearchableText = (dataset) => {
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
};

// Helper function to categorize a dataset
const categorizeDataset = (searchableText, keywordCategories) => {
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

// 5. Species Visualization - Add debugging
const createSpeciesVisualization = () => {
  const speciesCount = {};
  
  // DEBUG: Log first few species entries to see the structure
  console.log('=== SPECIES DEBUG ===');
  let debugCount = 0;
  
  results.value.forEach(result => {
    if (!result.species || result.species.length === 0) {
      console.log('Not Specified species example:', result.species);
      console.log('Full dataset for Not Specified:', result);
      // Only log first few examples
      if (debugCount < 2) debugCount++;
    }

    if (result.species && result.species.length > 0 && debugCount < 3) {
      console.log(`Species sample ${debugCount + 1}:`, result.species);
      debugCount++;
    }
    
    if (result.species && result.species.length > 0) {
      result.species.forEach(species => {
        let speciesName = 'Unknown';
        
        console.log('Processing species:', species, 'Type:', typeof species);
        
        // Handle different data structures for species
        if (typeof species === 'string') {
          speciesName = species.trim();
        } else if (typeof species === 'object' && species !== null) {
          console.log('Species object keys:', Object.keys(species));
          
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
        
        console.log('Final species name:', speciesName);
        
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

  console.log('Final species distribution:', speciesCount);
  console.log('=== END SPECIES DEBUG ===');

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

// Updated Helper function to create bar charts with clickable bars
const createBarChart = (data, xKey, yKey, title, xLabel, yLabel, enableClickableBars = false, chartType = null) => {
  // adjust bottom margin for title issue
  const margin = { top: 40, right: 30, bottom: 100, left: 60 };
  const width = 700 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

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

  // Create bars with optional click functionality
  const bars = g.selectAll('.bar')
    .data(data)
    .enter().append('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d[xKey]))
    .attr('width', xScale.bandwidth())
    .attr('y', d => yScale(d[yKey]))
    .attr('height', d => height - yScale(d[yKey]))
    .attr('fill', '#72a530')
    .attr('opacity', 0.8)
    .style('cursor', enableClickableBars ? 'pointer' : 'default');

  // Add click functionality if enabled
  if (enableClickableBars && chartType) {
    bars
      .on('mouseover', function(event, d) {
        select(this)
          .attr('opacity', 1)
          .attr('fill', '#5d8a26'); // Darker green on hover
      })
      .on('mouseout', function() {
        select(this)
          .attr('opacity', 0.8)
          .attr('fill', '#72a530'); // Back to original color
      })
      .on('click', function(event, d) {
        console.log('Bar clicked:', d[xKey], 'for chart:', chartType);
        handleBarClick(d[xKey], chartType);
      });

    // Add visual indicator that bars are clickable
    svg.append('text')
      .attr('x', width + margin.left + margin.right - 10)
      .attr('y', margin.top + 15)
      .attr('text-anchor', 'end')
      .style('font-size', '10px')
      .style('fill', '#0066cc')
  }

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

  // svg.append('text')
  //   .attr('x', (width + margin.left + margin.right) / 2)
  //   .attr('y', height + margin.top + margin.bottom - 10)
  //   .style('text-anchor', 'middle')
  //   .style('font-size', '12px')
  //   .text(xLabel);
};

// Updated bar click handler that properly updates URL
const handleBarClick = async (barValue, chartType) => {
  console.log('=== BAR CLICK DEBUG ===');
  console.log('Bar clicked:', barValue, 'for chart:', chartType);
  console.log('Current route query:', route.query);
  
  // Handle different chart types
  if (chartType === 'topics') {
    searchStore.topic = barValue;
    console.log('Set Topic filter to:', barValue);
  } else if (chartType === 'count') {
    searchStore.year = barValue;
    console.log('Set Year filter to:', barValue);
  }
  searchStore.runSearch();
  console.log('=== END BAR CLICK DEBUG ===');
};

// Helper function to create pie charts
const createPieChart = (data, title, enableClickableLabels = false, chartType = null) => {
  const width = 700;
  const height = 300;
  const radius = Math.min(width, height) / 2 - 40;
  const clickablePercent = 0.25; // arc ratio required to enable clicking

  const svg = select(chartContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const g = svg.append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`);

  // Enhanced color palette with more unique colors
  const enhancedColors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b',
    '#e377c2', '#7f7f7f', '#bcbd22', '#17becf', '#aec7e8', '#ffbb78',
    '#98df8a', '#ff9896', '#c5b0d5', '#c49c94', '#f7b6d3', '#c7c7c7',
    '#dbdb8d', '#9edae5', '#393b79', '#5254a3', '#6b6ecf', '#9c9ede',
    '#637939', '#8ca252', '#b5cf6b', '#cedb9c', '#8c6d31', '#bd9e39',
    '#e7ba52', '#e7cb94', '#843c39', '#ad494a', '#d6616b', '#e7969c',
    '#7b4173', '#a55194', '#ce6dbd', '#de9ed6', '#3182bd', '#6baed6',
    '#9ecae1', '#c6dbef', '#e6550d', '#fd8d3c', '#fdae6b', '#fdd0a2',
    '#31a354', '#74c476', '#a1d99b', '#c7e9c0', '#756bb1', '#9e9ac8',
    '#bcbddc', '#dadaeb', '#636363', '#969696', '#bdbdbd', '#d9d9d9'
  ];

  const pieGenerator = pie()
    .value(d => d.value)
    .sort(null);

  const arcGenerator = arc()
    .innerRadius(0)
    .outerRadius(radius);

  const pieData = pieGenerator(data);
  const totalValue = data.reduce((sum, d) => sum + d.value, 0);

  const arcs = g.selectAll('.arc')
    .data(pieData)
    .enter().append('g')
    .attr('class', 'arc');

  arcs.append('path')
    .attr('d', arcGenerator)
    .attr('fill', (d, i) => enhancedColors[i % enhancedColors.length])
    .attr('opacity', 0.8);

    const slices = arcs.append('path')
    .attr('d', arcGenerator)
    .attr('fill', (d, i) => enhancedColors[i % enhancedColors.length])
    .attr('opacity', 0.8)
    .style('cursor', (d) => {
      // Only make slices clickable if they're >= 3% AND labels are enabled
      const percentage = (d.data.value / totalValue) * 100;
      return (enableClickableLabels && chartType && percentage >= clickablePercent) ? 'pointer' : 'default';
    });

  // Add click functionality to slices if enabled
  if (enableClickableLabels && chartType) {
    slices
      .on('mouseover', function(event, d) {
        const percentage = (d.data.value / totalValue) * 100;
        
        // Only add hover effects for slices >= 3%
        if (percentage >= clickablePercent) {
          select(this)
            .attr('opacity', 1)
            .style('filter', 'brightness(1.25)'); // Slightly brighter on hover
          
          // Also highlight the corresponding legend item
          const legendItems = svg.selectAll('.legend-item');
          legendItems
            .style('background-color', (legendData) => 
              legendData.label === d.data.label ? '#e3f2fd' : 'transparent'
            )
            .select('div:last-child')
            .style('font-weight', (legendData) => 
              legendData.label === d.data.label ? 'bold' : 'normal'
            );
        }
      })
      .on('mouseout', function(event, d) {
        const percentage = (d.data.value / totalValue) * 100;
        
        if (percentage >= clickablePercent) {
          select(this)
            .attr('opacity', 0.8)
            .style('filter', 'none');
          
          // Reset legend highlighting
          const legendItems = svg.selectAll('.legend-item');
          legendItems
            .style('background-color', 'transparent')
            .select('div:last-child')
            .style('font-weight', 'normal');
        }
      })
      .on('click', function(event, d) {
        const percentage = (d.data.value / totalValue) * 100;
        
        // Only handle clicks for slices >= 3%
        if (percentage >= clickablePercent) {
          console.log('Pie slice clicked:', d.data.label, 'for chart:', chartType);
          handleLegendClick(d.data.label, chartType);
        } else {
          console.log('Small slice clicked but ignored (< 3%):', d.data.label);
        }
      });
  }

  // Add text labels only for slices that are large enough (more than 3% of total)
  arcs.append('text')
    .attr('transform', d => {
      // Only show text for slices larger than 3% of the total
      const percentage = (d.data.value / totalValue) * 100;
      if (percentage < 4) return 'translate(0,0) scale(0)'; // Hide small labels
      return `translate(${arcGenerator.centroid(d)})`;
    })
    .attr('text-anchor', 'middle')
    .style('font-size', d => {
      // Dynamic font size based on slice size
      const percentage = (d.data.value / totalValue) * 100;
      if (percentage < 3) return '0px'; // Hide completely
      if (percentage < 8) return '10px';
      if (percentage < 15) return '11px';
      return '12px';
    })
    .style('font-weight', 'bold')
    .style('fill', 'white')
    .style('text-shadow', '1px 1px 1px rgba(0,0,0,0.5)') // Add shadow for better readability
    .text(d => {
      const percentage = (d.data.value / totalValue) * 100;
      return percentage >= 4 ? d.data.value : ''; // Only show numbers for slices >= 3%
    });

  // Determine if we need scrolling (only for more than 18 items that would exceed available space)
  const legendItemHeight = 18;
  const maxLegendHeight = 200; // Maximum height before scrolling
  const estimatedContentHeight = data.length * legendItemHeight + 10; // +10 for padding
  const needsScrolling = estimatedContentHeight > maxLegendHeight;
  
  console.log(`Legend items: ${data.length}, Estimated height: ${estimatedContentHeight}, Needs scrolling: ${needsScrolling}`);
  
  // Position legend to the right of the pie chart with more width
  const legendX = (width / 2) + radius + 15;
  const legendWidth = Math.max(150, width - legendX - 10);
  
  // Use actual content height or max height
  const containerHeight = needsScrolling ? maxLegendHeight : estimatedContentHeight;
  
  // Create legend container
  const legendContainer = svg.append('foreignObject')
    .attr('x', legendX)
    .attr('y', 40)
    .attr('width', legendWidth)
    .attr('height', containerHeight);

  const legendDiv = legendContainer
    .append('xhtml:div')
    .style('width', '100%')
    .style('height', '100%')
    .style('overflow-y', needsScrolling ? 'auto' : 'hidden') // Only auto when actually needed
    .style('overflow-x', 'hidden')
    .style('background', 'transparent')
    .style('font-family', 'Arial, sans-serif')
    .style('padding', '5px')
    .style('box-sizing', 'border-box');

  // Add custom scrollbar styles only when scrolling is enabled
  if (needsScrolling) {
    legendDiv
      .style('scrollbar-width', 'thin')
      .style('scrollbar-color', '#ccc #f0f0f0');
    
    // Add webkit scrollbar styles for better cross-browser support
    const style = document.createElement('style');
    style.textContent = `
      .legend-scrollable::-webkit-scrollbar {
        width: 6px;
      }
      .legend-scrollable::-webkit-scrollbar-track {
        background: #f0f0f0;
        border-radius: 3px;
      }
      .legend-scrollable::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 3px;
      }
      .legend-scrollable::-webkit-scrollbar-thumb:hover {
        background: #999;
      }
    `;
    document.head.appendChild(style);
    
    // Add class for webkit styling
    legendDiv.classed('legend-scrollable', true);
  }

  // Create legend items
  const legendItems = legendDiv.selectAll('.legend-item')
    .data(data)
    .enter()
    .append('div')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('justify-content', 'flex-start') // Ensure left alignment
    .style('margin-bottom', '3px')
    .style('padding', '2px')
    .style('cursor', enableClickableLabels ? 'pointer' : 'default')
    .style('border-radius', '2px')
    .style('transition', 'background-color 0.2s')
    .style('text-align', 'left'); // Force left alignment

  // Add color squares
  legendItems.append('div')
    .style('width', '12px')
    .style('height', '12px')
    .style('margin-right', '8px')
    .style('flex-shrink', '0')
    .style('background-color', (d, i) => enhancedColors[i % enhancedColors.length]);

  // Add text labels
  const legendText = legendItems.append('div')
    .style('font-size', '12px')
    .style('line-height', '1.2')
    .style('color', enableClickableLabels ? '#0066cc' : '#333')
    .style('word-wrap', 'break-word')
    .style('overflow-wrap', 'break-word')
    .style('text-align', 'left') // Ensure left alignment
    .style('flex-grow', '1') // Take up remaining space
    .text(d => `${d.label} (${d.value})`)
    .attr('title', d => `${d.label} (${d.value})`); // Tooltip

  // Add click functionality if enabled
  if (enableClickableLabels && chartType) {
  legendItems
    .on('mouseover', function(event, d) {
      // Only highlight legend item (removed pie slice highlighting)
      select(this)
        .style('background-color', '#e3f2fd')
        .select('div:last-child')
        .style('font-weight', 'bold')
        .style('text-decoration', 'underline');
    })
    .on('mouseout', function() {
      // Only reset legend item (removed pie slice reset)
      select(this)
        .style('background-color', 'transparent')
        .select('div:last-child')
        .style('font-weight', 'normal')
        .style('text-decoration', 'none');
    })
    .on('click', function(event, d) {
      handleLegendClick(d.label, chartType);
    });
}

if (needsScrolling) {
    svg.append('text')
      .attr('x', legendX + (legendWidth / 2))
      .attr('y', containerHeight + 60) // Position below the legend container
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#999')
      .text('↕ Scroll for more');
  }

  // Add title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .text(title);

  // Add summary text for charts with many small slices
  if (data.length > 10) {
    const smallSlices = data.filter(d => (d.value / totalValue) * 100 < 3).length;
    if (smallSlices > 0) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('fill', '#666')
        //.text(`Note: Numbers hidden on ${smallSlices} small slice${smallSlices > 1 ? 's' : ''} (< 3%)`);
    }
  }

};

const truncateMiddle = (str, maxStart = 100, maxEnd = 50) => {
  if (str.length <= maxStart + maxEnd) return str;
  return str.slice(0, maxStart) + "…" + str.slice(-maxEnd);
}

const setActiveTab = (tab: string) => {
  activeTab.value = tab;
};

const clearAll = async () => {
  searchStore.clearSearchData();
  searchStore.runSearch();
};

const onAdvancedSearch = () => {  
  searchStore.runSearch()
};

</script>

<template>
  <div class="page-container">
    <!-- Results Found -->
    <div class="new-ui results-container">
      <!-- Full Column: Keyword and Advanced Search Inputs -->
      <div class="full-width">
        <div class="d-inline-block w-75 me-2">
          <Search />
        </div>
        <button type="button" class="btn btn-sm btn-outline-secondary p-2" @click="clearAll">
          Clear
        </button>
      </div>
      <div class="columns">
        <!-- Left Column: Filters -->
        <div class="left-column">
          <h3>Filters</h3>
          <div class="filter-container">
            <form @submit.prevent="onAdvancedSearch">
              <!--- Bioenergy Research Center Filter -->
              <div class="mb-2">
                <label class="form-label small" for="bioenergy">Bioenergy Research Center (BRC)</label>
                <select class="form-select form-select-sm" id="bioenergy" v-model="searchStore.brc">
                  <option value="">Any BRC</option>
                  <option value="JBEI">JBEI</option>
                  <option value="GLBRC">GLBRC</option>
                  <option value="CABBI">CABBI</option>
                  <option value="CBI">CBI</option>
                </select>
              </div>
              <div class="mb-2">
                <label class="form-label small" for="repository">Repository</label>
                <input type="text" class="form-control form-control-sm"
                  placeholder="e.g., ICE, Illinois Data Bank, NCBI" id="repository"
                  v-model="searchStore.repository">
              </div>
              <!-- Species Filter -->
              <div class="mb-2">
                <label class="form-label small" for="species">Species</label>
                <input type="text" class="form-control form-control-sm" placeholder="e.g., E. coli, Sorghum bicolor"
                  id="species" v-model="searchStore.species">
              </div>

              <!-- Analysis Type Filter -->
              <div class="mb-2">
                <label class="form-label small" for="analysis-type">Analysis Type</label>
                <input type="text" class="form-control form-control-sm" placeholder="e.g., Genomic, Code"
                  id="analysis-type" v-model="searchStore.analysisType">
              </div>

              <!-- Person Filter -->
              <div class="mb-2">
                <label class="form-label small" for="person">Person Name</label>
                <input type="text" class="form-control form-control-sm" placeholder="e.g., Jane Doe" id="person"
                  v-model="searchStore.personName">
                <small class="form-text text-muted">Searches both creators and contributors</small>
              </div>
              
              <!-- Filter Buttons -->
              <div class="d-flex gap-2">
                <button type="submit" class="btn btn-sm btn-primary">
                  Filter Results
                </button>
                <button type="button" class="btn btn-sm btn-outline-secondary" @click="clearAll">
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Right Column: Results -->
        <div class="right-column">
          <!-- Loading Indicator -->
          <div v-if="loading" class="loading-indicator">
            Running search...
          </div>

          <!-- No Results Found -->
          <div v-else-if="!results || (results && results.length === 0)" class="no-results-container">
            <div class="no-results-message">
              <h2>Uh oh!</h2>
              <p>Your search did not match any records. Please refine your query and try again.</p>
            </div>
          </div>
          <div v-else>
            <div v-if="showChart" class="chart-view">
              <div class="chart-header">
                <h3>Dataset Analytics</h3>
                <div class="chart-tabs">
                  <button v-for="tab in [
                    { key: 'resources', label: 'Repositories' },
                    { key: 'species', label: 'Species' },
                    { key: 'topics', label: 'Topics' },
                    { key: 'count', label: 'Publication Year' },
                    // { key: 'analysis', label: 'Analysis Type' }
                  ]" :key="tab.key" @click="setActiveTab(tab.key)"
                    :class="['tab-button', { active: activeTab === tab.key }]">
                    {{ tab.label }}
                  </button>
                </div>
              </div>
              <div class="chart-container">
                <div ref="chartContainer" class="d3-chart"></div>
              </div>
            </div>
            <h3>{{ results.length }} Results Found</h3>
            <div class="list-group">
              <div class="list-group-item" v-for="result in results" :key="result.uid">
                <div class="list-group-item-content py-2">

                  <div class="row">
                    <div class="col-md order-md-1 fs-6 fw-bold order-1">
                      <router-link :to="{ name: 'datasetShow', params: { id: result.uid } }"
                        class="pe-4">
                        <span
                          v-html="sanitizeHtml(truncateMiddle(result.title || 'No Title Provided', 75, 50), ALLOWED_HTML)"></span>
                      </router-link>
                    </div>
                  </div>

                  <div class="row">
                    <div class="fs-6 fw-light">
                      <AuthorList :creators="result.creator" />
                    </div>
                  </div>

                  <div class="row">
                    <div class="mt-2">
                      <p><small
                          v-html="sanitizeHtml(truncateMiddle(result.description || 'No Description Provided', 150, 75), ALLOWED_HTML)"></small>
                      </p>
                    </div>
                  </div>

                  <div class="row mt-1 fs-6">
                    <div class="col-12 col-md">
                      <span class="text-muted fw-lighter">{{ result.analysisType }}</span>
                    </div>
                    <div class="col-12 col-md-auto text-md-end ps-md-3">
                      <div
                        class="d-inline-flex flex-row-reverse flex-md-row flex-wrap gap-1 justify-content-start justify-content-md-end">
                        <span class="badge bg-light text-muted fw-light">{{ result.repository }}</span>
                        <span class="badge bg-brc-light-blue fw-light text-muted">{{ result.date }}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.list-group-item-content {
  overflow: hidden;
  overflow-wrap: anywhere;
}

.page-container {
  display: flex;
  width: 100%;
  position: relative;
}

/* Chart-specific styles */
.chart-view {
  display: flex;
  flex-direction: column;
}

.chart-header {
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
  background: #0d6efd;
  color: white;
  border-color: #0d6efd;
}

.chart-container {
  flex: 1;
  background-color: #fff;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 20px;
  margin: 0 0 20px 0;
  overflow: auto;
  height: 440px;
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

/* TODO New UI Container Styles */
.new-ui.results-container {
  display: flex;
  flex-direction: column; /* Stack full-width on top of columns */
  flex: 1;
}
.new-ui .full-width {
  padding: 20px;
  border-bottom: 1px solid #ddd;
  background-color: #f9f9f9;
}
.new-ui .left-column {
  padding: 20px;
  box-sizing: border-box;
}
.new-ui .right-column {
  box-sizing: border-box;
  padding: 20px;
}
.filter-container {
  background-color: #fff;
  border:1px solid #ddd;
  padding:15px;
  margin-top:10px;
}

@media (min-width: 968px) {
  .new-ui .columns {
    display: flex;
    flex: 1;
  }
  .new-ui .left-column {
    border-right: 1px solid #ddd;
    min-width: 300px;
    width: 400px;
  }
  .new-ui .right-column {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
}

/* TODO End New UI Container Styles */

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
  /* border-right: 1px solid #ddd; */
}

/* Right Column Styles */
.right-column {
  flex: 1;
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
