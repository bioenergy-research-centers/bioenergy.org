<script setup>
import {ref} from "vue";

const searchText = ref('')
let posts = ref([{}]);

import DatasetDataService from "../services/DatasetDataService";

const onSubmit = () => {
  DatasetDataService.findByTitle(searchText.value)
      .then(response => {
        posts.value = response.data;
        console.log(posts);
      })
      .catch(e => {
        console.log(e);
      });
}
</script>

<template>
  <div class="container-fluid" style="margin-top: 200px">
    <div class="row">
      <div class="offset-4 col-4 ">

        <form id="page-search-input" @submit.prevent="onSubmit">
          <div class="d-flex">
            <input class="form-control rounded-end-0" v-model="searchText">
            <button class="btn btn-primary rounded-start-0">Search</button>
          </div>
        </form>

      </div>
    </div>
    <div class="row pt-5">

      <div class="offset-4 col-4">
        <div class="small text-muted mt-5">Results</div>
        <hr class="link-underline">

        <div v-if="posts.length > 0">
          <ul class="list-group list-group-flush" id="list">
            <li v-for="post in posts" class="list-group-item">
              <h5>
                {{ post.title }}
              </h5>
              <div>
                {{ post.description }}
              </div>
            </li>
          </ul>
        </div>
        <div v-else>
          <i class="text-muted small">No results available</i>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>


</style>
