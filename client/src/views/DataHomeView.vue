<script setup lang="ts">
import HeaderView from "@/views/HeaderView.vue";
import Search from '@/components/Search.vue';
import AuthorList from '@/components/AuthorList.vue';
import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import DatasetDataService from "../services/DatasetDataService";
import sanitizeHtml from 'sanitize-html';
import { useSearchStore } from '@/store/searchStore';

const docs_link = import.meta.env.VITE_BIOENERGY_ORG_API_URI + "/api-docs";

const imgUrls = import.meta.glob('../assets/*.png', {
  import: 'default',
  eager: true
})
const route = useRoute()
const searchStore = useSearchStore();

const recentDatasets = ref([])
const recentDataLoading = ref(false)
const error = ref(null)
const dataMetrics = ref(null)
const metricsLoading = ref(false)

async function loadRecentData() {
  recentDataLoading.value = true
  error.value = null
  try {
    // Todo replace with query for distinct values
    ['CABBI','CBI','GLBRC','JBEI'].forEach(async function(brc){
      const res = await DatasetDataService.getAll( { rows: 1, filters: {brc: brc}, nofacets: true} );
      recentDatasets.value.push(...res.data.items)
    })
  } catch (e) {
    if (e.name !== 'AbortError') error.value = e.message || String(e)
  } finally {
    recentDataLoading.value = false
  }
}

const orderedRecentData = computed(() => {
  return [...recentDatasets.value].sort((a, b) => {
    const aDate = new Date(a.date)
    const bDate = new Date(b.date)
    return bDate - aDate
  })
})

async function loadDataMetrics() {
  metricsLoading.value = true
  error.value = null
  try {
    const res = await DatasetDataService.getMetrics();
    dataMetrics.value = res.data
  } catch (e) {
    if (e.name !== 'AbortError') error.value = e.message || String(e)
  } finally {
    metricsLoading.value = false
  }
}

// run on first mount
onMounted(() => {
  loadRecentData();
  loadDataMetrics();
})

// TODO - move to util method
const truncateMiddle = (str, maxStart = 100, maxEnd = 50) => {
  if (str.length <= maxStart + maxEnd) return str;
  return str.slice(0, maxStart) + "…" + str.slice(-maxEnd);
}

const suggestedQuery = 'switchgrass or isoprenol';

const applySuggestedQuery = () => {
  searchStore.searchTerm = suggestedQuery;
};

</script>

