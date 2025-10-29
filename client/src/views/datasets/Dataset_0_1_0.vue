<script setup>
  import { ref, computed } from 'vue';
  import OrganismLink from '@/components/OrganismLink.vue';
  import AuthorList from '@/components/AuthorList.vue';
  import sanitizeHtml from 'sanitize-html';
  const ALLOWED_HTML = { allowedTags: [ 'b', 'i', 'sub', 'sup'], allowedAttributes: {} };

  const props = defineProps(['selectedResult']);
  const expandedIndex=ref(null);
  function toggleDesc(idx) {
    expandedIndex.value = expandedIndex.value === idx ? null : idx;
  }
  
  const updatedDate = computed(() => {
    const date = props.selectedResult?.updated_at
    if(!date) {return "";}
    const d = new Date(date)
    return d.toLocaleDateString(undefined, {dateStyle: "medium"})
  })

  const publishedDate = computed(() => {
    const date = props.selectedResult?.date
    if(!date) {return "";}
    const d = new Date(date)
    return d.toLocaleDateString(undefined, {dateStyle: "medium"})
  })
</script>

<template>
  <div class="row mt-2 align-items-center">
    <div class="col">
      <small>Published: {{ publishedDate }}</small>
    </div>
    <div class="col-auto text-end me-md-4">
      <div class="">    
        <a :href="selectedResult.bibliographicCitation" target="_blank" rel="noopener noreferrer" class="btn btn-primary text-light rounded-pill px-3 pe-4 fw-bold fs-5">
          <i class="bi bi-box-arrow-up-right"></i> Access Data
        </a>
      </div>
    </div>
  </div>

  <div class="row mt-4">
    <div class="col-12 col-md">
      <h3 v-html="sanitizeHtml(selectedResult?.title, ALLOWED_HTML)"></h3>
      <AuthorList :creators="selectedResult.creator"/>

    </div>
  </div>
  
  <hr/>

  <div class="row text-muted">
  
    <div class="col-12 col-md-4 text-break">
      <small>Identifier: {{ selectedResult.identifier }}</small><br/>
    </div>
    <div class="col-12 col-md-4 text-md-center">
      <small>Repository: {{ selectedResult.repository }}</small>
    </div>
    <div class="col-12 col-md-4 text-md-end pe-md-4">
      <small>BRC: {{ selectedResult.brc }}</small><br/>
    </div>
  </div>
  <div class="row text-muted">
    <div class="col">
      <!-- <small>URL: {{ selectedResult.bibliographicCitation }}</small> -->
    </div>
  </div>

  <hr/>

  <div v-if="selectedResult.description" class="row">
    <div class="small text-uppercase fw-bold">Description</div>
    <p v-html="sanitizeHtml(selectedResult.description, ALLOWED_HTML)"></p>
  </div>


        <div v-if="selectedResult.analysisType" class="mt-4">
          <div class="small text-uppercase mt-5 fw-bold">Analysis Type</div>
          <div>{{ selectedResult.analysisType }}</div>
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
          <div class="small text-uppercase mt-5 fw-bold">Related Items</div>
          <div v-for="item in selectedResult.relatedItem">
            <div class="text-muted italic mt-2 fw-bold">
              {{ item.relatedItemType }}
              <i class="bi bi-box-arrow-up-right"></i>
            </div>
            <a :href="item.relatedItemIdentifier" target="_blank" rel="noopener noreferrer">
              <span v-html="sanitizeHtml(item.title, ALLOWED_HTML)"/>
            </a>
          </div>
        </div>

        <hr/>
        <div class='row mt-3 float-end'>
          <div class='text-end text-muted small'>
              Schema Version: {{ selectedResult.schema_version }}<br/>
              Record Updated: {{ updatedDate }}
          </div>
        </div>

</template>