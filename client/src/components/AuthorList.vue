<script setup>
  import { computed } from 'vue';
  import { selectVisibleCreators } from '@/utils/visibleCreators';
  const props = defineProps({
    creators: {
      type: Array,
      default: () => [],
    },
    maxVisible: {
      type: Number,
      default: null,
    },
    // Names that matched a search. They are marked, and shown even past maxVisible.
    highlightedNames: {
      type: Array,
      default: () => [],
    },
  });

  const entries = computed(() =>
    selectVisibleCreators(props.creators, props.maxVisible, props.highlightedNames)
  );
  const contactTooltip = (creator) => {
    return `Corresponding Contact: ${creator.email || 'No e-mail address provided.'}`
  };
</script>

<template>
  <div>
    <template v-for="({ creator, index, highlighted, afterGap }, position) in entries" :key="creator.name + index">
      <span v-if="afterGap && position > 0" class="me-2">…</span>
      <div class="d-inline-flex align-items-baseline me-2">

        <mark v-if="highlighted" class="me-1">{{ creator.name }}</mark>
        <span v-else class="me-1">{{ creator.name }}</span>

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

        <span v-if="position !== entries.length - 1" class="">; </span>
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
