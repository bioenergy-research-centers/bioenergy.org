<script setup lang="ts">
import HeaderView from "@/views/HeaderView.vue";
import Search from '@/components/Search.vue';
import AuthorList from '@/components/AuthorList.vue';
import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import DatasetDataService from "../services/DatasetDataService";
import sanitizeHtml from 'sanitize-html';
import { useSearchStore } from '@/store/searchStore';

import speciesIcon from "@/assets/species-icon.png"
import feedstockIcon from "@/assets/feedstock-development-icon.svg"
import deconstructionIcon from "@/assets/deconstruction-icon.svg"
import conversionIcon from "@/assets/conversion-icon.svg"
import sustainabilityIcon from "@/assets/sustainability-icon.svg"
import repoImage from "@/assets/repo-logos.png"

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
  <!-- New homepage code -->
  <section class="py-4 herospace">
    <div class="container">
      <h2 class="subtitle fw-bold">Your Portal to Bioenergy Research Data</h2>
      
      <p class="py-3">This portal serves as a centralized point for Bioenergy Research Center-generated datasets to improve findability and accessibility including support for artificial intelligence development and computational analysis.
      </p>
      
      <div class="search-form">
        <search />
        <router-link :to="{ name: 'datasetSearch'}" class="browse-all">Browse All Datasets
          <i class="bi bi-arrow-right pe-3" aria-hidden="true"></i>
        </router-link>
      </div>
      
      <!-- Metrics -->
      <div class="row my-3">
        <div class="col-12 col-md-3">
          <div class="d-flex align-items-center p-3 border border-light rounded">
            <i class="bi bi-database display-4"></i>
            <div class="d-flex flex-column justify-content-center">
              <span v-if="dataMetrics" class="fs-3 fw-bold lh-1">{{ dataMetrics.totalDatasets }}</span>
              <span>Published Datasets</span>
            </div>
          </div>
        </div>
        
        <div class="col-12 col-md-3">
          <div class="d-flex align-items-center p-3 border border-light rounded">
            <i class="bi bi-person display-4"></i>
            <div class="d-flex flex-column justify-content-center">
              <span v-if="dataMetrics" class="fs-3 fw-bold lh-1">{{ dataMetrics.totalPrimaryCreators }}</span>
              <span>Contributors</span>
            </div>
          </div>
        </div>
      
        <div class="col-12 col-md-3">
          <div class="d-flex align-items-center p-3 border border-light rounded">
            <img :src="speciesIcon" alt="DNA Helix icon representing Unique Species" />
            <div class="d-flex flex-column justify-content-center">
              <span v-if="dataMetrics" class="fs-3 fw-bold lh-1">{{ dataMetrics.totalTaxIds }}</span>
              <span>Unique Species</span>
            </div>
          </div>
        </div>
        
        <div class="col-12 col-md-3">
          <div class="d-flex align-items-center p-3 border border-light rounded">
            <i class="bi bi-house-door display-4"></i>
            <div class="d-flex flex-column justify-content-center">
              <span v-if="dataMetrics" class="fs-3 fw-bold lh-1">{{ dataMetrics.repositoryCounts }}</span>
              <span>Repositories</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  </section> 
  
  <section class="py-4" style="background-color:#fff;">
    <div class="container text-center">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-10 col-xl-10">
          <h2 class="subsection-header">Themes and Categories</h2>
          <p>Jump to datasets based on core research themes or categories.</p>
        
          <div class="py-5">
            <div class="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4 text-center">
              <div class="col">
                <div class="theme-card h-100 shadow-sm border-0 p-4">
                  <div class="icon-placeholder">
                    <img :src="feedstockIcon" class="w-50" alt="Illustration of tall grasses and plant stems, representing feedstock development." />
                  </div>
                  <h5 class="fw-bold mt-2">Feedstock<br>Development</h5>
                </div>
              </div>

              <div class="col">
                <div class="theme-card h-100 shadow-sm border-0 p-4">
                  <div class="icon-placeholder">
                    <img :src="deconstructionIcon" class="w-50" alt="Illustration of a molecule chain, representing deconstruction and separation." />
                  </div>
                  <h5 class="fw-bold mt-2">Deconstruction<br>and Separation</h5>
                </div>
              </div>

              <div class="col">
                <div class="theme-card h-100 shadow-sm border-0 p-4">
                  <div class="icon-placeholder">
                    <img :src="conversionIcon" class="w-50" alt="Illustration of lab glassware and fuel pump,representing biofuel conversion research." />
                  </div>
                  <h5 class="fw-bold mt-2">Conversion</h5>
                </div>
              </div>

              <div class="col">
                <div class="theme-card h-100 shadow-sm border-0 p-4">
                  <div class="icon-placeholder">
                    <img :src="sustainabilityIcon" class="w-50" alt="Illustration of a leaf overlaying a recycling arrow, representing sustainability." />
                  </div>
                  <h5 class="fw-bold mt-2">Sustainability</h5>
                </div>
              </div>

            </div>
          </div>
          <ul class="list-unstyled list-inline">
            <li class="list-inline-item"><a href="" class="btn btn-outline-secondary">Genetic Engineering</a></li>
            <li class="list-inline-item"><a href="" class="btn btn-outline-secondary">Microbiology</a></li>
            <li class="list-inline-item"><a href="" class="btn btn-outline-secondary">Analytics & Methods</a></li>
            <li class="list-inline-item"><a href="" class="btn btn-outline-secondary">Plant Biology</a></li>
            <li class="list-inline-item"><a href="" class="btn btn-outline-secondary">Enzymes & Proteins</a></li>
            <li class="list-inline-item"><a href="" class="btn btn-outline-secondary">Process Engineering</a></li>
            <li class="list-inline-item"><a href="" class="btn btn-outline-secondary">Bioenergy Production</a></li>
            <li class="list-inline-item"><a href="" class="btn btn-outline-secondary">Biomass & Feedstock</a></li>
          </ul>
        </div>
      </div>
    </div>
  </section>
    
  <section class="py-4">
    <div class="container text-center">
      <h2 class="subsection-header">Recent Datasets</h2>
      <p>Latest datasets from each bioenergy research center</p>
      
      <div>
        <div class="container">
          <div class="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">

            <div class="col" v-for="result in orderedRecentData" :key="result.uid">
              <div class="card research-card h-100 shadow-sm border-0 p-4">
                <div class="logo-placeholder">
                  <img :src="imgUrls[`../assets/${result.brc?.toLowerCase()}-logo.png`]" style="max-width:200px;" :alt="`${result.brc.toLowerCase()} logo`"></img>
                </div>
                <h5 class="card-title mb-2">
                   <router-link :to="{ name: 'datasetShow', params: { id: result.uid } }" class="pe-4">
                  <span
                    v-html="sanitizeHtml(truncateMiddle(result.title || 'No Title Provided', 75, 50), ALLOWED_HTML)"></span>
                </router-link>
                </h5>
                <div class="card-author mb-3">
                  <AuthorList :creators="result.creator" />
                </div>
                <p class="card-text">
                  <small
                    v-html="sanitizeHtml(truncateMiddle(result.description || '', 150, 75), ALLOWED_HTML)"></small>
                </p>
                <p>
                  <span class="badge text-muted">{{ result.date }}</span>
                </p>
              </div>
            </div>
          
          </div>
        </div>
      </div>
      
    </div>
  </section>
    
  <section class="py-4" style="background-color:#fff;">
    <div class="container">
      <h2 class="subsection-header text-center">Data Portal Features</h2>
      
      <div class="row g-4">
        <div class="row g-4">

            <div class="col-12 col-lg-4">
              <div class="d-flex">
                <div class="me-3">
                  <i class="bi bi-check2-square"></i>
                </div>
                <div>
                  <h5 class="subsection-header">Advanced Searching with Boolean Logic</h5>
                  <p class="mb-0">
                    Instantly pinpoint relevant studies using powerful AND/OR/NOT filters,
                    turning complex queries into precise results.
                  </p>
                </div>
              </div>
            </div>
            
            <div class="col-12 col-lg-4">
              <div class="d-flex">
                <div class="feature-icon me-3">
                  <i class="bi bi-check2-square"></i>
                </div>
                <div>
                  <h5 class="subsection-header">Charts and Visual Analytics</h5>
                  <p class="mb-0">
                    Transform raw data into striking, interactive visualizations that reveal insights at a glance.
                  </p>
                </div>
              </div>
            </div>
            
            <div class="col-12 col-lg-4">
              <div class="d-flex">
                <div class="feature-icon me-3">
                  <i class="bi bi-check2-square"></i>
                </div>
                <div>
                  <h5 class="subsection-header">API Access</h5>
                  <p class="mb-0">
                    Seamlessly integrate our research database into your own applications with fast, secure, and developer-friendly endpoints.
                  </p>
                </div>
              </div>
            </div>
            
        </div>
      </div>
      
    </div>
  </section>
    
  <section class="py-4" style="background-color:#fff;border:1px solid #ddd;">
    <div class="container">
      <div class="row align-items-center">
        <div class="col-12 col-md-5">
          <h2 class="h4 subsection-header">Your Data, Everywhere – Powered by a Multitude of Trusted Repositories</h2>
          <p>Our research datasets are instantly accessible across a host of leading platforms—GitHub, Zenodo, Figshare, and many more.</p>
        </div>
        <div class="col-12 col-md-7">
          <img :src="repoImage" class="img-fluid" alt="Logos from a host of leading platforms, including Github, Zenodo, Figshare, and many more." />
        </div>
      </div>
    </div> 
  </section>
  
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
/* new styles */
.search-form {
	max-width: 600px;
}
.subtitle {
  font-size: 56px;
}
.subsection-header {
  color: #063828;
  font-weight: 700;
}
.herospace {
  background-color:#175929;
  color:#fff;
}
.herospace .browse-all {
  color: #fff;
}
.theme-card {
  background-color: #f1f1f1;
  border-radius: 0.75rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.theme-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 0.75rem 1.5rem rgba(0,0,0,.15);
}
.research-card {
  font-size: 14px;
}
</style>
