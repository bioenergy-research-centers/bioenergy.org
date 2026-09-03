<script setup>
  import { computed } from 'vue';
  const props = defineProps({
    creators: {
      type: Array,
      default: () => [],
    },
    maxVisible: {
      type: Number,
      default: null,
    },
  });

  const creators = computed(() => {
    if(!Array.isArray(props.creators)) { return []; }
    if (
      !Number.isInteger(props.maxVisible) ||
      props.maxVisible < 0
    ) {
      return props.creators;
    }
    return props.creators.slice(0, props.maxVisible);
  });
  const contactTooltip = (creator) => {
    return `Corresponding Contact: ${creator.email || 'No e-mail address provided.'}`
  };
</script>

<template>
  <div>
    <template v-for="(creator, index) in creators" :key="creator.name + index">
      <div class="d-inline-flex align-items-baseline me-2">

        <span class="me-1">{{ creator.name }}</span>

        <!-- Always show for primary contact -->
        <span v-if="creator.primaryContact === true" class="me-1">
          <i
            class="bi bi-envelope text-muted affiliation-icon"
            :title="contactTooltip(creator)"
          ></i>
        </span>

        <!-- Only show if affiliation exists -->
        <i
          v-if="creator.affiliation && creator.affiliation.trim() !== ''"
          class="bi bi-info-circle text-muted affiliation-icon"
          :title="creator.affiliation"
        ></i>

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
