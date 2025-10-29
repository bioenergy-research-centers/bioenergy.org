<script setup lang="ts">
import {RouterLink, useRoute, useRouter} from "vue-router";
import {onBeforeMount, ref, watch, onMounted} from "vue"; // Fixed import
import {useSearchStore} from '@/store/searchStore';

const docs_link = import.meta.env.VITE_BIOENERGY_ORG_API_URI + "/api-docs";

const router = useRouter();
const route = useRoute();
const searchStore = useSearchStore();

const searchText = ref('');
const dnaSequence = ref('');

// Advanced search filters
const advancedFilters = ref({
  brc: '',
  repository: '',
  species: '',
  analysisType: '',
  personName: ''
});

const clearAdvancedFilters = () => {
  advancedFilters.value = {
    brc: '',
    repository: '',
    species: '',
    analysisType: '',
    personName: ''
  };
};

const clearSequence = () => {
  searchStore.clearSearchData();
  dnaSequence.value = '';
};

// Enhanced clearAll function that also triggers a fresh search
const clearAll = async () => {
  console.log('=== CLEAR ALL DEBUG ===');
  console.log('Before clearing - searchText:', searchText.value);
  console.log('Before clearing - advancedFilters:', advancedFilters.value);
  console.log('Before clearing - dnaSequence:', dnaSequence.value);
  
  // Clear all form fields
  clearSequence();
  clearAdvancedFilters();
  searchText.value = '';
  
  console.log('After clearing - all fields should be empty');
  console.log('searchText:', searchText.value);
  console.log('advancedFilters:', advancedFilters.value);
  console.log('dnaSequence:', dnaSequence.value);
  
  // Navigate to clean dataSearch page (no query parameters)
  // This will trigger a fresh search with no filters
  console.log('Navigating to clean dataSearch page...');
  await router.push({
    name: 'datasetSearch'
    // No query parameters = completely clean search
  });
  
  console.log('Navigation complete - should trigger fresh search');
  console.log('=== END CLEAR ALL DEBUG ===');
};

const onSubmit = () => {
  // save sequence to the store
  searchStore.setDnaSequence(dnaSequence.value);

  // navigate to dataSearch with search text in the URL
  router.push({
    name: 'datasetSearch',
    query: {
      q: searchText.value,
    },
  });
};

const onAdvancedSearch = () => {
  // Save sequence to store
  searchStore.setDnaSequence(dnaSequence.value);
  
  // Create filter object with only non-empty values
  const filters = {};
  Object.keys(advancedFilters.value).forEach(key => {
    if (advancedFilters.value[key] && advancedFilters.value[key].trim() !== '') {
      filters[key] = advancedFilters.value[key].trim();
    }
  });
  
  // Navigate to dataSearch with search text and filters
  router.push({
    name: 'datasetSearch',
    query: {
      q: searchText.value,
      filters: Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined
    },
  });
};

const preventDropdownClose = (event) => {
  event.stopPropagation();
};

onBeforeMount(() => {
  const query = route.query.q as string || '';
  if (query)
    searchText.value = query as string;
});

watch(() => route.query.q, (newQuery) => {
  const queryString = newQuery as string || '';
  if (queryString !== searchText.value) {
    searchText.value = queryString;
  }
}, { immediate: true });

// Add the new watcher for filters synchronization
const isUpdatingFromURL = ref(false);

watch(() => route.query.filters, (newFilters) => {
  if (isUpdatingFromURL.value) {
    console.log('HeaderView - Skipping update (already updating from URL)');
    return;
  }
  
  console.log('HeaderView - URL filters changed:', newFilters);
  
  isUpdatingFromURL.value = true;
  
  try {
    if (newFilters) {
      const parsedFilters = JSON.parse(newFilters);
      console.log('HeaderView - Parsed filters:', parsedFilters);
      
      // Update the advanced search form fields
      Object.keys(advancedFilters.value).forEach(key => {
        if (parsedFilters.hasOwnProperty(key)) {
          advancedFilters.value[key] = parsedFilters[key];
        } else {
          advancedFilters.value[key] = '';
        }
      });
      
    } else {
      // Clear all advanced filters if no filters in URL
      console.log('HeaderView - No filters in URL, clearing advanced filters');
      clearAdvancedFilters();
    }
  } catch (e) {
    console.error('HeaderView - Error parsing filters from URL:', e);
  } finally {
    // Reset the flag after a short delay
    setTimeout(() => {
      isUpdatingFromURL.value = false;
    }, 100);
  }
}, { immediate: true });

</script>

<template>
  <form @submit.prevent="onSubmit">
    <div class="row">
      <div class="col-12 col-md-8">
        <div class="input-group">
          <!-- Main Search Input -->
          <label for="main-search-input" class="visually-hidden">Search Datasets</label>
          <input id="main-search-input" class="form-control" placeholder="Search bioenergy.org datasets" v-model="searchText"/>
          <button type="submit" class="btn btn-sm btn-light search">
            <span class="visually-hidden">Search</span>
            <i class="bi bi-search text-muted"></i>
          </button>
          
          <!-- Advanced Search Dropdown Toggle -->
          <button type="button" class="btn btn-sm btn-light dropdown-toggle advanced" data-bs-toggle="dropdown"
                  aria-expanded="false">
            Advanced
          </button>
          
          <!-- Advanced Search Dropdown -->
          <ul class="dropdown-menu p-3" @click="preventDropdownClose">
            <!-- DNA Sequence Section -->
            <li class="mb-3">
              <label class="form-label small fw-bold text-muted" for="dna">DNA Sequence</label>
              <textarea class="form-control" rows="3" placeholder="Enter sequence..." v-model="dnaSequence" id="dna"></textarea>
            </li>
            <!-- Action Buttons -->
            <li class="mt-3">
              <div class="d-flex gap-2 flex-wrap">
                <button type="button" class="btn btn-sm btn-primary" @click="onAdvancedSearch">
                  <i class="bi bi-search"></i> Advanced Search
                </button>
                <button type="submit" class="btn btn-sm btn-outline-primary" v-if="dnaSequence.trim()">
                  <i class="bi bi-dna"></i> Sequence Search
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger" @click="clearAll">
                  Clear
                </button>
              </div>
           </li>
          </ul>
        </div>
      </div>
    </div>
  </form>
</template>

<style scoped>
.dropdown-menu {
  display: none;
  position: absolute;
  z-index: 1000;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
}

.dropdown-menu.show {
  display: block;
}

textarea {
  resize: none;
}

.search,
.advanced {
  border: 1px solid gray;
}

/* Prevent dropdown from being too narrow */
.dropdown-menu {
  min-width: 400px;
}

/* Style for form elements in dropdown */
.dropdown-menu .form-label {
  margin-bottom: 0.25rem;
}

.dropdown-menu .form-control,
.dropdown-menu .form-select {
  font-size: 0.875rem;
}

/* Gap utility for older Bootstrap versions */
.gap-2 > * + * {
  margin-left: 0.5rem;
}

@media (max-width: 576px) {
  .dropdown-menu {
    min-width: 300px;
  }
  
  .gap-2 {
    flex-direction: column;
  }
  
  .gap-2 > * + * {
    margin-left: 0;
    margin-top: 0.5rem;
  }
}
</style>