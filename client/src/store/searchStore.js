import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import DatasetDataService from "../services/DatasetDataService";

export const useSearchStore = defineStore('searchStore', () => {
  const router = useRouter();
  const route = useRoute();
  const dnaSequence = ref('');
  const lastSearchQuery = ref();
  const searchResults = ref([]);
  const searchResultsLoading = ref(false);
  const searchResultsError = ref(null);
  const filters = ref({});
  const searchTerm = ref('');
  // Helper Function - reduce boilerplate for filter terms
  function filterField(key, fallback) {
    return computed({
      get() {
        const v = filters.value?.[key];
        return v ?? fallback;
      },
      set(v) {
        const filterValues = { ...filters.value };
        if (v === null || v === '' || (Array.isArray(v) && v.length === 0)) {
          delete filterValues[key];
        } else {
          filterValues[key] = v;
        }
        filters.value = filterValues;
      }
    });
  }
  const brc = filterField('brc', '');
  const year = filterField('year', '');
  const repository = filterField('repository', '');
  const species = filterField('species', '');
  const personName = filterField('personName', '');
  const analysisType = filterField('analysisType', '');
  const topic = filterField('topic', '');

  // Check for changes in the provided URL and update if found.
  // Use to initialize and refresh state from router and component whenever the query params change.
  function runSearchFromURL(query) {
    console.log("searchStore - refreshing query", query);
    if (anyQueryURLChanges(query)) {
      console.log("searchStore - refreshing query - changes found");
      // Save the URL changes
      this.importFromURLQuery(query);
      // run search without updating URL
      this.runSearch(false);
    } else {
      console.log("searchStore - refreshing query - Nothing to do", searchTerm.value, filters.value);
    }
  }

  // Reset all stored state
  function clearSearchData() {
    searchTerm.value = '';
    dnaSequence.value = '';
    filters.value = {};
  }

  // Retrieve results matching current search filters and store in searchResults
  // pass updateURL false to skip syncing changes to URL and potential route navigation
  async function runSearch(updateURL = true) {
    searchResultsLoading.value = true;
    searchResultsError.value = null;
    searchResults.value = [];

    // Update the query url to match the current search
    if (updateURL) { await this.applySearchToURL(); }

    // track latest url params after any search changes
    // this value is used to re-apply url query state when routing back to search results.
    lastSearchQuery.value = route.query;

    try {
      let response;
      console.log("searchStore - Running Search", filters.value);
      if (filters.value) {
        // Use filtered search when filters are active
        const filterPayload = {
          textQuery: searchTerm.value || '',
          filters: filters.value || {}
        };
        console.log('Using filtered search with payload:', filterPayload);
        response = await DatasetDataService.runFilteredSearch(filterPayload);
      } else if (!searchTerm.value && !dnaSequence.value) {
        response = await DatasetDataService.getAll();
      } else {
        response = await DatasetDataService.runAdvancedSearch(
          searchTerm.value,
          this.dnaSequence
        );
      }
      this.searchResults = response.data;
      console.log('searchStore - Search results count:', this.searchResults.length);
    } catch (err) {
      this.searchResults = [];
      console.error('error', err);
      this.searchResultsError = 'Failed to fetch search results.';
    } finally {
      this.searchResultsLoading = false;
    }
  }

  // Update the URL to match the current state of this store
  async function applySearchToURL() {
    // serialize JSON filters
    let jsonFilterString = '';
    const filterPresent = filters.value && Object.keys(filters.value).length > 0;
    if (filterPresent) {
      try { jsonFilterString = JSON.stringify(filters.value); } catch {
        console.error("searchStore URL update error. Bad url query format: 'filters'", filters);
      }
    }
    await router.push({
      name: 'datasetSearch',
      query: {
        ...route.query,
        q: (searchTerm.value && searchTerm.value.length > 0) ? searchTerm.value : undefined,
        filters: (jsonFilterString && jsonFilterString.length > 0) ? jsonFilterString : undefined
      }
    });
  }

  // Update this store to match the provided URL query terms
  function importFromURLQuery(query) {
    console.log("searchStore - Import from URL", query);
    // simple assignment for search term string
    searchTerm.value = query.q;
    // convert json string with filters into object
    if (query.filters) {
      let jsonFilters = {};
      const jsonFilterString = query.filters;
      try { jsonFilters = JSON.parse(jsonFilterString); } catch (e) {
        console.error("searchStore parsing error. Bad url query format: 'filters'", query.filters, e);
      }
      if (Object.keys(jsonFilters).length > 0) {
        filters.value = jsonFilters;
      } else {
        filters.value = undefined;
      }
    } else {
      filters.value = undefined;
    }
  }

  // Compare current state to provided value
  // Required to watch for route query changes within the active component (back button)
  function anyQueryURLChanges(query) {
    try {
      return !((searchTerm.value === query.q) && (JSON.stringify(filters.value) === query.filters));
    } catch (e) {
      console.error("searchStore URL comparison error.", e);
      return false;
    }
  }

  return {
    searchResults, searchResultsLoading, searchResultsError, runSearch, lastSearchQuery, clearSearchData,
    importFromURLQuery, applySearchToURL, runSearchFromURL, searchTerm, dnaSequence,
    filters, brc, year, repository, species, personName, analysisType, topic
  };
});
