<script setup lang="ts">
import DatasetDataService from "../services/DatasetDataService";
import {ref, watch, watchPostEffect, onMounted, nextTick, computed} from "vue";
import { resolveComponentVersion } from './datasets/versionComponentMap';
import AuthorList from '@/components/AuthorList.vue';
import { useRouter, useRoute, onBeforeRouteUpdate } from 'vue-router';
import Search from '@/components/Search.vue';
import {useSearchStore} from '@/store/searchStore';
import { storeToRefs } from 'pinia'

import sanitizeHtml from 'sanitize-html';
import {BPagination, BSpinner} from 'bootstrap-vue-next'
import FacetCharts from '@/components/FacetCharts.vue';
import FacetFilterChecks from '@/components/FacetFilterChecks.vue';
import FacetFilterDatalist from '@/components/FacetFilterDatalist.vue';

const route = useRoute()
const searchStore = useSearchStore();

const ALLOWED_HTML = { allowedTags: [ 'b', 'i', 'sub', 'sup'], allowedAttributes: {} };

// Creating a reactive value from the store requires destructuring with storeToRefs
// https://pinia.vuejs.org/core-concepts/#Destructuring-from-a-Store
const{searchResults, searchResultsLoading, searchResultsError, currentPage, totalPages, totalResults, pageSize, facets, resultPage} = storeToRefs(searchStore);
const results = searchResults;
const loading = searchResultsLoading;
const error = searchResultsError;
// Add refs for D3 containers and chart state
const showChart = ref(true);

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


// Handle legend clicks emitted from the FacetCharts component.  Clicking on a
// legend entry sets the appropriate filter on the search store and runs a
// new search.  The payload contains the clicked value and chart type.
function handleChartClick({ value, chartType }) {
  if (chartType === 'repository') {
    searchStore.repository = [value];
  } else if (chartType === 'species') {
    searchStore.species = value;
  }  else if (chartType === 'topics') {
    searchStore.topic = [value];
  } else if (chartType === 'year') {
    searchStore.year = [value];
  }  
  // After setting the filter, execute a new search
  searchStore.runSearch();
}

const truncateMiddle = (str, maxStart = 100, maxEnd = 50) => {
  if (str.length <= maxStart + maxEnd) return str;
  return str.slice(0, maxStart) + "…" + str.slice(-maxEnd);
}

const clearAll = async () => {
  searchStore.clearSearchData();
  searchStore.runSearch();
};

const onAdvancedSearch = () => {  
  searchStore.runSearch()
};

const onPageChange = (newPage) => {
  searchStore.goToPage(newPage);
}

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
              <div v-if="loading && (!facets || Object.keys(facets).length == 0)">
                Loading
                <span v-if="loading" class="loading-indicator"> 
                  <BSpinner
                    small
                    variant="primary"
                    label="Running search"
                    class="mx-1"
                  />
                </span>
              </div>
              <div v-else>
                <!--- Bioenergy Research Center Filter -->
                <div class="mb-2 small">
                  <FacetFilterChecks title="Bioenergy Research Center" label="brc" :items="facets?.brc" v-model="searchStore.brc" alphabetical />
                </div>

                <!--- Topic Filter -->
                <div class="mb-2 small">
                  <FacetFilterChecks title="Topics" label="topic" :items="facets?.topic" v-model="searchStore.topic" showCounts />
                </div>

                <!--- Repository Filter -->
                <div class="mb-2 small">
                  <FacetFilterChecks title="Repository" label="repository" :items="facets?.repository" v-model="searchStore.repository" showCounts />
                </div>

                <!--- Year Filter -->
                <div class="mb-2 small">
                  <FacetFilterChecks title="Year" label="year" :items="facets?.year" v-model="searchStore.year" alphabetical reverse />
                </div>

                <!-- Species Filter -->
                <div class="mb-2">
                  <FacetFilterDatalist title="Species" label="species" :items="facets?.species" v-model="searchStore.species" placeholder="e.g., Escherichia coli, Sorghum bicolor"/>
                </div>

                <!-- Analysis Type Filter -->
                <div class="mb-2">
                  <FacetFilterDatalist title="Analysis Type" label="analysisType" :items="facets?.analysisType" v-model="searchStore.analysisType" placeholder="e.g., Genomic, Code"/>
                </div>

                <!-- Person Filter -->
                <div class="mb-2">
                  <FacetFilterDatalist title="Person Name" label="personName" :items="facets?.personName" v-model="searchStore.personName" placeholder="e.g., Jane Doe"/>
                  <small class="form-text text-muted">Searches both creators and contributors</small>
                </div>
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
          
            <div v-if="showChart" class="chart-view">

                <FacetCharts
                  title="Dataset Analytics"
                  :facets="facets"
                  @legendClick="handleChartClick"
                  @barClick="handleChartClick"
                  @onClick="handleChartClick"
                />
            </div>

            <h3>
              <span v-if="loading && (!results || results.length == 0)">Loading</span>
              <span v-else-if="totalResults && totalResults > 0">{{ totalResults }} Search Results
                <br/><small class="text-muted">listing {{ (resultPage - 1) * pageSize + 1 }} - {{ (resultPage - 1) * pageSize + results.length }}</small>
              </span>
              <span v-else> {{ results.length }} Search Results</span>
              <!-- Result Loading Indicator -->
              <span v-if="loading" class="loading-indicator"> 
                <BSpinner
                  small
                  variant="primary"
                  label="Running search"
                  class="mx-1"
                />
              </span>
            </h3>
            <!-- Pagination Controls -->
            <BPagination
              v-model="currentPage"
              :total-rows="totalResults"
              :per-page="pageSize"
              :limit="7"
              aria-controls="search-results-list"
              @update:modelValue="onPageChange"
            />
            <!-- No Results Found -->
            <div v-if="!results || (results && results.length === 0) || (results.length === undefined)" class="no-results-container">
              <div v-if="loading" class="no-results-message">
              </div>
              <div v-else>
                <h2>Uh oh!</h2>
                <p>Your search did not match any records. Please refine your query and try again.</p>
              </div>
            </div>
            <!-- Results List -->
            <div v-else>
            <ul id='search-results-list' class="list-group">
              <li class="list-group-item" v-for="result in results" :key="result.uid">
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
              </li>
            </ul>
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
  min-height: 500px;
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
  /* margin: auto; */
  /* text-align: center; */
  font-size: 0.5em;
  /* font-weight: bold; */
}

/* No Results Container Styles */
.no-results-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  text-align: center;
  padding: 20px;
  min-height: 500px;
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
