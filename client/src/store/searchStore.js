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

  // page state
  const defaultPageSize = 50;
  const totalResults = ref(0);
  const currentPage = ref(1);
  const resultPage = ref(1);
  const pageSize = ref(defaultPageSize);
  const totalPages = ref(1);
  const facets = ref({});
  const filterChanges = ref(false);

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
        // track changes to reset page on next search
        filterChanges.value = true;
      }
    });
  }
  const brc = filterField('brc', []);
  const year = filterField('year', []);
  const repository = filterField('repository', []);
  const species = filterField('species', '');
  const personName = filterField('personName', '');
  const analysisType = filterField('analysisType', '');
  const topic = filterField('topic', []);

  // Retrieve results matching current search filters and store in searchResults
  // pass updateURL false to skip syncing changes to URL and potential route navigation
  function runSearchFromURL(query) {
    if (anyQueryURLChanges(query)) {
      // Save the URL changes
      this.importFromURLQuery(query);
      // run search without updating URL
      this.runSearch(false);
    }
  }

  function clearSearchData() {
    searchTerm.value = '';
    dnaSequence.value = '';
    filters.value = {};
    currentPage.value = 1;
    pageSize.value = defaultPageSize;
    totalPages.value = 1;
    facets.value = {};
    totalResults.value = 0;
    searchResults.value = [];
    filterChanges.value = true;
    resultPage.value = 1;
  }

  // Retrieve results matching current search filters and store in searchResults
  // pass updateURL false to skip syncing changes to URL and potential route navigation
  async function runSearch(updateURL = true) {
    searchResultsLoading.value = true;
    searchResultsError.value = null;

    // reset page to 1 if there are pending filter changes
    if (filterChanges.value) { currentPage.value = 1}

    // Update the query url to match the current search
    if (updateURL) { await this.applySearchToURL(); }

    // track latest url params after any search changes
    // this value is used to re-apply url query state when routing back to search results.
    lastSearchQuery.value = route.query;

    try {
      let response;
      if (dnaSequence.value) {
        // TODO setup pagination for Advanced search
        response = await DatasetDataService.runAdvancedSearch(searchTerm.value, this.dnaSequence);
      } else {
        response = await DatasetDataService.getAll({
          page: currentPage.value,
          rows: pageSize.value,
          query: searchTerm.value,
          filters: filters.value
        });
      }
      // Handle paginated response shape
      if (response.data && Array.isArray(response.data.items)) {
        this.searchResults = response.data.items;
        totalPages.value = response.data.totalPages || 1;
        resultPage.value = response.data.query.page;
        currentPage.value = response.data.query.page || currentPage.value;
        facets.value = response.data.facets || {};
        totalResults.value = response.data.totalResults||0;
      } else {
        // Fallback for responses that return raw arrays
        this.searchResults = response.data;
        totalPages.value = 1;
        currentPage.value = 1;
        facets.value = {};
        totalResults.value = response.data.length;
      }
    } catch (err) {
      this.searchResults = [];
      console.error('error', err);
      searchResultsError.value = 'Failed to fetch search results.';
    } finally {
      searchResultsLoading.value = false;
       filterChanges.value = false;
    }
  }

  // Update the URL to match the current state of this store
  async function applySearchToURL() {
    // avoid duplicate url updates
    if(!anyQueryURLChanges(route.query)) { return; }

    // serialize JSON filters
    let jsonFilterString = '';
    const filterPresent = filters.value && Object.keys(filters.value).length > 0;
    if (filterPresent) {
      try {
        jsonFilterString = JSON.stringify(filters.value);
      } catch {
        console.error("searchStore URL update error. Bad url query format: 'filters'", filters);
      }
    }
    await router.push({
      name: 'datasetSearch',
      query: {
        ...route.query,
        q: (searchTerm.value && searchTerm.value.length > 0) ? searchTerm.value : undefined,
        filters: (jsonFilterString && jsonFilterString.length > 0) ? jsonFilterString : undefined,
        page: currentPage.value !== 1 ? currentPage.value : undefined,
        rows: pageSize.value
      }
    });
  }

  // Update this store to match the provided URL query terms
  function importFromURLQuery(query) {
    // simple assignment for search term string
    searchTerm.value = query.q;
    // convert json string with filters into object
    if (query.filters) {
      let jsonFilters = {};
      const jsonFilterString = query.filters;
      try { jsonFilters = JSON.parse(jsonFilterString); } catch (e) {
        console.error("searchStore parsing error. Bad url query format: 'filters'", query.filters, e);
      }
      filters.value = Object.keys(jsonFilters).length > 0 ? jsonFilters : undefined;
    } else {
      filters.value = undefined;
    }
    currentPage.value = parseInt(query.page) > 0 ? parseInt(query.page) : 1;
    pageSize.value = parseInt(query.size) > 0 ? parseInt(query.size) : defaultPageSize;
  }

  // Compare current state to provided value
  // Required to watch for route query changes within the active component (back button)
  function anyQueryURLChanges(query) {
    try {
      const sameFilters = JSON.stringify(filters.value) === query.filters;
      const sameSearch = searchTerm.value === query.q;
      const samePage = (currentPage.value === query.page && pageSize.value === query.rows)
      return !(sameSearch && sameFilters && samePage)
    } catch (e) {
      console.error("searchStore URL comparison error.", e);
      return false;
    }
  }

  function goToPage(page) {
    const pageNum = parseInt(page) || 1;
    const allowedPage = Math.min(Math.max(pageNum, 1), totalPages.value || 1);
    currentPage.value = allowedPage;
    this.runSearch();
  }

  return {
    // state
    searchResults,
    searchResultsLoading,
    searchResultsError,
    lastSearchQuery,
    searchTerm,
    dnaSequence,
    filters,
    brc,
    year,
    repository,
    species,
    personName,
    analysisType,
    topic,
    currentPage,
    resultPage,
    pageSize,
    totalPages,
    totalResults,
    facets,
    // actions
    runSearch,
    clearSearchData,
    applySearchToURL,
    importFromURLQuery,
    runSearchFromURL,
    goToPage,
    anyQueryURLChanges
  };
});