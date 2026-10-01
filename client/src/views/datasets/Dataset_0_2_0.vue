<script setup>
  import { ref, computed } from 'vue';
  import OrganismLink from '@/components/OrganismLink.vue';
  import AuthorList from '@/components/AuthorList.vue';
  import RelatedIdentifiers from '@/components/RelatedIdentifiers.vue';
  import RelatedItems from '@/components/RelatedItems.vue';
  import { sanitizeDatasetHtml } from '@/utils/sanitizeDatasetHtml';

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

  function themeClass(theme) {
    const normalizedTheme = String(theme)
      .replace(/&amp;/g, '&')
      .trim()
      .toLowerCase();

    const themeClasses = {
      'feedstock development': 'theme-feedstock',
      'deconstruction and separation': 'theme-deconstruction',
      conversion: 'theme-conversion',
      sustainability: 'theme-sustainability',
    };

    return themeClasses[normalizedTheme] || '';
  }

  const displayableEnrichedIdentifiers = computed(() =>
    props.selectedResult?.bioregistry_enriched_ids?.filter(
      identifier => identifier?.registry && identifier?.url
    ) || []
  )
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
      <h3 class="subsection-header display-6" v-html="sanitizeDatasetHtml(selectedResult?.title)"></h3>
      <AuthorList :creators="selectedResult.creator"/>

    </div>
  </div>

  <div class="row dataset-metadata">
    <div class="col-12 col-md-4 text-break dataset-metadata-cell dataset-metadata-cell-first">
      <small><span class="text-uppercase text-muted">Identifier:</span></small><br/><span class="fw-bolder">{{ selectedResult.identifier }}</span>
    </div>
    <div class="col-12 col-md-4 dataset-metadata-cell">
      <small><span class="text-uppercase text-muted">Repository:</span></small><br/><span class="fw-bolder">{{ selectedResult.repository || '--' }}</span>
    </div>
    <div class="col-12 col-md-4 dataset-metadata-cell dataset-metadata-cell-last">
      <small><span class="text-uppercase text-muted">BRC:</span></small><br/><span class="fw-bolder">{{ selectedResult.brc }}</span>
    </div>
  </div>
  <div class="row text-muted">
    <div class="col">
      <!-- <small>URL: {{ selectedResult.bibliographicCitation }}</small> -->
    </div>
  </div>

  <div class="row gx-5 gy-2">
    <aside class="col-12 col-md-3 order-md-2 dataset-sidebar">
      <div v-if="selectedResult.theme && selectedResult.theme.length" class="mb-5">
        <div class="fs-4 subsection-header">Theme</div>
        <div class="d-flex flex-wrap gap-2">
          <span
            v-for="theme in selectedResult.theme"
            :key="theme"
            :class="['tag-badge', themeClass(theme)]"
          >
            {{ theme }}
          </span>
        </div>
      </div>

      <div v-if="selectedResult.keywords && selectedResult.keywords.length" class="mb-5">
        <div class="fs-4 subsection-header">Keywords</div>
        <div class="d-flex flex-wrap gap-2">
          <span
            v-for="keyword in selectedResult.keywords"
            :key="keyword"
            class="tag-badge keyword-badge"
          >
            {{ keyword }}
          </span>
        </div>
      </div>

      <div v-if="selectedResult.species && selectedResult.species.length" class="mb-5">
        <div class="fs-4 subsection-header">Species</div>
        <div class="d-flex flex-column gap-2">
          <div v-for="species in selectedResult.species" :key="species.NCBITaxID">
            <OrganismLink :organism="species"/>
          </div>
        </div>
      </div>

      <div v-if="selectedResult.analysisType" class="mb-5">
        <div class="fs-4 subsection-header">Analysis Type</div>
        <div>{{ selectedResult.analysisType }}</div>
      </div>
    </aside>

    <section class="col-12 col-md-9 order-md-1 dataset-content">
      <div v-if="selectedResult.description" class="mb-5">
        <h3 class="fs-4 subsection-header">Description</h3>
        <p v-html="sanitizeDatasetHtml(selectedResult.description)"></p>
      </div>

      <div v-if="selectedResult.plasmid_features && selectedResult.plasmid_features.length" class="mb-5">
        <div class="fs-4 subsection-header mb-2">Plasmid Features</div>
        <div class="table-responsive">
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
                    {{ plasmid.description ?? 'No plasmid description available.' }}
                  </div>
                </td>
              </tr>
            </template>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="selectedResult.relatedItem?.length || displayableEnrichedIdentifiers.length" class="mb-5">
        <div class="fs-4 subsection-header">Linked Resources</div>
        <RelatedItems :items="selectedResult.relatedItem" />
        <RelatedIdentifiers :identifiers="displayableEnrichedIdentifiers" />
      </div>
    </section>
  </div>

        <hr/>
        <div class='row mt-3 float-end'>
          <div class='text-end text-muted small'>
              Schema Version: <router-link :to="`/schema/${selectedResult.schema_version}`" class="link-primary text-decoration-underline">{{ selectedResult.schema_version }}</router-link>
              <br/>
              Record Updated: {{ updatedDate }}
          </div>
        </div>

</template>
