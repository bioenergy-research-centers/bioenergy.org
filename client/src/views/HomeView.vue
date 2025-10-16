<script setup lang="ts">
import HeaderView from "@/views/HeaderView.vue";

import mapImage from "@/assets/brc-bioenergy-map.png"
import cabbiLogo from "@/assets/cabbi-logo.png"
import cbiLogo from "@/assets/cbi-logo.png"
import glbrcLogo from "@/assets/glbrc-logo.png"
import jbeiLogo from "@/assets/jbei-logo.png"
import doeLogo from "@/assets/doe-logo.png"

</script>

<template>
  <HeaderView />
  <div class="container">
    <div class="row">
      <div class="col-md-12 col-lg-8 mt-3">
        <div class="callout">
          <form>
            <h2 class="fw-bold text-light">Search 523 Datasets from 4 Bioenergy Research Centers</h2>
            <div class="input-group">
              <!-- Main Search Input -->
              <label for="main-search-input" class="visually-hidden">Search Datasets</label>
              <input id="main-search-input" class="form-control" placeholder="Search datasets" />
              <button type="submit" class="btn btn-sm btn-outline-secondary bg-light">
                <span class="visually-hidden">Search</span>
                <i class="bi bi-search text-muted"></i>
              </button>

              <!-- Advanced Search Dropdown Toggle -->
              <button type="button" class="btn btn-sm btn-outline-secondary bg-light dropdown-toggle" data-bs-toggle="dropdown"
                      aria-expanded="false">
                Advanced
              </button>
            </div>
          </form>
        </div>
        <p class="lead px-3 fw-bold">
          A collaborative educational and informational platform brought to you by the four US Department of Energy funded <a href="https://www.genomicscience.energy.gov/bioenergy-research-centers/" class=" text-muted" target="_blank" rel="noopener noreferrer">Bioenergy Research Centers</a>
        </p>
        <img :src="mapImage" alt="" width=100%>
      </div>
      <div class="col-md-12 col-lg-4 brc-listing">
        <p class="fw-bold fs-3 intro text-center lh-sm">
          <a href="https://www.jbei.org/wp-content/uploads/2024/08/BRCFlyer_2024-1.pdf" target="_blank" rel="noopener noreferrer">Download our brochure</a> to learn more about working with the BRCs
        </p>
        <p class="fw-bold fs-4 text-center lh-sm">
          Or visit us individually:
        </p>
        <div class="text-center">
          <a href="https://cabbi.bio/" target="_blank" rel="noopener noreferrer">
            <img :src="cabbiLogo" width=65%>
          </a>
        </div>
        <hr/>

        <div class="text-center">
          <a href="https://cbi.ornl.gov/" target="_blank" rel="noopener noreferrer">
            <img :src="cbiLogo" width=80%>
          </a>
        </div>
        <hr/>

        <div class="text-center">
          <a href="https://www.glbrc.org/" target="_blank" rel="noopener noreferrer">
            <img :src="glbrcLogo" width=80%%>
          </a>
        </div>
        <hr/>

        <div class="text-center">
          <a href="https://www.jbei.org/" target="_blank" rel="noopener noreferrer">
            <img :src="jbeiLogo" width=70%>
          </a>
        </div>
        <hr/>

        <div class="text-center">
          <a href="https://www.energy.gov/science/office-science" target="_blank" rel="noopener noreferrer">
            <img :src="doeLogo" width=60%>
          </a>
        </div>

      </div>
    </div>
  </div>


</template>

<style scoped>

.brc-listing {
  background-color: #DBE8C5;
  min-height: 100%;
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
  margin: 20px 0 40px;
  padding: 20px 20px 40px;
}
</style>
