<script setup>
import DatasetListItem from '@/components/DatasetListItem.vue';

defineProps({
  items: {
    type: Array,
    default: () => [],
  },
});
</script>

<template>
  <div v-if="items.length" class="related-datasets-section mb-5">
    <h3 class="subsection-header mt-5">Related Datasets</h3>
    <ul class="list-unstyled mb-0">
      <li v-for="item in items" :key="item.uid" class="related-item">
        <DatasetListItem :item="item" />
      </li>
    </ul>
  </div>
</template>
