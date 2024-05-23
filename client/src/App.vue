<script setup>
  import { RouterLink, RouterView } from 'vue-router'
</script>

<script>
// export default {
//   name: "app"
// };
</script>

<template>
  <div id="app">
    <nav class="navbar navbar-expand-md navbar-light bg-light">
      <router-link to="/" class="navbar-brand">Bioenergy.org</router-link>
      <div class="navbar-nav mr-auto">
        <li class="nav-item">
          <router-link to="/" class="nav-link">Home</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/datasets" class="nav-link">Datasets</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/about" class="nav-link">About</router-link>
        </li>
        <li class="nav-item">
          <a href="<%= BIOENERGY_ORG_API_URI %>/api-docs" class="nav-link" target="_blank">API Docs</a>
        </li>
      </div>
    </nav>

    <div class="container mt-3">
      <router-view />
    </div>
  </div>
</template>
