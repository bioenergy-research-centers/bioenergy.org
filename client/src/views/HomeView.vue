<script setup lang="ts">
import HeaderView from "@/views/HeaderView.vue";
import SearchResults from "@/views/SearchResults.vue";
import {ref} from "vue";

let searchFilter = ref('')

const onSearchChange = (value: string) => {
  searchFilter.value = value;
}

</script>

<template>
  <HeaderView @searchFilterChange="onSearchChange"/>
  <SearchResults :filter=searchFilter />
</template>

<style scoped>

</style>
