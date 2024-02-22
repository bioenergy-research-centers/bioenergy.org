<template>
  <div class="list row">
    <div class="col-md-8">
      <div class="input-group mb-3">
        <input type="text" class="form-control" placeholder="Search by title"
          v-model="title"/>
        <div class="input-group-append">
          <button class="btn btn-outline-secondary" type="button"
            @click="searchTitle"
          >
            Search
          </button>
        </div>
      </div>
    </div>
    <div class="col-md-6">
      <h4>Datasets List</h4>
      <ul class="list-group">
        <li class="list-group-item"
          :class="{ active: index == currentIndex }"
          v-for="(dataset, index) in datasets"
          :key="index"
          @click="setActiveDataset(dataset, index)"
        >
          {{ dataset.title }}
        </li>
      </ul>

      <button class="m-3 btn btn-sm btn-danger" @click="removeAllDatasets">
        Remove All
      </button>
    </div>
    <div class="col-md-6">
      <div v-if="currentDataset">
          <h4>Dataset</h4>
          <div>
            <label><strong>Title:</strong></label> {{ currentDataset.title }}
          </div>
          <div>
            <label><strong>Description:</strong></label> {{ currentDataset.description }}
          </div>
          <div>
            <label><strong>Status:</strong></label> {{ currentDataset.published ? "Published" : "Pending" }}
          </div>

          <router-link :to="'/datasets/' + currentDataset.id" class="btn btn-warning">Edit</router-link>

      </div>
      <div v-else>
        <br />
        <p>Please click on a Dataset...from list</p>
      </div>
    </div>
  </div>
</template>

<script>
import DatasetDataService from "../services/DatasetDataService";

export default {
  name: "datasets-list",
  data() {
    return {
      datasets: [],
      currentDataset: null,
      currentIndex: -1,
      title: ""
    };
  },
  methods: {
    retrieveDatasets() {
      DatasetDataService.getAll()
        .then(response => {
          this.datasets = response.data;
          console.log(response.data);
        })
        .catch(e => {
          console.log(e);
        });
    },

    refreshList() {
      this.retrieveDatasets();
      this.currentDataset = null;
      this.currentIndex = -1;
    },

    setActiveDataset(dataset, index) {
      this.currentDataset = dataset;
      this.currentIndex = dataset ? index : -1;
    },

    removeAllDatasets() {
      DatasetDataService.deleteAll()
        .then(response => {
          console.log(response.data);
          this.refreshList();
        })
        .catch(e => {
          console.log(e);
        });
    },
    
    searchTitle() {
      DatasetDataService.findByTitle(this.title)
        .then(response => {
          this.datasets = response.data;
          this.setActiveDataset(null);
          console.log(response.data);
        })
        .catch(e => {
          console.log(e);
        });
    }
  },
  mounted() {
    this.retrieveDatasets();
  }
};
</script>

<style>
.list {
  text-align: left;
  max-width: 750px;
  margin: auto;
}
</style>
