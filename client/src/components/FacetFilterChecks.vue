<script setup>
  import { computed } from 'vue'

  const model = defineModel()

  const props = defineProps({
    title: { type: String, required: true },
    label: { type: String, required: true },
    items: {type: Array, required: true},
    showCounts: Boolean,
    alphabetical: Boolean,
    reverse: Boolean
  });

  const sortedItems = computed(() => {
    if(!props.items?.sort || !props.items.slice){return [];}
    // slice into a new array to avoid mutating passed object
    let sortedValues = props.items.slice();
    // sort by value name if alphabetical flag is true, otherwise sort by count
    if(props.alphabetical){
      sortedValues = sortedValues.sort((a, b) => a.value?.localeCompare(b.value));
    } else {
      sortedValues = sortedValues.sort((a, b) => b.count - a.count );
    }
    if(props.reverse){
      return sortedValues.reverse();
    } else {
      return sortedValues;
    }
  });

</script>

<template>
  <span class="h5">{{title}}</span>
  <div class="filter-facet-checkbox-list" role="group" :id="`${label}-check-group`" :arial-label="`${label} filter options`">
    <div v-if="sortedItems?.length == 0">
      <small class="text-muted">no {{ label }} options in results</small>
    </div>
    <div v-for="(item, itemIndex) in sortedItems" class="form-check">
      <input class="form-check-input" type="checkbox" :id="`${label}-${itemIndex}-check`" v-model="model" :value="item.value">
      <label class="form-check-label" :for="`${label}-${itemIndex}-check`" >
        <span>{{ item.value }}</span> <span v-if="showCounts" class="small">({{ item.count }})</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
  .filter-facet-checkbox-list {
    border: solid #ddd;
    border-width: 0px 0px 1px 0px;
    padding: .5rem .75rem;
    margin-bottom: 1rem;
    max-height: 10rem;
    overflow-y: auto;
  }
  .form-check-input, .form-check-label {
    cursor: pointer;
  }
</style>