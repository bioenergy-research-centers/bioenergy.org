<script setup>
import {RouterLink} from "vue-router";

const docs_link = import.meta.env.VITE_BIOENERGY_ORG_API_URI + "/api-docs";
</script>

<template>
  <header class="sticky-sm-top p-3 shadow-sm bg-white">
    <div class="container">
      <div class="row">
        <div class="col-2">
          <router-link to="/" class="navbar-brand fw-bold fs-4">Bioenergy.org</router-link>
        </div>
        <div class="col">

        </div>
        <div class="col-1">
          <a :href="docs_link" class="nav-link small text-muted" target="_blank">API Docs</a>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>

</style>
