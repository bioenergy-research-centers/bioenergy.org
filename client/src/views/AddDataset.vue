<template>
  <div class="submit-form">
    <div v-if="!submitted">
      <div class="form-group">
        <label for="title">Title</label>
        <input
          type="text"
          class="form-control"
          id="title"
          required
          v-model="dataset.title"
          name="title"
        />
      </div>

      <div class="form-group">
        <label for="description">Description</label>
        <input
          class="form-control"
          id="description"
          required
          v-model="dataset.description"
          name="description"
        />
      </div>

      <button @click="saveDataset" class="btn btn-success">Submit</button>
    </div>

    <div v-else>
      <h4>You submitted successfully!</h4>
      <button class="btn btn-success" @click="newDataset">Add</button>
    </div>
  </div>
</template>

<script>
import DatasetDataService from "../services/DatasetDataService";

export default {
  name: "add-dataset",
  data() {
    return {
      dataset: {
        id: null,
        title: "",
        description: "",
        published: false
      },
      submitted: false
    };
  },
  methods: {
    saveDataset() {
      var data = {
        title: this.dataset.title,
        description: this.dataset.description
      };

      DatasetDataService.create(data)
        .then(response => {
          this.dataset.id = response.data.id;
          console.log(response.data);
          this.submitted = true;
        })
        .catch(e => {
          console.log(e);
        });
    },
    
    newDataset() {
      this.submitted = false;
      this.dataset = {};
    }
  }
};
</script>

<style>
.submit-form {
  max-width: 300px;
  margin: auto;
}
</style>
