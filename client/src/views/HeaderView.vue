<script setup>
import {RouterLink} from "vue-router";
import {ref} from "vue";
const emit = defineEmits(['searchFilterChange']);

const docs_link = import.meta.env.VITE_BIOENERGY_ORG_API_URI + "/api-docs";
const searchText = ref('')

const onSubmit = () => {
  emit('searchFilterChange', searchText.value);
}
</script>

<template>
  <header class="sticky-sm-top p-3 shadow-sm bg-white">
    <div class="container-fluid">
      <div class="row">
        <div class="col-4">
          <router-link to="/" class="navbar-brand fw-bold fs-4">Bioenergy.org</router-link>
        </div>

        <div class="col-4">
          <form id="page-search-input" @submit.prevent="onSubmit">
            <div class="input-group">
              <input class="form-control form-control-sm rounded-end-0 border-end-0"
                     placeholder="Start typing to filter..." v-model="searchText" @input="onSubmit">
              <button class="btn btn-sm rounded-start-0 border-start-0 border"><i class="bi bi-filter text-muted"></i>
              </button>
            </div>
          </form>
        </div>

        <div class="col-4">
          <div class="float-end">
            <a :href="docs_link" class="nav-link small text-muted" target="_blank">API Docs</a>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>

</style>
