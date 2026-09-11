<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  identifiers: {
    type: Array,
    default: () => [],
  },
});

const visibleCount = 5;
const expandedGroups = ref({});

const resolvedGroups = computed(() => {
  // Map.groupBy would be simpler but does not work in tests
  const groups = new Map();
  props.identifiers.forEach((identifier) => {
    const prefix = identifier.registry.prefix;
    if (!groups.has(prefix)) {
      groups.set(prefix, []);
    }
    groups.get(prefix).push(identifier);
  });
  return [...groups.entries()].map(([prefix, identifiers]) => ({
    prefix,
    registry: identifiers[0]?.registry,
    identifiers
  }));
});

function toggleGroup(prefix) {
  expandedGroups.value[prefix] = !expandedGroups.value[prefix];
}
</script>

<template>
  <section v-if="identifiers.length" class="mt-4">

    <div
      v-for="group in resolvedGroups"
      :key="group.prefix"
      class="mt-3"
      :data-related-identifier-prefix="group.prefix"
    >
      <div class="text-muted italic mt-2 fw-bold">
        <span>{{ group.registry.name }}</span>
        <span v-if="group.identifiers.length > visibleCount">
          (
          <button
            type="button"
            class="btn btn-link btn-sm px-0"
            :aria-expanded="Boolean(expandedGroups[group.prefix])"
            @click="toggleGroup(group.prefix)"
          >
            {{ expandedGroups[group.prefix] ? 'Show fewer' : `Show all ${group.identifiers.length}` }}
          </button>
          )
        </span>
      </div>

      <ul class="mb-0 ps-3">
        <li v-for="identifier in (expandedGroups[group.prefix] ? group.identifiers : group.identifiers.slice(0, visibleCount))" :key="identifier.id">
          <a :href="identifier.url" target="_blank" rel="noopener noreferrer">{{ identifier.local_id }}</a>
        </li>
      </ul>

    </div>
  </section>
</template>
