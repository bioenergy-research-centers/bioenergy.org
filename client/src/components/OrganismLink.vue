<script setup>
  const props = defineProps(['organism']);
</script>

<template>
  <div v-if="organism">
    <div v-if="organism.scientificName && organism.NCBITaxID">
      <a :href="'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=' + organism.NCBITaxID" target="_blank" rel="noopener noreferrer">
        <nobr>
          {{ organism.scientificName }}
          <i class="bi bi-box-arrow-up-right"></i>
        </nobr>
      </a>
    </div>
    <div v-else-if="organism.scientificName">
      {{ organism.scientificName}}
    </div>
  </div>
</template>