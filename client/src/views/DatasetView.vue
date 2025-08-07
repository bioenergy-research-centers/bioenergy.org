<script setup lang="ts">
import HeaderView from "@/views/HeaderView.vue";
import SearchResults from "@/views/SearchResults.vue";
import {ref, onMounted, watch, computed} from "vue";
import {useSearchStore} from '@/store/searchStore';
import {useRoute} from "vue-router";

const route = useRoute();
const searchStore = useSearchStore();

const searchFilter = ref('');
const searchFilters = ref(''); // Add this for filters
const advancedSearchInput = computed(() => searchStore.dnaSequence);

onMounted(() => {
  searchFilter.value = route.query.q as string || '';
  searchFilters.value = route.query.filters as string || ''; // Add this
  console.log('onMounted - searchFilter:', searchFilter.value);
  console.log('onMounted - searchFilters:', searchFilters.value); // Add this
});

watch(
    () => route.query.q,
    (newQuery) => {
      searchFilter.value = newQuery as string || '';
      console.log('watch - searchFilter changed:', searchFilter.value);
    }
);

// Add watcher for filters
watch(
    () => route.query.filters,
    (newFilters) => {
      searchFilters.value = newFilters as string || '';
      console.log('watch - searchFilters changed:', searchFilters.value);
    }
);

const handleClearDnaSequence = () => {
  searchStore.setDnaSequence('');
};
</script>

<template>
  <HeaderView @clear-dna-sequence="handleClearDnaSequence" />
  <div class="container">
    <SearchResults 
      :filter="searchFilter" 
      :dnaSequence="advancedSearchInput" 
      :filters="searchFilters"
      @clear-dna-sequence="handleClearDnaSequence"
    />
  </div>
</template>

<style scoped>

</style>
