<script setup lang="ts">
import DatasetDataService from "../services/DatasetDataService";
import {ref, watch} from "vue";

const results = ref([]);
const loading = ref(true);
const error = ref(null);
const selectedResult = ref(null);

const props = defineProps({
  filter: String,
  dnaSequence: String,
});

const emit = defineEmits(['clear-dna-sequence']);

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
    results.value = response.data;
    selectedResult.value = results.value.length > 0 ? results.value[0] : null;
  } catch (err) {
    results.value = [];
    console.error('error', err);
    error.value = 'Failed to fetch search results.';
  } finally {
    loading.value = false;
  }
};

// fetch all data from backend. use when there is no filter or search params
const fetchAllData = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await DatasetDataService.getAll();
    results.value = response.data;
    selectedResult.value = results.value.length > 0 ? results.value[0] : null;
  } catch (e) {
    error.value = 'There was an error while fetching search results.';
    console.error(e);
    results.value = [];
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

// user clicks on a result in the left column
// updates the object whose details are being displayed in the right
const onSelectResult = (result: any) => {
  selectedResult.value = result;
}
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
        <div class="fw-bold text-center small">{{ results.length }} results found</div>

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

      <!-- Right Column: Selected Result Details -->
      <div v-if="selectedResult && !loading" class="right-column">
        <h3>{{ selectedResult.title }}</h3>
        <div>
          More information at:
          <a :href="selectedResult.bibliographicCitation" target="_blank" class="btn btn-primary btn-sm">
            <i class="bi bi-box-arrow-up-right"></i> {{ selectedResult.identifier }}
          </a>
        </div>

        <div class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">Date</div>
          {{ selectedResult.date }}
        </div>

        <div v-if="selectedResult?.creator?.length" class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">Creator</div>
          <div>{{ selectedResult.creator[0].creatorName }}</div>
        </div>

        <div class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">BRC</div>
          <div>{{ selectedResult.brc }}</div>
        </div>

        <div class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">Repository</div>
          <div>{{ selectedResult.repository }}</div>
        </div>

        <div v-if="selectedResult.analysisType" class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">Analysis Type</div>
          <div>{{ selectedResult.analysisType }}</div>
        </div>

        <div v-if="selectedResult.description" class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">Description</div>
          {{ selectedResult.description }}
        </div>

        <div v-if="selectedResult.keywords && selectedResult.keywords.length" class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">Keywords</div>
          {{ Array.from(selectedResult.keywords).join(', ') }}
        </div>

        <div v-if="selectedResult.species" class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">Species</div>
          <div class="d-flex justify-content-start">
            <div v-for="species in selectedResult.species" :key="species.NCBITaxID">
              <div class="me-5">
                <b class="fs-7 text-uppercase text-muted">Scientific Name: </b>{{ species.scientificName }}<br>
                <b class="fs-7 text-uppercase text-muted">NCBITaxID: </b>{{ species.NCBITaxID }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedResult.relatedItem" class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">Related Item</div>
          <div class="text-muted italic fw-bold">
            {{ selectedResult.relatedItem.relatedItemType }}
            <i class="bi bi-box-arrow-up-right"></i>
          </div>
          <a :href="selectedResult.relatedItem.relatedItemIdentifier" target="_blank">
            {{ selectedResult.relatedItem.title }}
          </a>
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
  overflow: hidden; /* Prevents scrollbars from appearing */
  position: relative; /* Establishes a positioning context */
}

/* Loading Indicator Styles */
.loading-indicator {
  margin: auto; /* Centers the loading indicator both vertically and horizontally */
  text-align: center;
  font-size: 1.5em;
  font-weight: bold;
}

/* No Results Container Styles */
.no-results-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1; /* Takes up the full available space */
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
  flex: 1; /* Ensures it takes up the remaining space */
  overflow: hidden; /* Prevents internal scrollbars from affecting the layout */
}

/* Left Column Styles */
.left-column {
  min-width: 300px;
  width: 400px;
  overflow-y: auto; /* Enables vertical scrolling if content overflows */
  padding: 20px;
  border-right: 1px solid #ddd; /* Optional: Adds a separator between columns */
}

/* Right Column Styles */
.right-column {
  flex: 1; /* Allows the right column to expand and fill the remaining space */
  padding: 20px;
  overflow-y: auto; /* Enables vertical scrolling if content overflows */
}

/* Utility Classes */
.fs-7 {
  font-size: 0.7em;
}

.cursor-pointer {
  cursor: pointer;
}

/* Optional: Scrollbar Styling for Left and Right Columns */
.left-column::-webkit-scrollbar,
.right-column::-webkit-scrollbar {
  width: 8px;
}

.left-column::-webkit-scrollbar-thumb,
.right-column::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

/* Responsive Adjustments (Optional) */
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
}
</style>

