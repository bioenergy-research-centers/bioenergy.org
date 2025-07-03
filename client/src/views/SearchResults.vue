<script setup lang="ts">
import DatasetDataService from "../services/DatasetDataService";
import {ref, watch, onMounted, nextTick} from "vue";
import { resolveComponentVersion } from './datasets/versionComponentMap';

// Add D3 imports
import { select, scaleLinear, scaleBand, axisBottom, axisLeft, pie, arc, schemeCategory10 } from 'd3';

const results = ref([]);
const loading = ref(true);
const error = ref(null);
const selectedResult = ref(null);

// Add refs for D3 containers and chart state
const chartContainer = ref<HTMLElement>();
const showChart = ref(false);
const activeTab = ref('count'); // 'count', 'sources', 'topics', 'resources'

const props = defineProps({
  filter: String,
  dnaSequence: String,
});

const emit = defineEmits(['clear-dna-sequence']);

// Add a reactive trigger for visualization updates
const visualizationTrigger = ref(0);

// In handleSearch function, add this after setting results:
const handleSearch = async () => {
  // ... existing code ...
  
  try {
    const response = await DatasetDataService.runAdvancedSearch(
        props.filter,
        props.dnaSequence
    );
    results.value = response.data;
    selectedResult.value = results.value.length > 0 ? results.value[0] : null;
    
    // Trigger visualization update
    visualizationTrigger.value++;
    
    await nextTick();
    if (showChart.value) {
      createVisualization();
    }
  } catch (err) {
    results.value = [];
    console.error('error', err);
    error.value = 'Failed to fetch search results.';
  } finally {
    loading.value = false;
  }
};

// And add this watcher:
watch(visualizationTrigger, () => {
  if (showChart.value && results.value.length > 0) {
    nextTick(() => {
      createVisualization();
    });
  }
});


const fetchAllData = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await DatasetDataService.getAll();
    results.value = response.data;
    selectedResult.value = results.value.length > 0 ? results.value[0] : null;
    
    await nextTick();
    if (showChart.value) {
      createVisualization();
    }
  } catch (e) {
    error.value = 'There was an error while fetching search results.';
    console.error(e);
    results.value = [];
  } finally {
    loading.value = false;
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

  console.log('BRC distribution:', brcCount); // Debug log

  const chartData = Object.entries(brcCount)
    .map(([brc, count]) => ({ label: brc, value: count }))
    .sort((a, b) => b.value - a.value);

  createPieChart(chartData, 'Dataset Distribution by BRC (Bioenergy Research Center)');
};

// 3. Topics Visualization
const createTopicsVisualization = () => {
  const topicCount = {};
  
  results.value.forEach(result => {
    // Extract topics from title, description, or specific topic fields
    let topics = [];
    
    if (result.topics) {
      topics = Array.isArray(result.topics) ? result.topics : [result.topics];
    } else if (result.keywords) {
      topics = Array.isArray(result.keywords) ? result.keywords : result.keywords.split(',');
    } else if (result.title) {
      // Extract potential topics from title (simple keyword extraction)
      const commonTopics = ['bioenergy', 'biomass', 'enzyme', 'fermentation', 'biofuel', 'cellulose', 'lignin', 'metabolic', 'genomic', 'protein'];
      topics = commonTopics.filter(topic => 
        result.title.toLowerCase().includes(topic.toLowerCase())
      );
    }
    
    if (topics.length === 0) {
      topics = ['General'];
    }
    
    topics.forEach(topic => {
      const cleanTopic = topic.toString().trim();
      topicCount[cleanTopic] = (topicCount[cleanTopic] || 0) + 1;
    });
  });

  const chartData = Object.entries(topicCount)
    .map(([topic, count]) => ({ label: topic, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Show top 10 topics

  createBarChart(
    chartData.map(d => ({ category: d.label, count: d.value })), 
    'category', 
    'count', 
    'Top Topics Distribution', 
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

  console.log('Repository distribution:', repositoryCount); // Debug log

  const chartData = Object.entries(repositoryCount)
    .map(([repository, count]) => ({ label: repository, value: count }))
    .sort((a, b) => b.value - a.value);

  createPieChart(chartData, 'Dataset Distribution by Repository');
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
const createPieChart = (data, title) => {
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

  // Add legend
  const legend = svg.append('g')
    .attr('transform', `translate(20, 20)`);

  const legendItems = legend.selectAll('.legend-item')
    .data(data)
    .enter().append('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => `translate(0, ${i * 20})`);

  legendItems.append('rect')
    .attr('width', 15)
    .attr('height', 15)
    .attr('fill', (d, i) => color[i % color.length]);

  legendItems.append('text')
    .attr('x', 20)
    .attr('y', 12)
    .style('font-size', '12px')
    .text(d => `${d.label} (${d.value})`);

  // Add title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .text(title);
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
                  { key: 'resources', label: 'Resources' }
                ]"
                :key="tab.key"
                @click="setActiveTab(tab.key)"
                :class="['tab-button', { active: activeTab === tab.key }]"
              >
                {{ tab.label }}
              </button>
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
</style>
