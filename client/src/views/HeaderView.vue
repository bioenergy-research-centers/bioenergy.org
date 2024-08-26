<script setup>
import {RouterLink} from "vue-router";
import headerIcon from "@/assets/brc-bioenergy-icon.png"

const emit = defineEmits(['searchFilterChange']);

const docs_link = import.meta.env.VITE_BIOENERGY_ORG_API_URI + "/api-docs";

const onSearchInput = (event) => {
  emit('searchFilterChange', event.target.value);
}

// searchText is the default search field value provided by parent component
const props = defineProps({
  searchText: String
})

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
          <form action="/data" id="page-search-input" class="flex-grow-1">
            <div class="input-group">
              <input name='q' class="form-control form-control-sm"
                     placeholder="Search Bioenergy.org" :value="searchText" @input="onSearchInput">
              <button type='submit' class="btn btn-sm btn-outline-secondary"><i class="bi bi-search text-muted"></i>
              </button>
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
          <!-- <div class=""> -->
            <a :href="docs_link" class="small text-muted" target="_blank">API Docs</a>
          <!-- </div> -->

        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>

</style>
