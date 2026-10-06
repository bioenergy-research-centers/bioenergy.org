<script setup>
  const props = defineProps(['organism']);
</script>

<template>
  <div v-if="organism">
    <div v-if="organism.scientificName && organism.NCBITaxID">
      <a :href="'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=' + organism.NCBITaxID" target="_blank" rel="noopener noreferrer">
        <span class="text-break">
          {{ organism.scientificName }}
          <i class="bi bi-box-arrow-up-right"></i>
        </span>
      </a>
    </div>
    <div v-else-if="organism.scientificName">
      {{ organism.scientificName}}
    </div>
  </div>
</template>
