<script setup>
import { computed, ref } from 'vue';
import { sanitizeDatasetHtml } from '@/utils/sanitizeDatasetHtml';

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  }
});

const visibleCount = 5;
const expandedGroups = ref({});

const groupedItems = computed(() => {
  // Map.groupBy would be simpler but does not work in tests
  const groups = new Map();
  props.items.forEach((item) => {
    const type = item?.relatedItemType || 'Other';
    if (!groups.has(type)) {
      groups.set(type, []);
    }
    groups.get(type).push(item);
  });
  return [...groups.entries()].map(([type, items]) => ({ type, items }));
});

function toggleGroup(type) {
  expandedGroups.value[type] = !expandedGroups.value[type];
}

function itemTitle(item) {
  return sanitizeDatasetHtml(item?.title || item?.relatedItemIdentifier);
}
</script>

<template>
  <section v-if="items.length" class="mt-4">
    <div
      v-for="group in groupedItems"
      :key="group.type"
      class="mt-3"
      :data-related-item-type="group.type"
    >
      <div class="text-muted italic fw-bold">
        <span>{{ group.type }}</span>
        <span v-if="group.items.length > visibleCount">
          (
          <button
            type="button"
            class="btn btn-link btn-sm px-0"
            :aria-expanded="Boolean(expandedGroups[group.type])"
            @click="toggleGroup(group.type)"
          >
            {{ expandedGroups[group.type] ? 'Show fewer' : `Show all ${group.items.length}` }}
          </button>
          )
        </span>
      </div>
      <ul class="mb-0 ps-3">
        <li
          v-for="(item, index) in (expandedGroups[group.type] ? group.items : group.items.slice(0, visibleCount))"
          :key="`${item?.relatedItemIdentifier || item?.title || group.type}-${index}`"
        >
          <a
            v-if="item?.relatedItemIdentifier"
            :href="item.relatedItemIdentifier"
            target="_blank"
            rel="noopener noreferrer"
            v-html="itemTitle(item)"
          ></a>
          <span v-else v-html="itemTitle(item)"></span>
        </li>
      </ul>
    </div>
  </section>
</template>
