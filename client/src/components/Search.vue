<script setup lang="ts">
import {RouterLink, useRoute, useRouter} from "vue-router";
import {onBeforeMount, ref, watch, onMounted} from "vue"; // Fixed import
import {applySearchToURL, useSearchStore} from '@/store/searchStore';

const router = useRouter();
const route = useRoute();
const searchStore = useSearchStore();

const clearAll = () => {
  searchStore.clearSearchData();
    searchStore.runSearch();
};

const onSubmit = () => {
    searchStore.runSearch();
};

const preventDropdownClose = (event) => {
  event.stopPropagation();
};

</script>

<template>
  <form @submit.prevent="onSubmit">
    <div class="row">
      <div class="col-12">
        <div class="input-group">
          <!-- Main Search Input -->
          <label for="main-search-input" class="visually-hidden">Search Datasets</label>
          <input id="main-search-input" class="form-control" placeholder="Search bioenergy.org datasets" v-model.lazy="searchStore.searchTerm"/>
          <button type="submit" class="btn btn-sm btn-light search">
            <span>Search Datasets</span>
            <i class="bi bi-search ms-2"></i>
          </button>
          
          <!-- Advanced Search Dropdown Toggle -->
          <button type="button" class="btn btn-sm btn-light dropdown-toggle advanced" data-bs-toggle="dropdown"
                  aria-expanded="false">
            <span class="visually-hidden">Advanced</span>
          </button>
          
          <!-- Advanced Search Dropdown -->
          <ul class="dropdown-menu p-3" @click="preventDropdownClose">
            <!-- DNA Sequence Section -->
            <li class="mb-3">
              <label class="form-label small fw-bold text-muted" for="dna">DNA Sequence</label>
              <textarea class="form-control" rows="3" placeholder="Enter sequence..." v-model.lazy="searchStore.dnaSequence" id="dna"></textarea>
            </li>
            <!-- Action Buttons -->
            <li class="mt-3">
              <div class="d-flex gap-2 flex-wrap">
                <button type="button" class="btn btn-sm btn-primary" @click="onSubmit">
                  <i class="bi bi-search"></i> Search
                </button>
                <!-- <button type="submit" class="btn btn-sm btn-outline-primary" v-if="searchStore.dnaSequence?.trim()">
                  <i class="bi bi-dna"></i> Sequence Search
                </button> -->
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