<template>
  <HeaderView />
  <div class="container">
    <div class="row">
      <div class="col-12 lead page-heading">
        <h2>
          A collaborative information platform brought to you by the four US Department of Energy funded
        <a href="https://www.genomicscience.energy.gov/bioenergy-research-centers/" class="" target="_blank" rel="noopener noreferrer">
        Bioenergy Research Centers
        </a>
        </h2>
      </div>
      <div class="col-sm-12 col-md-9">
        <div>
          <p class="lead">
            The Bioenergy Research Centers (BRCs) work across diverse scientific disciplines
            that produce an extensive collection of datasets. These datasets include plant and
            biomass analytics, genomic sequencing, genetic engineering, proteomics, metabolomics,
            phenomics, atmospheric and soil measurements, and economic and TEA/LCA models and many
            others that span the nearly 20 year period of the BRCs existence. This portal aims to
            provide a single location to find and access these important BRC-generated datasets.
          </p>
          <p class="lead">
            How do I use this site?
          </p>
          <p>
            Use the graphs and search tools to discover the breadth of data available and access published datasets.
            Enter Keywords in the search bar to find specific datasets or click on a section of a
            graph to display datasets meeting those criteria, which allows further exploration.
            See the <a :href="docs_link" target="_blank" rel="noopener noreferrer">API Docs</a> for additional options.
          </p>
          <p>
            To access a dataset click on the large “Access Dataset” button. This will
            open a new browser tab in the repository where the dataset is stored and allow you to download its
            contents. Note, some repositories will require you to create a login to access or download data.
          </p>
          <p class="lead">
            Try searching for "{{ suggestedQuery }}" to get started!
            <button type="button" class="btn btn-outline-primary btn-sm" @click="applySuggestedQuery()">
              Apply Query
            </button>
          </p>
        </div>
      </div>
      <div class="d-md-block col-md-3">
        <div class="right-sidebar">
          <div class="row">

            <div class="col-12 mb-3">
              <div class="d-flex align-items-center">
                <i class="bi bi-database display-3 me-4" style="font-size:4rem"></i>
                <div class="d-flex flex-column justify-content-center">
                  <span v-if="dataMetrics" class="fs-3 fw-bold lh-1">{{ dataMetrics.totalDatasets }}</span>
                  <span class="text-muted lh-1">Published Datasets</span>
                </div>
              </div>
            </div>

            <div class="col-12 mb-3">
              <div class="d-flex align-items-center">
                <i class="bi bi-person display-3 me-4" style="font-size:4rem"></i>
                <div class="d-flex flex-column justify-content-center">
                  <span v-if="dataMetrics" class="fs-3 fw-bold lh-1">{{ dataMetrics.totalPrimaryCreators }}</span>
                  <span class="text-muted lh-1">Contributors</span>
                </div>
              </div>
            </div>
            <div class="col-12 mb-3">              
              <div class="d-flex align-items-center">
                <i class="bi bi-flower3 display-3 me-4" style="font-size:4rem"></i>
                <div class="d-flex flex-column justify-content-center">
                  <span v-if="dataMetrics" class="fs-3 fw-bold lh-1">{{ dataMetrics.totalTaxIds }}</span>
                  <span class="text-muted lh-1">Unique Species</span>
                </div>
              </div>
            </div>
            <div class="col-12 mb-3">              
              <div class="d-flex align-items-center">
                <i class="bi bi-house-door display-3 me-4" style="font-size:4rem"></i>
                <div class="d-flex flex-column justify-content-center">
                  <span v-if="dataMetrics" class="fs-3 fw-bold lh-1">{{ dataMetrics.repositoryCounts }}</span>
                  <span class="text-muted lh-1">Repositories</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 mt-4 search-section">
        <div class="search-form">
          <search />
        </div>
        <span> - OR -</span>
        <router-link :to="{ name: 'datasetSearch'}" class="px-3 btn btn-primary fw-bold fs-5"><i
            class="bi bi-arrow-right pe-3" aria-hidden="true"></i> Browse All Datasets</router-link>
      </div>
    </div>

    <div class="row mt-5">
      <div class="col-12">
        <h2>Recent Datasets</h2>

        <div class="list-group">
          <div class="list-group-item mt-3" v-for="result in orderedRecentData" :key="result.uid">
            <div class="list-group-item-content py-2">

              <div class="row">
                <div class="col-md order-md-1 fs-6 fw-bold order-1">
                  <router-link :to="{ name: 'datasetShow', params: { id: result.uid } }" class="pe-4">
                    <span
                      v-html="sanitizeHtml(truncateMiddle(result.title || 'No Title Provided', 75, 50), ALLOWED_HTML)"></span>
                  </router-link>
                </div>
              </div>

              <div class="row">
                <div class="fs-6 fw-light">
                  <AuthorList :creators="result.creator" />
                </div>
              </div>

              <div class="row mt-2">
                <div class="col-12 col-md">
                  <p><small
                      v-html="sanitizeHtml(truncateMiddle(result.description || '', 150, 75), ALLOWED_HTML)"></small>
                  </p>
                </div>
              
                <div class="col-12 col-md-auto text-md-end ps-md-3">
                  <div
                    class="d-inline-flex flex-row-reverse flex-md-row flex-wrap gap-1 justify-content-start justify-content-md-end">
                    <!-- <span class="badge bg-light text-muted">{{ result.repository }}</span> -->
                    <!-- <span class="badge bg-brc-light-blue text-muted">{{ result.date }}</span> -->
                    <div class="brc-tag">
                      <img :src="imgUrls[`../assets/${result.brc?.toLowerCase()}-logo.png`]" style="max-width:200px;" :alt="`${result.brc.toLowerCase()} logo`">
                    </div>
                  </div>
                </div>
              </div>

              <div class="row mt-1 fs-6">
                <div class="col-12 col-md">
                  <!-- <span class="text-muted fw-lighter">{{ result.analysisType }}</span> -->
                   <span class="badge text-muted">{{ result.date }}</span>
                </div>
                
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  
  </div>


</template>

<style scoped>

.right-sidebar {
  padding: 0 0 10px 0;
  margin-top: 20px;
  min-height: 100%
}
@media (min-width: 768px) {
  .right-sidebar {
    border-left: 1px solid #ddd;
    margin-top: 0;
    padding: 0 0 10px 20px;
  } 
}
.text-accent {
  color: #4C8D87;
  border-color: #4C8D87;
}
.brc-listing .intro {
  color: #72a530;
}
.brc-listing .intro a {
  color: #72a530;
}
.brc-listing hr {
  color: #599D0E;
  background-color: #599D0E;
  height: 3px;
  border:none;
  opacity: .8;
}
.callout {
  background-color: #0d6efd;
  border-radius: 5px;
  margin: 0 0 40px;
  padding: 20px 0 10px 20px;
}
.brc-tag {
  /* background-color: #4C8D87; */
  border-radius: 5px;
  padding: 5px;
}
.search-section {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 1rem;
}
.search-form {
	flex: 1 1 300px;
	max-width: 600px;
}
</style>
