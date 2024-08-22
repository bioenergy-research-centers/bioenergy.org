<script setup>

import {ref} from "vue";

let data = ref([{}]);
</script>

<template>
  <div class="container-fluid">

    <div class="row pt-5">
      <div class="col">

        <table class="table table-responsive table-bordered">
          <thead>
          <tr>
            <th class="text-muted text-uppercase small">Date</th>
            <th class="text-muted text-uppercase small">Title</th>
            <th class="text-muted text-uppercase small">BRC</th>
            <th class="text-muted text-uppercase small">Creator</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="datum in data">
            <td>{{ datum.Date }}</td>
            <td>
              <div class="text-truncate small">{{ datum.Title }}</div>
            </td>
            <td>{{ datum.BRC }}</td>
            <td class="small">
              {{ datum.Creator[0].creatorName }}
              <div>{{datum.Creator[0].Email}}</div>
            </td>
          </tr>
          </tbody>
        </table>

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

<!--      <div class="offset-4 col-4">-->
<!--        <div class="small text-muted mt-5">Results</div>-->
<!--        <hr class="link-underline">-->

<!--        <div v-if="posts && posts.length > 0">-->
<!--          <ul class="list-group list-group-flush" id="list">-->
<!--            <li v-for="post in posts" class="list-group-item">-->
<!--              <h5>-->
<!--                {{ post.title }}-->
<!--              </h5>-->
<!--              <div>-->
<!--                {{ post.description }}-->
<!--              </div>-->
<!--            </li>-->
<!--          </ul>-->
<!--        </div>-->
<!--        <div v-else>-->
<!--          <i class="text-muted small">No results available</i>-->
<!--        </div>-->
<!--      </div>-->
    </div>
  </div>
</template>

<style scoped>


</style>
