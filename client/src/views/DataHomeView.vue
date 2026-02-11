<script setup lang="ts">
import HeaderView from "@/views/HeaderView.vue";
import Search from '@/components/Search.vue';
import AuthorList from '@/components/AuthorList.vue';
import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import DatasetDataService from "../services/DatasetDataService";
import sanitizeHtml from 'sanitize-html';
import { useSearchStore } from '@/store/searchStore';

import heroBg from "@/assets/hero-bg.png";
import speciesIcon from "@/assets/species-icon.png";
import feedstockIcon from "@/assets/feedstock-development-icon.svg";
import deconstructionIcon from "@/assets/deconstruction-icon.svg";
import conversionIcon from "@/assets/conversion-icon.svg";
import sustainabilityIcon from "@/assets/sustainability-icon.svg";
import repoImage from "@/assets/repo-logos.png";

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
  <section class="herospace">
   <div
      :style="{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }">
      <div class="container">
        <div class="row gradient">
          <div class="col-lg-7 py-5">
            <h2 class="subtitle fw-bold">Your Portal to Bioenergy Research Data</h2>
            
            <p class="py-3">This portal serves as a centralized point for Bioenergy Research Center-generated datasets to improve findability and accessibility including support for artificial intelligence development and computational analysis.
            </p>
            
            <div class="search-form">
              <search />
              <router-link :to="{ name: 'datasetSearch'}" class="browse-all d-block mt-2">Browse All Datasets
                <i class="bi bi-arrow-right pe-3" aria-hidden="true"></i>
              </router-link>
            </div>
            
            <!-- Metrics -->
            <div class="metrics-row mt-5 mb-3">
              <div class="metric-item">
                <div class="d-flex align-items-center p-3 metrics-border">
                  <i class="bi bi-database display-5 me-2"></i>
                  <div class="d-flex flex-column justify-content-center">
                    <span v-if="dataMetrics" class="fs-4 fw-bold lh-1">
                      {{ dataMetrics.totalDatasets }}
                    </span>
                    <span>Datasets</span>
                  </div>
                </div>
              </div>

              <div class="metric-item">
                <div class="d-flex align-items-center p-3 metrics-border">
                  <i class="bi bi-person display-5 me-2"></i>
                  <div class="d-flex flex-column justify-content-center">
                    <span v-if="dataMetrics" class="fs-4 fw-bold lh-1">
                      {{ dataMetrics.totalPrimaryCreators }}
                    </span>
                    <span>Contributors</span>
                  </div>
                </div>
              </div>

              <div class="metric-item">
                <div class="d-flex align-items-center p-3 metrics-border">
                  <img :src="speciesIcon" alt="DNA Helix icon representing Unique Species" class="me-2"/>
                  <div class="d-flex flex-column justify-content-center">
                    <span v-if="dataMetrics" class="fs-4 fw-bold lh-1">
                      {{ dataMetrics.totalTaxIds }}
                    </span>
                    <span>Species</span>
                  </div>
                </div>
              </div>

              <div class="metric-item">
                <div class="d-flex align-items-center p-3 metrics-border">
                  <i class="bi bi-house-door display-5 me-2"></i>
                  <div class="d-flex flex-column justify-content-center" style="min-width: 0;">
                    <span v-if="dataMetrics" class="fs-4 fw-bold lh-1">
                      {{ dataMetrics.repositoryCounts }}
                    </span>
                    <span>Repositories</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </section> 
  
  <section class="py-5" style="background-color:#fff;">
    <div class="container text-center">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-10 col-xl-10">
          <h2 class="subsection-header">Themes and Categories</h2>
          <p>Jump to datasets based on core research themes or categories.</p>
        
          <div class="pt-3 pb-5">
            <div class="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4 text-center">
              <div class="col">
                <div class="theme-card feedstock-development h-100 shadow p-4 position-relative">
                  <div class="icon-placeholder">
                    <img :src="feedstockIcon" class="w-50" alt="Illustration of tall grasses and plant stems, representing feedstock development." />
                  </div>
                  <h5 class="fw-bold mt-2">Feedstock<br>Development</h5>
                  <router-link
                    class="stretched-link"
                    :to="{
                      path: '/search',
                      query: {
                        filters: JSON.stringify({ theme: ['Feedstock+Development'] }),
                        rows: 50
                      }
                    }"
                  >
                    <span class="visually-hidden">View Feedstock Development datasets</span>
                  </router-link>
                </div>
              </div>

              <div class="col">
                <div class="theme-card deconstruction-separation h-100 shadow p-4 position-relative">
                  <div class="icon-placeholder">
                    <img :src="deconstructionIcon" class="w-50" alt="Illustration of a molecule chain, representing deconstruction and separation." />
                  </div>
                  <h5 class="fw-bold mt-2">Deconstruction<br>and Separation</h5>
                  <router-link
                    class="stretched-link"
                    :to="{
                      path: '/search',
                      query: {
                        filters: JSON.stringify({ theme: ['Deconstruction+and+Separation'] }),
                        rows: 50
                      }
                    }"
                  >
                    <span class="visually-hidden">View Deconstruction and Separation datasets</span>
                  </router-link>
                </div>
              </div>

              <div class="col">
                <div class="theme-card conversion h-100 shadow p-4 position-relative">
                  <div class="icon-placeholder">
                    <img :src="conversionIcon" class="w-50" alt="Illustration of lab glassware and fuel pump,representing biofuel conversion research." />
                  </div>
                  <h5 class="fw-bold mt-2">Conversion</h5>
                  <router-link
                    class="stretched-link"
                    :to="{
                      path: '/search',
                      query: {
                        filters: JSON.stringify({ theme: ['Conversion'] }),
                        rows: 50
                      }
                    }"
                  >
                    <span class="visually-hidden">View Conversion datasets</span>
                  </router-link>
                </div>
              </div>

              <div class="col">
                <div class="theme-card sustainability h-100 shadow p-4 position-relative">
                  <div class="icon-placeholder">
                    <img :src="sustainabilityIcon" class="w-50" alt="Illustration of a leaf overlaying a recycling arrow, representing sustainability." />
                  </div>
                  <h5 class="fw-bold mt-2">Sustainability</h5>
                  <router-link
                    class="stretched-link"
                    :to="{
                      path: '/search',
                      query: {
                        filters: JSON.stringify({ theme: ['Sustainability'] }),
                        rows: 50
                      }
                    }"
                  >
                    <span class="visually-hidden">View Sustainability datasets</span>
                  </router-link>
                </div>
              </div>

            </div>
          </div>
          <ul class="list-unstyled list-inline categories">
            <li class="list-inline-item">
              <router-link
                class="btn btn-labeled btn-secondary mb-2"
                :to="{
                  path: '/search',
                  query: {
                    filters: JSON.stringify({ topic: ['Genetic+Engineering'] }),
                    rows: 50
                  }
                }"
              >
                <span class="btn-label">
                  <i class="bi bi-arrow-right-circle-fill"></i>
                </span>
                Genetic Engineering
              </router-link>
            </li>
            <li class="list-inline-item">
              <router-link
                class="btn btn-labeled btn-secondary mb-2"
                :to="{
                  path: '/search',
                  query: {
                    filters: JSON.stringify({ topic: ['Microbiology'] }),
                    rows: 50
                  }
                }"
              >
                <span class="btn-label">
                  <i class="bi bi-arrow-right-circle-fill"></i>
                </span>
                Microbiology
              </router-link>
            </li>
            <li class="list-inline-item">
              <router-link
                class="btn btn-labeled btn-secondary mb-2"
                :to="{
                  path: '/search',
                  query: {
                    filters: JSON.stringify({ topic: ['Analytics & Methods'] }),
                    rows: 50
                  }
                }"
              >
                <span class="btn-label">
                  <i class="bi bi-arrow-right-circle-fill"></i>
                </span>
                Analytics & Methods
              </router-link>
            </li>
            <li class="list-inline-item">
              <router-link
                class="btn btn-labeled btn-secondary mb-2"
                :to="{
                  path: '/search',
                  query: {
                    filters: JSON.stringify({ topic: ['Plant+Biology'] }),
                    rows: 50
                  }
                }"
              >
                <span class="btn-label">
                  <i class="bi bi-arrow-right-circle-fill"></i>
                </span>
                Plant Biology
              </router-link>
            </li>
            <li class="list-inline-item">
              <router-link
                class="btn btn-labeled btn-secondary mb-2"
                :to="{
                  path: '/search',
                  query: {
                    filters: JSON.stringify({ topic: ['Enzymes & Proteins'] }),
                    rows: 50
                  }
                }"
              >
                <span class="btn-label">
                  <i class="bi bi-arrow-right-circle-fill"></i>
                </span>
                Enzymes & Proteins
              </router-link>
            </li>
            <li class="list-inline-item">
              <router-link
                class="btn btn-labeled btn-secondary mb-2"
                :to="{
                  path: '/search',
                  query: {
                    filters: JSON.stringify({ topic: ['Process+Engineering'] }),
                    rows: 50
                  }
                }"
              >
                <span class="btn-label">
                  <i class="bi bi-arrow-right-circle-fill"></i>
                </span>
                Process Engineering
              </router-link>
            </li>
            <li class="list-inline-item">
              <router-link
                class="btn btn-labeled btn-secondary mb-2"
                :to="{
                  path: '/search',
                  query: {
                    filters: JSON.stringify({ topic: ['Bioenergy+Production'] }),
                    rows: 50
                  }
                }"
              >
                <span class="btn-label">
                  <i class="bi bi-arrow-right-circle-fill"></i>
                </span>
                Bioenergy Production
              </router-link>
            </li>
             <li class="list-inline-item">
              <router-link
                class="btn btn-labeled btn-secondary mb-2"
                :to="{
                  path: '/search',
                  query: {
                    filters: JSON.stringify({ topic: ['Biomass & Feedback'] }),
                    rows: 50
                  }
                }"
              >
                <span class="btn-label">
                  <i class="bi bi-arrow-right-circle-fill"></i>
                </span>
                Biomass & Feedstock
              </router-link>
            </li>
          </ul>

        </div>
      </div>
    </div>
  </section>
    
  <section class="py-5">
    <div class="container text-center">
      <h2 class="subsection-header">Recent Datasets</h2>
      <p>Latest datasets from each bioenergy research center</p>
      
      <div>
        <div class="container">
          <div class="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">

            <div class="col" v-for="result in orderedRecentData" :key="result.uid">
              <div class="card research-card h-100 shadow-sm border-0 p-3">
                <div class="logo-placeholder">
                  <img :src="imgUrls[`../assets/${result.brc?.toLowerCase()}-logo.png`]" style="max-width:125px;" :alt="`${result.brc.toLowerCase()} logo`"></img>
                </div>
                <div style="width: 70%;height:2px;border-top:1px solid #ddd;margin:10px auto;"></div>
                <h5 class="h6 my-3 text-start">
                  <span class="fw-bold"
                    v-html="sanitizeHtml(truncateMiddle(result.title || 'No Title Provided', 75, 50), ALLOWED_HTML)"></span>
                </h5>
                <div class="card-author mb-3 text-start">
                  <AuthorList :creators="result.creator" />
                </div>
                <p class="card-text text-start fst-italic">
                  <span
                    v-html="sanitizeHtml(truncateMiddle(result.description || '', 150, 75), ALLOWED_HTML)"></span>
                </p>
                <!-- <p class="text-start">
                  <span class="text-muted">{{ result.date }}</span>
                </p> -->
                <router-link :to="{ name: 'datasetShow', params: { id: result.uid } }" class="stretched-link"></router-link>
              </div>
            </div>
          
          </div>
        </div>
      </div>
      
    </div>
  </section>
    
  <section class="py-5" style="background-color:#fff;">
    <div class="container">
      <h2 class="subsection-header text-center mb-4">Data Portal Features</h2>
      
      <div class="row">
          <div class="col-12 col-lg-4">
            <div class="d-flex">
              <div class="me-3">
                <i class="bi bi-check-square-fill"></i>
              </div>
              <div>
                <h5 class="subsection-header">Advanced Searching with Boolean Logic</h5>
                <p>
                  Instantly pinpoint relevant studies using powerful AND/OR/NOT filters,
                  turning complex queries into precise results.
                </p>
              </div>
            </div>
          </div>
          
          <div class="col-12 col-lg-4">
            <div class="d-flex">
              <div class="feature-icon me-3">
                <i class="bi bi-check-square-fill"></i>
              </div>
              <div>
                <h5 class="subsection-header">Charts and Visual Analytics</h5>
                <p>
                  Transform raw data into striking, interactive visualizations that reveal insights at a glance.
                </p>
              </div>
            </div>
          </div>
          
          <div class="col-12 col-lg-4">
            <div class="d-flex">
              <div class="feature-icon me-3">
                <i class="bi bi-check-square-fill"></i>
              </div>
              <div>
                <h5 class="subsection-header">API Access</h5>
                <p>
                  Seamlessly integrate our research database into your own applications with fast, secure, and developer-friendly endpoints.
                </p>
              </div>
            </div>
          </div>
      </div>
      <div class="row align-items-center mt-md-5">
        <div class="col-12 col-md-5">
          <div class="d-flex">
            <div class="feature-icon me-3">
              <i class="bi bi-check-square-fill"></i>
            </div>
            <div class="d-flex flex-column">
              <h2 class="h4 subsection-header">Support for Trusted Repositories</h2>
              <p>Our research datasets are instantly accessible across a host of leading platforms—GitHub, Zenodo, Figshare, and many more.</p>
            </div>
          </div>
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
  font-size: 2.85em;
}
.subsection-header {
  color: #04652F;
  font-weight: 700;
}
.herospace {
  background-color:#175A29;
  color:#fff;
}
.herospace .browse-all {
  color: #fff;
  text-decoration: none;
}
.herospace .browse-all:hover {
  text-decoration: underline;
}
.theme-card {
  background-color: #f1f1f1;
  border: 1px solid #e1e0e0;
  border-radius: 0.75rem;
  transition: transform 0.2s ease;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.research-card {
  transition: transform 0.2s ease;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.categories a {
  transition: transform 0.2s ease;
}
.theme-card a:hover::after,
.research-card a:hover::after,
.categories a:hover {
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}
.feedstock-development {
  background: linear-gradient(0deg,rgba(241, 241, 241, 1) 0%, rgba(69, 142, 52, 0.20) 100%);
}
.deconstruction-separation {
  background: linear-gradient(0deg,rgba(241, 241, 241, 1) 0%, rgba(0, 83, 135, 0.20) 100%);
}
.conversion {
  background: linear-gradient(0deg,rgba(241, 241, 241, 1) 0%, rgba(247, 148, 29, 0.20) 100%);
}
.sustainability {
  background: linear-gradient(0deg,rgba(241, 241, 241, 1) 0%, rgba(169, 38, 62, 0.20) 100%);
}
.background-image {
  background-repeat: no-repeat;
  background-size: cover;
}
.gradient {
  background: #175A29;
  background: linear-gradient(90deg, rgba(23, 90, 41, 1) 0%, rgba(23, 90, 41, 0.97) 61%, rgba(23, 90, 41, 0) 100%);
}
.metrics-border {
  border: 1px solid rgba(255, 255, 255, 0.50);
  border-radius: 8px;
}
.logo-placeholder {
  min-height: 45px;
}
.btn-label {
	position: relative;
	left: -12px;
	display: inline-block;
	padding: 6px 12px;
	background: rgba(0, 0, 0, 0.15);
	border-radius: 3px 0 0 3px;
}
.btn-labeled {
	padding-top: 0;
	padding-bottom: 0;
}

.metrics-row {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, 1fr); /* 2 per row on mobile */
}

@media (min-width: 768px) {
  .metrics-row {
    grid-template-columns: repeat(4, 1fr); /* 4 per row on md+ */
  }
}

.metric-item {
  display: flex;
}

.metrics-border {
  flex: 1;
}


</style>
