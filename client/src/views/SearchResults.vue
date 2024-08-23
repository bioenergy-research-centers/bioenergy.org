<script setup lang="ts">
import DatasetDataService from "../services/DatasetDataService";
import {onBeforeMount, ref, watch} from "vue";

let results = ref([]);
let selectedResult = ref();

onBeforeMount(() => {
  DatasetDataService.getAll()
      .then(response => {
        results.value = response.data;
        if (response.data && response.data.length)
          selectedResult.value = results.value[0];
      })
      .catch(e => {
        console.error(e);
      })
})

// user clicks on a result in the left column
// updates the object whose details are being displayed in the right
const onSelectResult = (result: any) => {
  selectedResult.value = result;
}

const props = defineProps({
  filter: String
})

watch(() => props.filter, (value) => {
  DatasetDataService.findByTitle(value).then(response => {
    results.value = response.data;
  })
})

</script>

<template>

  <div class="page-container" v-if="results && results.length">
    <div class="left-column">

      <div class="fw-bold text-center small">{{ results.length }} results found</div>

      <div class="list-group">
        <a href="#" class="list-group-item d-flex justify-content-between list-group-item-action"
           v-for="result in results" :class="{'active': selectedResult.identifier === result.identifier}"
           @click="onSelectResult(result)">
          <div class="ms-2 me-auto">
            <div class="mb-2 fw-bold">{{ result.identifier }}</div>
            <div class="small">{{ result.title }}</div>
          </div>
          <small style="font-size: 0.75em">{{ result.date }}</small>
        </a>
      </div>

    </div>
    <div class="right-column">
      <h3>{{ selectedResult.title }}</h3>
      <div>
        More information at: <a v-bind:href="selectedResult.bibliographicCitation" target="_blank"
                                class="btn btn-primary btn-sm"><i class="bi bi-box-arrow-up-right"></i>
        {{ selectedResult.identifier }}</a>
      </div>

      <div class="mt-4">
        <b class="small">Date</b><br>
        {{ selectedResult.date }}
      </div>

      <div class="mt-4">
        <b class="small">Creator</b><br>
        <div>{{ selectedResult.creator[0].creatorName }}</div>
      </div>

      <div class="mt-4">
        <b class="small">BRC</b><br>
        <div>{{ selectedResult.brc }}</div>
      </div>

      <div class="mt-4">
        <b class="small">Repository</b><br>
        <div>{{ selectedResult.repository }}</div>
      </div>

      <div class="mt-4" v-if="selectedResult.analysisType">
        <b class="small">Analysis Type</b><br>
        <div>{{ selectedResult.analysisType }}</div>
      </div>

      <div class="mt-4">
        <b class="small">Description</b><br>
        {{ selectedResult.description }}
      </div>

      <div class="mt-4" v-if="selectedResult.keywords && selectedResult.keywords.length">
        <b class="small">Keywords</b><br>
        {{ Array.from(selectedResult.keywords).join(', ') }}
      </div>

      <div class="mt-4" v-if="selectedResult.species">
        <b class="small">Species</b><br>
        <div class="d-flex justify-content-start">

          <div v-for="species in selectedResult.species">
            <div class="me-5">
              <b class="fs-7 text-uppercase text-muted">Scientific Name: </b>{{ species.scientificName }}<br>
              <b class="fs-7 text-uppercase text-muted">NCBITaxID: </b>{{ species.NCBITaxID }}
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>

</template>

<style scoped>
body {
  margin: 0;
}

.page-container {
  display: flex;
  height: 100vh;
}

.left-column {
  width: 400px;
  overflow-y: scroll;
  padding: 20px;
}

.right-column {
  flex: 1;
  padding: 20px;
}

.fs-7 {
  font-size: 0.7em;
}

</style>
