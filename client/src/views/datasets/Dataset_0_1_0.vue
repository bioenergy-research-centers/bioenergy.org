<script setup>
  import { computed } from 'vue';
  import OrganismLink from '@/components/OrganismLink.vue';
  const props = defineProps(['selectedResult']);
  const primaryCreators = computed(() => {
    const creators = props.selectedResult?.creator
    if(!Array.isArray(creators)) { return []; }
    return creators.filter(item => item.primaryContact === true);
  });
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

        <div v-if="primaryCreators.length" class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">Creator</div>
          <div>
            <template v-for="(creator, index) in primaryCreators">
              {{ creator.name }}<span v-if="index !== primaryCreators.length - 1">, </span>
            </template>
          </div>
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

        <div v-if="selectedResult.species && selectedResult.species.length" class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">Species</div>
          <div class="d-flex justify-content-start">
            <div v-for="species in selectedResult.species" :key="species.NCBITaxID">
              <div class="me-5">
                <OrganismLink :organism="species"/>
              </div>
            </div>
          </div>
        </div>

        <div v-if="selectedResult.plasmid_features && selectedResult.plasmid_features.length" class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">Plasmid Features</div>
          <table class="table table-light">
            <thead>
              <tr>
                <th scope="col">Backbone</th>
                <th scope="col">Selection Marker</th>
                <th scope="col">Promoters</th>
                <th scope="col">Origin of Replication</th>
                <th scope="col">Replicates In</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="plasmid in selectedResult.plasmid_features">
                <td>{{ plasmid.backbone }}</td>
                <td>{{ Array.from(plasmid.selection_markers).join(', ') }}</td>
                <td>{{ Array.from(plasmid.promoters).join(', ') }}</td>
                <td>{{ plasmid.ori }}</td>
                <td>
                  <OrganismLink :organism="plasmid.replicates_in"/>
                </td>
              </tr>
            </tbody>
          </table>
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