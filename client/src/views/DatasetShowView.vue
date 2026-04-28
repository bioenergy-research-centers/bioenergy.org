<script setup lang="ts">
import HeaderView from "@/views/HeaderView.vue";
import DatasetDataService from "../services/DatasetDataService";
import { resolveComponentVersion } from './datasets/versionComponentMap';
import { computed, ref, watch, watchEffect} from "vue"
import { useRouter, useRoute } from 'vue-router';
import {useSearchStore} from '@/store/searchStore';


const route = useRoute();
const searchStore = useSearchStore();

const props = defineProps({
  id: String
});

const dataset = ref(null);
const datasetLoading = ref(true);
const datasetLoadError = ref(null);

const relatedDatasets = ref([]);
const relatedDatasetsLoading = ref(false);
const relatedDatasetsError = ref(null);

watchEffect( async () => {
  console.log("DatasetShow id param - ",props.id);
  datasetLoadError.value = null;
  datasetLoading.value = true;
  relatedDatasets.value = [];
  relatedDatasetsError.value = null;

  if (!props.id) return;

  try {
    const response = await DatasetDataService.get(props.id);
    dataset.value = response.data;

    relatedDatasetsLoading.value = true;
    try {
      const lookupResponse = await DatasetDataService.lookup(props.id);
      relatedDatasets.value = (lookupResponse.data?.datasets || []).filter(
        (item: any) => !item.is_source
      );
    } catch (e) {
      relatedDatasetsError.value = e;
      relatedDatasets.value = [];
    } finally {
      relatedDatasetsLoading.value = false;
    }
  } catch (e) {
    datasetLoadError.value = e
  } finally {
    datasetLoading.value = false
  }
});

// Dynamically update document.title when dataset loads
watch(dataset, (newDataset) => {
  if (newDataset && newDataset.title) {
    document.title = `${newDataset.title} - Bioenergy.org`
  } else {
    document.title = 'Bioenergy.org'
  }
})


</script>

<template>
  <HeaderView />
  <main id="main-content" class="scroll-offset">
    <div class="container">
      <div v-if="dataset && !datasetLoading">
        <div class="card mt-4">
          <div class="card-body">
            <div v-if="relatedDatasets.length > 0" class="mb-3 small">
              <span class="text-muted">This dataset is also catalogued as:</span>
              <span v-for="(item, index) in relatedDatasets" :key="item.uid">
                <span v-if="index > 0">, </span>
                <router-link :to="{ name: 'datasetShow', params: { id: item.uid } }">
                  {{ item.uid }}
                </router-link>
              </span>
            </div>

            <component :is="resolveComponentVersion(dataset)"  :selectedResult="dataset"></component>
            <router-link
              :to="{ name: 'datasetSearch', query: searchStore.lastSearchQuery }"
              class="card-link btn btn-dark rounded-pill px-3 pe-4 fw-bold fs-5 mt-2"
            >
              <i class="bi bi-arrow-left pe-3" aria-hidden="true"></i> Return
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
</style>