<script setup>
  const props = defineProps(['selectedResult']);
</script>
<template>
  <h3>{{ selectedResult.title }}</h3>
        <div>
          More information at:
          <a :href="selectedResult.bibliographicCitation" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
            <i class="bi bi-box-arrow-up-right"></i> {{ selectedResult.identifier }}
          </a>
        </div>

        <div class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">Date</div>
          {{ selectedResult.date }}
        </div>

        <div v-if="selectedResult?.creator?.length" class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">Creator</div>
          <div>{{ selectedResult.creator[0].creatorName }}</div>
        </div>

        <div class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">BRC</div>
          <div>{{ selectedResult.brc }}</div>
        </div>

        <div class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">Repository</div>
          <div>{{ selectedResult.repository }}</div>
        </div>

        <div v-if="selectedResult.analysisType" class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">Analysis Type</div>
          <div>{{ selectedResult.analysisType }}</div>
        </div>

        <div v-if="selectedResult.description" class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">Description</div>
          {{ selectedResult.description }}
        </div>

        <div v-if="selectedResult.keywords && selectedResult.keywords.length" class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">Keywords</div>
          {{ Array.from(selectedResult.keywords).join(', ') }}
        </div>

        <div v-if="selectedResult.species" class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">Species</div>
          <div class="d-flex justify-content-start">
            <div v-for="species in selectedResult.species" :key="species.NCBITaxID">
              <div class="me-5">
                <b class="fs-7 text-uppercase text-muted">Scientific Name: </b>{{ species.scientificName }}<br>
                <b class="fs-7 text-uppercase text-muted">NCBITaxID: </b>{{ species.NCBITaxID }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedResult.relatedItem" class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">Related Item</div>
          <div v-for="item in selectedResult.relatedItem">
            <div class="text-muted italic mt-2 fw-bold">
              {{ item.relatedItemType }}
              <i class="bi bi-box-arrow-up-right"></i>
            </div>
            <a :href="item.relatedItemIdentifier" target="_blank" rel="noopener noreferrer">
              {{ item.title }}
            </a>
          </div>
        </div>

        <div class='row mt-4'>
          <div class='text-end text-muted small'>
              Schema Version: {{ selectedResult.schema_version }}<br/>
          </div>
        </div>
</template>