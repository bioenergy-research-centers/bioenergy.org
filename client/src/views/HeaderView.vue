<script setup lang="ts">
import {RouterLink, useRoute, useRouter} from "vue-router";
import headerIcon from "@/assets/brc-bioenergy-icon.png"
import {onBeforeMount, ref, watch, onMounted} from "vue"; // Fixed import
import {useSearchStore} from '@/store/searchStore';

const docs_link = import.meta.env.VITE_BIOENERGY_ORG_API_URI + "/api-docs";

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

        

      </div>
      <div class="row mt-2">
        <hr>
        <div class="col-12 text-center">
          <router-link :to="{ name: 'dataHome'}" class="small text-muted me-3">
            Data Overview
          </router-link>
          <router-link :to="{ name: 'datasetSearch'}" class="small text-muted me-3">
            Search
          </router-link>
          <router-link :to="{ name: 'contact'}" class=" small text-muted me-3">
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
