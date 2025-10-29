<script setup lang="ts">
import HeaderView from "@/views/HeaderView.vue";
import Search from '@/components/Search.vue';

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
      <div class="col-md-12 col-lg-8">
        <div class="callout">
            <h2 class="fw-bold text-light">Search Datasets From Bioenergy Research Centers</h2>
            <Search />
        </div>
        <p class="lead px-3 fw-bold">
          A collaborative information platform brought to you by the four US Department of Energy funded <a href="https://www.genomicscience.energy.gov/bioenergy-research-centers/" class="" target="_blank" rel="noopener noreferrer">Bioenergy Research Centers</a>
        </p>
        <p class=" px-3 lead">
          The Bioenergy Research Centers (BRCs) are driving major 
          advancements in biotechnology underpinning the production of fuels and chemicals from
          dedicated bioenergy crops such as switchgrass, poplar, and energy sorghum. This research
          can enhance energy security; create domestic supply chains for a range of fuels,
          chemicals, and materials; generate jobs in rural areas, and ensure U.S. leadership in 
          a globally competitive bioeconomy.
        </p>

        <img :src="mapImage" alt="" width=100%>
      </div>
      <div class="col-md-12 col-lg-4 brc-listing">
        <p class="fw-bold pt-4 fs-3 intro text-center lh-sm">
          <a href="https://www.jbei.org/wp-content/uploads/2024/08/BRCFlyer_2024-1.pdf" target="_blank" rel="noopener noreferrer">Download our brochure</a> to learn more about the BRCs
        </p>
        <p class="fw-bold fs-4 text-center lh-sm">
          Or visit us individually:
        </p>
        <hr/>
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

        <div class="text-center mt-3">
          <p>
            The Bionergy Research Centers are supported by the Office of Science of the U.S. Department of Energy.
            The Office of Science is the single largest supporter of basic research in the physical sciences in the United States,
            and is working to address some of the most pressing challenges of our time. For more information, please visit <a href="https://science.energy.gov">science.energy.gov</a>.
          </p>
          <a href="https://science.energy.gov" target="_blank" rel="noopener noreferrer">
            <img :src="doeLogo" width=60%>
          </a>
        </div>

      </div>
    </div>
  </div>


</template>

<style scoped>

.brc-listing {
  /* background-color: #DBE8C5; */
  background-color: #ffffff;
  min-height: 100%;
  border-radius: 5px;
  margin: 20px 0 0px;
}
.brc-listing .intro {
  /* color: #72a530; */
}
/* .brc-listing .intro a {
  color: #4C8D87;
} */
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
