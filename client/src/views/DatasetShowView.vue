<script setup lang="ts">
import HeaderView from "@/views/HeaderView.vue";
import DatasetDataService from "../services/DatasetDataService";
import { resolveComponentVersion } from './datasets/versionComponentMap';
import { computed, ref, watch, watchEffect} from "vue"
import { useRouter, useRoute } from 'vue-router';

const route = useRoute();

const props = defineProps({
  id: String
});

const dataset = ref(null);
const datasetLoading = ref(true);
const datasetLoadError = ref(null);

watchEffect( async () => {
  console.log("DatasetShow id param - ",props.id)
  datasetLoadError.value = null
  datasetLoading.value = true
  if (!props.id) return
  try {
    const response = await DatasetDataService.get(props.id);
    dataset.value = response.data
  } catch (e) {
    datasetLoadError.value = e
  } finally {
    datasetLoading.value = false
  }
})

</script>

<template>
  <HeaderView />
  <div class="container">
    <div v-if="dataset && !loading">
      <div class="card mt-4">
        <div class="card-body">
          <component :is="resolveComponentVersion(dataset)"  :selectedResult="dataset"></component>
          <router-link to="/data" class="card-link btn btn-dark rounded-pill px-3 pe-4 fw-bold fs-5 mt-2"><i class="bi bi-arrow-right pe-3" aria-hidden="true"></i> Return</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>