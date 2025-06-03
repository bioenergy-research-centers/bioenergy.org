<script setup>
  import { ref, computed } from 'vue';
  import OrganismLink from '@/components/OrganismLink.vue';
  const props = defineProps(['selectedResult']);
  const expandedIndex=ref(null);
  function toggleDesc(idx) {
    expandedIndex.value = expandedIndex.value === idx ? null : idx;
  }

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
          <div class="small text-uppercase fw-bold mb-2">Plasmid Features</div>
          <table class="table table-bordered">
            <thead class="table-light">
              <tr>
                <th scope="col">Backbone</th>
                <th scope="col">Selection Marker</th>
                <th scope="col">Promoters</th>
                <th scope="col">Origin of Replication</th>
                <th scope="col">Replicates In</th>
                <th scope="col" class="text-center">Description</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(plasmid, idx) in selectedResult.plasmid_features" :key="plasmid.id ?? idx">
                <tr :class="{ 'bg-light': expandedIndex === idx }">
                  <td>{{ plasmid.backbone }}</td>
                  <td>{{ Array.from(plasmid.selection_markers).join(', ') }}</td>
                  <td>{{ Array.from(plasmid.promoters).join(', ') }}</td>
                  <td>{{ plasmid.ori }}</td>
                  <td>
                    <OrganismLink :organism="plasmid.replicates_in"/>
                  </td>
                  <td class="text-center">
                    <!-- Toggle button: show/hide description -->
                    <button v-if="plasmid.description && plasmid.description.length" class="btn btn-sm btn-outline-primary" @click="toggleDesc(idx)">
                      <span v-if="expandedIndex === idx">– Hide</span>
                      <span v-else>+ Show</span>
                    </button>
                  </td>
                </tr>
                <tr v-if="expandedIndex === idx" class="bg-light">
                  <td colspan="6">
                    <strong>Description:</strong>
                    <div class="mt-1">
                      {{ plasmid.description ?? 'No description provided.' }}
                    </div>
                  </td>
                </tr>
              </template>
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