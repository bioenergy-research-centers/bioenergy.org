<script setup lang="ts">
import HeaderView from "@/views/HeaderView.vue";
import SearchResults from "@/views/SearchResults.vue";
import {ref, onMounted, watch, computed} from "vue";
</script>

<template>
  <HeaderView/>
  <div class="container">
    <SearchResults />
  </div>
</template>

<style scoped>

</style>
