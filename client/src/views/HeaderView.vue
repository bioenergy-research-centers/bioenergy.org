<script setup lang="ts">
import {RouterLink, useRoute, useRouter} from "vue-router";
import headerIcon from "@/assets/brc-bioenergy-icon.png"
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

const clearAll = () => {
  clearSequence();
  clearAdvancedFilters();
  searchText.value = '';
};

const onSubmit = () => {
  // save sequence to the store
  searchStore.setDnaSequence(dnaSequence.value);

  // navigate to /data with search text in the URL
  router.push({
    path: '/data',
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
  
  // Navigate to /data with search text and filters
  router.push({
    path: '/data',
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
  <header class="sticky-sm-top p-3 shadow-sm bg-white">
    <div class="container">
      <div class="row">
        <div class="col-md-12 col-lg-6">
          <router-link to="/" class="navbar-brand">
            <img :src="headerIcon" alt="" width="66" height="72" class="d-inline-block align-text-bottom">
            Bioenergy.org
          </router-link>
        </div>

        <div class="col-md-12 col-lg-6 d-flex align-items-center">
          <form @submit.prevent="onSubmit" class="flex-grow-1">
            <div class="input-group">
              <!-- Main Search Input -->
              <input class="form-control" placeholder="Search bioenergy.org" v-model="searchText"/>
              <button type="submit" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-search text-muted"></i>
              </button>

              <!-- Advanced Search Dropdown Toggle -->
              <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown"
                      aria-expanded="false">
                Advanced
              </button>

              <!-- Advanced Search Dropdown -->
              <ul class="dropdown-menu p-3" @click="preventDropdownClose">
                <!-- DNA Sequence Section -->
                <li class="mb-3">
                  <label class="form-label small fw-bold text-muted">DNA Sequence</label>
                  <textarea class="form-control" rows="3" placeholder="Enter sequence..."
                            v-model="dnaSequence"></textarea>
                </li>
                
                <!-- Divider -->
                <li><hr class="dropdown-divider"></li>
                
                <!-- Advanced Filters Section -->
                <li class="mb-3">
                  <label class="form-label small fw-bold text-muted">Filter by Fields</label>
                  
                  <!-- BRC Filter -->
                  <div class="mb-2">
                    <label class="form-label small">Bioenergy Research Center (BRC)</label>
                    <select class="form-select form-select-sm" v-model="advancedFilters.brc">
                      <option value="">Any BRC</option>
                      <option value="JBEI">JBEI</option>
                      <option value="GLBRC">GLBRC</option>
                      <option value="CABBI">CABBI</option>
                      <option value="CBI">CBI</option>
                    </select>
                  </div>
                  
                  <!-- Repository Filter -->
                  <div class="mb-2">
                    <label class="form-label small">Repository</label>
                    <input type="text" class="form-control form-control-sm" 
                          placeholder="e.g., ICE, Illinois Data Bank, NCBI" 
                          v-model="advancedFilters.repository">
                  </div>
                  <!-- Species Filter -->
                  <div class="mb-2">
                    <label class="form-label small">Species</label>
                    <input type="text" class="form-control form-control-sm" 
                           placeholder="e.g., E. coli, Sorghum bicolor" 
                           v-model="advancedFilters.species">
                  </div>
                  
                  <!-- Analysis Type Filter -->
                  <div class="mb-2">
                    <label class="form-label small">Analysis Type</label>
                    <input type="text" class="form-control form-control-sm" 
                           placeholder="e.g., Genomic, Code" 
                           v-model="advancedFilters.analysisType">
                  </div>

                  <div class="mb-2">
                    <label class="form-label small">Person Name</label>
                    <input type="text" class="form-control form-control-sm" 
                          placeholder="e.g., Jane Doe" 
                          v-model="advancedFilters.personName">
                    <small class="form-text text-muted">Searches both creators and contributors</small>
                  </div>
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
                    <button type="button" class="btn btn-sm btn-outline-secondary" @click="clearAdvancedFilters">
                      Clear Filters
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="clearAll">
                      Clear All
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </form>
        </div>

      </div>
      <div class="row mt-2">
        <hr>
        <div class="col-12 text-center">
          <router-link to="/data" class="small text-muted me-3">
            Datasets
          </router-link>
          <router-link to="/contact" class=" small text-muted me-3">
            Contact
          </router-link>
          <a :href="docs_link" class="small text-muted" target="_blank" rel="noopener noreferrer">API Docs</a>
        </div>
      </div>
    </div>
  </header>
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
