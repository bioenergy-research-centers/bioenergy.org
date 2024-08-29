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
  DatasetDataService.findByParams({fulltext: value}).then(response => {
    results.value = response.data;
    selectedResult.value = results.value[0]
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
        <div class="small text-uppercase mt-5 fw-bold">Date</div>
        {{ selectedResult.date }}
      </div>

      <div class="mt-4">
        <div class="small text-uppercase mt-5 fw-bold">Creator</div>
        <div>{{ selectedResult.creator[0].creatorName }}</div>
      </div>

      <div class="mt-4">
        <div class="small text-uppercase mt-5 fw-bold">BRC</div>
        <div>{{ selectedResult.brc }}</div>
      </div>

      <div class="mt-4">
        <div class="small text-uppercase mt-5 fw-bold">Repository</div>
        <div>{{ selectedResult.repository }}</div>
      </div>

      <div class="mt-4" v-if="selectedResult.analysisType">
        <div class="small text-uppercase mt-5 fw-bold">Analysis Type</div>
        <div>{{ selectedResult.analysisType }}</div>
      </div>

      <div class="mt-4" v-if="selectedResult.description">
        <div class="small text-uppercase mt-5 fw-bold">Description</div>
        {{ selectedResult.description }}
      </div>

      <div class="mt-4" v-if="selectedResult.keywords && selectedResult.keywords.length">
        <div class="small text-uppercase mt-5 fw-bold">Keywords</div>
        {{ Array.from(selectedResult.keywords).join(', ') }}
      </div>

      <div class="mt-4" v-if="selectedResult.species">
        <div class="small text-uppercase mt-5 fw-bold">Species</div>
        <div class="d-flex justify-content-start">

          <div v-for="species in selectedResult.species">
            <div class="me-5">
              <b class="fs-7 text-uppercase text-muted">Scientific Name: </b>{{ species.scientificName }}<br>
              <b class="fs-7 text-uppercase text-muted">NCBITaxID: </b>{{ species.NCBITaxID }}
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4" v-if="selectedResult.relatedItem">
        <div class="small text-uppercase mt-5 fw-bold">Related Item</div>
        <div class="text-muted italic fw-bold"> {{test.relatedItemType}} <i class="bi bi-box-arrow-up-right"></i></div>
        <a v-bind:href="test.relatedItemIdentifier" target="_blank">{{test.title}}</a>
      </div>

    </div>
  </div>

  <div class="page-container" v-else>
    <div class="left-column">
      <div class="fw-bold text-center small">0 results found</div>
    </div>
    <div class="right-column">
      <div class="fw-bold large"> Uh oh! Your search did not match any records. Please refine your query and try again.</div>
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
  overflow-x: scroll;
}

.left-column {
  min-width: 300px;
  width: 400px;
  overflow-y: scroll;
  padding: 20px;
}

.right-column {
  min-width: 600px;
  flex: 1;
  padding: 20px;
}

.fs-7 {
  font-size: 0.7em;
}

</style>
