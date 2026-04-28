<script setup lang="ts">
import HeaderView from "@/views/HeaderView.vue";
import SearchResults from "@/views/SearchResults.vue";
import {ref, onMounted, watch, computed} from "vue";
</script>

<template>
  <HeaderView/>
  <main id="main-content" class="scroll-offset">
    <div class="container">
      <SearchResults />
    </div>
  </main>
</template>

<style scoped>

</style>
