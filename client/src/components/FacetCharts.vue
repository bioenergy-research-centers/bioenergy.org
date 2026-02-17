<script setup>
import { ref, watch, onMounted } from 'vue';
import { select, scaleLinear, scaleBand, axisBottom, axisLeft, pie, arc, schemeCategory10 } from 'd3';

const props = defineProps({
  title: { type: String },
  facets: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['legendClick', 'barClick', 'onClick']);

const chartContainer = ref(null);
const activeTab = ref('resources');

const tabs = [
  { key: 'resources', label: 'Repositories' },
  { key: 'species', label: 'Species' },
  { key: 'themes', label: 'Themes' },
  { key: 'topics', label: 'Topics' },
  { key: 'year', label: 'Publication Year' }
];

watch(() => props.facets, () => {
  drawChart();
}, { deep: true });

watch(() => activeTab.value, () => {
  drawChart();
});

onMounted(() => {
  drawChart();
});

function drawChart() {
  if (!chartContainer.value) return;

  // Clear any existing chart
  select(chartContainer.value).selectAll('*').remove();

  if (!props.facets) return;
  switch (activeTab.value) {
    case 'year':
      const yearData = facetData('year').sort((a, b) => a.label.localeCompare(b.label));
      createBarChart('year', yearData, 'label', 'value', 'Dataset Count by Year', 'Year', 'Number of Datasets');
      break;
    case 'themes':
      const themeData = facetData('theme').sort((a, b) => {
        a.label.localeCompare(b.label)
      });
      createBarChart('themes', themeData, 'label', 'value', 'Research Themes Distribution', 'Theme', 'Number of Datasets',{
        "default": '#72a530',
        "Deconstruction and Separation": '#1f77b4',
        "Conversion": '#ff7f0e',
        "Feedstock Development": '#2ca02c',
        "Sustainability": '#d62728'
      });
      break;
    case 'topics':
      const topicData = facetData('topic').sort((a, b) => b.value - a.value);
      createBarChart('topics', topicData, 'label', 'value', 'Research Topics Distribution', 'Topic', 'Number of Datasets');
      break;
    case 'resources':
      const repoData = facetData('repository').sort((a, b) => b.value - a.value);
      createPieChart('repository', repoData, 'Dataset Distribution by Repository');
      break;
    case 'species':
      const speciesData = facetData('species').sort((a, b) => b.value - a.value);
      createPieChart('species', speciesData, 'Dataset Distribution by Species');
      break;
    default:
  }
}

function facetData(facetKey) {
  const arrayData = (props.facets && props.facets[facetKey]);
  if(!arrayData || !Array.isArray(arrayData) || arrayData.length==0) {return []};
  return arrayData.map(item => ({ label: String(item.value), value: item.count }));
}

function createBarChart(chartKey, data, xKey, yKey, title, xLabel, yLabel, colors=null) {
  // override default colors with object containing x-axis values as keys
  const chartColors = colors || {default: '#72a530'}
  const margin = { top: 40, right: 30, bottom: 100, left: 60 };
  const containerBounds = chartContainer.value.getBoundingClientRect();
  const width = Math.min(containerBounds.width,700) - margin.left - margin.right;
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
  
  // Create X axis
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(axisBottom(xScale))
    .selectAll('text')
    .style('text-anchor', 'end')
    .attr('dx', '-.8em')
    .attr('dy', '.15em')
    .attr('transform', 'rotate(-45)');

  // Create Y axis
  g.append('g').call(axisLeft(yScale));

  // Create bars with click functionality
  g.selectAll('.bar')
    .data(data)
    .enter().append('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d[xKey]))
    .attr('width', xScale.bandwidth())
    .attr('y', d => yScale(d[yKey]))
    .attr('height', d => height - yScale(d[yKey]))
    .attr('fill', d => (chartColors[d[xKey]] || chartColors['default'] || '#72a530') )
    .style('cursor', 'pointer')
    .on('mouseover', function() {
      select(this).style('filter', 'brightness(1.25)')
    })
    .on('mouseout', function() {
      select(this).attr('fill', d => (chartColors[d[xKey]] || chartColors['default'] || '#72a530') )
      .style('filter', 'none');
    })
    .on('click', function(_event, d) {
      emit('onClick', { value: d[xKey], chartType: chartKey });
    });

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

  // Add Y axis label
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 15)
    .attr('x', 0 - (height / 2) - margin.top)
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text(yLabel);
}

// Helper function to create pie charts
const createPieChart = (chartKey, data, title, enableClickableLabels = true) => {
  const containerBounds = chartContainer.value.getBoundingClientRect();
  const width = Math.min(containerBounds.width, 700);
  const height = 300;
  const legendMargin = 150;
  const titleMargin = 20
  const pieWidth =  Math.min((width-legendMargin), height-titleMargin) - 40
  const radius = pieWidth / 2;
  const pieX = (width-legendMargin)/2;
  const pieY = (height+titleMargin)/2
  const clickablePercent = 0.25; // arc ratio required to enable clicking

  const svg = select(chartContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  const g = svg.append('g')
    .attr('transform', `translate(${pieX},${pieY})`);

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

    const slices = arcs.append('path')
    .attr('d', arcGenerator)
    .attr('fill', (d, i) => enhancedColors[i % enhancedColors.length])
    .style('cursor', (d) => {
      // Only make slices clickable if they're >= 3% AND labels are enabled
      const percentage = (d.data.value / totalValue) * 100;
      return (enableClickableLabels && chartKey && percentage >= clickablePercent) ? 'pointer' : 'default';
    });

  // Add click functionality to slices if enabled
  if (enableClickableLabels && chartKey) {
    slices
      .on('mouseover', function(event, d) {
        const percentage = (d.data.value / totalValue) * 100;
        
        // Only add hover effects for slices >= 3%
        if (percentage >= clickablePercent) {
          select(this).style('filter', 'brightness(1.25)'); // Slightly brighter on hover
          
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
          select(this).style('filter', 'none');
          
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
          emit('onClick', {value: d.data.label, chartType: chartKey} );
        } else {
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
  const legendItemHeight = 19;
  const maxLegendHeight = 225; // Maximum height before scrolling
  const estimatedContentHeight = Math.max(200, data.length * legendItemHeight + 10); // +10 for padding, no smaller than 40
  const needsScrolling = estimatedContentHeight > maxLegendHeight;
    
  // Position legend to the right of the pie chart with more width
  const legendX = pieX + radius + 10;
  const legendWidth = Math.min(250, width - legendX - 10);
  
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
    .style('overflow-y', 'auto') // always have scroll for possible overflow
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
  if (enableClickableLabels && chartKey) {
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
      emit('onClick', {value: d.label, chartType: chartKey} );
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

</script>

<template>
  <div class="chart-header">
    <h3>{{ title }}</h3>
    <!-- Chart Tabs -->
    <div class="chart-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-button', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>
   </div>
    <!-- Chart Container -->
    <div class="chart-container">
      <div ref="chartContainer" class="d3-chart"></div>
    </div>
</template>

<style scoped>
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
    margin: 0 0 40px 0;
    overflow: auto;
    height: 440px;
  }

  .d3-chart {
    width: 100%;
    text-align: center;
  }
</style>