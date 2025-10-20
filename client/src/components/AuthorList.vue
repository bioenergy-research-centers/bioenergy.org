<script setup>
  import { computed } from 'vue';
  
  const props = defineProps(['creators']);

  const primaryCreators = computed(() => {
    if(!Array.isArray(props.creators)) { return []; }
    return props.creators.filter(item => item.primaryContact === true);
  });
</script>

<template>
  <div>
    <template v-for="(creator, index) in primaryCreators">
      {{ creator.name }}<span v-if="index !== primaryCreators.length - 1">; </span>
    </template>
  </div>
</template>