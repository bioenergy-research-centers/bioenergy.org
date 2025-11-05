<script setup>
  import { computed } from 'vue';
  const props = defineProps(['creators']);

  const primaryCreators = computed(() => {
    if(!Array.isArray(props.creators)) { return []; }
    return props.creators.filter(item => item.primaryContact === true);
  });
  const contactTooltip = (creator) => {
    return `Corresponding Contact: ${creator.email || 'email not provided'}`
  }
</script>

<template>
  <div>
    <template v-for="(creator, index) in creators">
      <div class="d-inline-flex align-items-baseline me-2">
        <span class="me-1">{{ creator.name }}</span>
        <span v-if="creator.primaryContact===true" class="me-1">
          <i class="bi bi-envelope text-muted affiliation-icon" :title="contactTooltip(creator)"></i>
        </span>
        <i class="bi bi-info-circle text-muted affiliation-icon" :title="creator.affiliation"></i>
        <span v-if="index !== creators.length - 1" class="">; </span>
      </div>
      
    </template>
  </div>
</template>

<style scoped>
  .affiliation-icon {
    font-size: 0.75em;
    position: relative;
    top: -0.3em;
    cursor: pointer;
  }
</style>