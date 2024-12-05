<script setup lang="ts">
import HeaderView from "@/views/HeaderView.vue";
import SearchResults from "@/views/SearchResults.vue";
import {ref, onMounted, watch, computed} from "vue";
import {useSearchStore} from '@/store/searchStore';
import {useRoute} from "vue-router";

const route = useRoute();
const searchStore = useSearchStore();

const searchFilter = ref('');
const advancedSearchInput = computed(() => searchStore.dnaSequence);

onMounted(() => {
  searchFilter.value = route.query.q as string || '';
  // advancedSearchInput.value = searchStore.dnaSequence;
  // console.log('onMounted - searchFilter:', searchFilter.value);
  // console.log('onMounted - advancedSearchInput:', advancedSearchInput.value);
});

watch(
    () => route.query.q,
    (newQuery) => {
      searchFilter.value = newQuery as string || '';
      // console.log('watch - searchFilter:', searchFilter.value);
      // console.log('watch - advancedSearchInput:', advancedSearchInput.value);
    }
);

const handleClearDnaSequence = () => {
  searchStore.setDnaSequence('');
};
</script>

<template>
  <HeaderView @clear-dna-sequence="handleClearDnaSequence" />
  <div class="container">
    <SearchResults :filter="searchFilter" :dnaSequence="advancedSearchInput" @clear-dna-sequence="handleClearDnaSequence"/>
  </div>
</template>

<style scoped>

</style>
