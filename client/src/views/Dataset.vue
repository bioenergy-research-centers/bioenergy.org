<template>
  <div v-if="currentDataset" class="edit-form">
    <h4>Dataset</h4>
    <form>
      <div class="form-group">
        <label for="title">Title</label>
        <input type="text" class="form-control" id="title"
          v-model="currentDataset.title"
        />
      </div>
      <div class="form-group">
        <label for="description">Description</label>
        <input type="text" class="form-control" id="description"
          v-model="currentDataset.description"
        />
      </div>

      <div class="form-group">
        <label><strong>Status:</strong></label>
        {{ currentDataset.published ? "Published" : "Pending" }}
      </div>
    </form>

    <button class="btn btn-primary mr-2"
      v-if="currentDataset.published"
      @click="updatePublished(false)"
    >
      UnPublish
    </button>
    <button v-else class="btn btn-primary mr-2"
      @click="updatePublished(true)"
    >
      Publish
    </button>

    <button class="btn btn-danger mr-2"
      @click="deleteDataset"
    >
      Delete
    </button>

    <button type="submit" class="btn btn-success"
      @click="updateDataset"
    >
      Update
    </button>

    <router-link to="/datasets" class="btn btn-outline-dark">
      Back to Listing
    </router-link>
    <p>{{ message }}</p>
  </div>

  <div v-else>
    <br />
    <p>Please click on a Dataset...for details</p>
  </div>
</template>

<script>
import DatasetDataService from "../services/DatasetDataService";

export default {
  name: "dataset",
  data() {
    return {
      currentDataset: null,
      message: ''
    };
  },
  methods: {
    getDataset(id) {
      DatasetDataService.get(id)
        .then(response => {
          this.currentDataset = response.data;
          console.log(response.data);
        })
        .catch(e => {
          console.log(e);
        });
    },

    updatePublished(status) {
      var data = {
        id: this.currentDataset.id,
        title: this.currentDataset.title,
        description: this.currentDataset.description,
        published: status
      };

      DatasetDataService.update(this.currentDataset.id, data)
        .then(response => {
          console.log(response.data);
          this.currentDataset.published = status;
          this.message = 'The status was updated successfully!';
        })
        .catch(e => {
          console.log(e);
        });
    },

    updateDataset() {
      DatasetDataService.update(this.currentDataset.id, this.currentDataset)
        .then(response => {
          console.log(response.data);
          this.message = 'The dataset was updated successfully!';
        })
        .catch(e => {
          console.log(e);
        });
    },

    deleteDataset() {
      DatasetDataService.delete(this.currentDataset.id)
        .then(response => {
          console.log(response.data);
          this.$router.push({ name: "datasets" });
        })
        .catch(e => {
          console.log(e);
        });
    }
  },
  mounted() {
    this.message = '';
    this.getDataset(this.$route.params.id);
  }
};
</script>

<style>
.edit-form {
  max-width: 500px;
  margin: auto;
}
.btn {
  margin-left: 1em
}
</style>
