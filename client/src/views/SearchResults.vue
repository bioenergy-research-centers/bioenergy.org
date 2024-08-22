<script setup lang="ts">
import DatasetDataService from "../services/DatasetDataService";
import {onBeforeMount, watch} from "vue";

let results: any = [];

onBeforeMount(() => {
  DatasetDataService.getAll()
      .then(response => {
        results = response.data;
      })
      .catch(e => {
        console.error(e);
      })
})

const props = defineProps({
  filter: String
})

watch(() => props.filter, (value) => {
  DatasetDataService.findByTitle(value).then(response => {
    results = response.data;
  })
})

</script>

<template>
  <div class="container-fluid">
    <div class="row pt-3">
      <div class="col">

        <div v-if="!results || !results.length">
          <i>No data available</i>
        </div>

        <table class="table table-responsive table-bordered" v-else>
          <thead>
          <tr>
            <th class="text-muted text-uppercase small">Date</th>
            <th class="text-muted text-uppercase small">Identifier</th>
            <th class="text-muted text-uppercase small">Title</th>
            <th class="text-muted text-uppercase small">BRC</th>
            <th class="text-muted text-uppercase small">Creator</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="datum in results">
            <td>{{ datum.date }}</td>
            <td>
              <a v-bind:href="datum.bibliographicCitation" target="_blank">{{ datum.identifier }}</a>
            </td>
            <td>
              <div class="text-truncate small">{{ datum.title }}</div>
            </td>
            <td>{{ datum.brc }}</td>
            <td class="small">
              {{ datum.creator[0].creatorName }}
              <div>{{ datum.creator[0].email }}</div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

</template>

<style scoped>

</style>
