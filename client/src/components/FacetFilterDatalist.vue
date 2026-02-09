<script setup>
  import { computed } from 'vue'

  const model = defineModel()
  const props = defineProps({
    title: { type: String, required: true },
    label: { type: String, required: true },
    items: {type: Array, required: true},
    placeholder: String,
    alphabetical: Boolean
  });

  const sortedItems = computed(() => {
    if(!props.items?.sort){return []}
    // sort by value name if alphabetical flag is true, otherwise sort by count
    if(props.alphabetical){
      return props.items?.sort((a, b) => a.value?.localeCompare(b.value))
    } else {
      return props.items?.sort((a, b) => b.count - a.count )
    }
  });

</script>

<template>
  <label class="form-label h5" for="`${label}-${itemIndex}-facet-datalist-select`">{{ title }}</label>
  <input class="filter-facet-datalist form-control form-control-sm" :list="`${label}FacetDatalistOptions`" id="`${label}-${itemIndex}-facet-datalist-select`" :placeholder v-model="model" autocomplete="off">
  <datalist :id="`${label}FacetDatalistOptions`">
    <option v-for="item in sortedItems" :value="`${item?.value}`"></option>
  </datalist>
  </input>
</template>

<style scoped>
  .filter-facet-datalist {
    margin-bottom: 1rem;
  }
</style>