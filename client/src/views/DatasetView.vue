<script setup>
import HeaderView from "@/views/HeaderView.vue";
import SearchResults from "@/views/SearchResults.vue";
import {ref, onMounted} from "vue";
import { useRoute } from 'vue-router'

const route = useRoute()

const searchFilter = ref('')

const onSearchChange = (value) => {
  searchFilter.value = value || '';
}

onMounted(() => {
  searchFilter.value = route.query.q || '';
})


</script>

<template>
  <HeaderView @searchFilterChange="onSearchChange" :searchText=searchFilter />
  <div class="container">
    <SearchResults :filter=searchFilter />
  </div>
  
</template>

<style scoped>

</style>
