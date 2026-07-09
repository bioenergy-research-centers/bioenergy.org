<script setup>
import AuthorList from '@/components/AuthorList.vue';
import sanitizeHtml from 'sanitize-html';

const ALLOWED_HTML = { allowedTags: [ 'b', 'i', 'sub', 'sup'], allowedAttributes: {} };

defineProps(['item']);

const truncateMiddle = (str, maxStart = 100, maxEnd = 50) => {
  if (str.length <= maxStart + maxEnd) return str;
  return str.slice(0, maxStart) + "…" + str.slice(-maxEnd);
}
</script>

<template>
  <div class="list-group-item-content py-2">
    <div class="row">
      <div class="col-md order-md-1 fs-6 fw-bold order-1">
        <router-link :to="{ name: 'datasetShow', params: { id: item.uid } }" class="pe-4">
          <span
            v-html="sanitizeHtml(truncateMiddle(item.title || 'Untitled data set', 75, 50), ALLOWED_HTML)"
          ></span>
        </router-link>
      </div>
    </div>

    <div class="row">
      <div class="fs-6 fw-light">
        <AuthorList :creators="item.creator" />
      </div>
    </div>

    <div class="row">
      <div class="mt-2">
        <p>
          <small
            v-html="sanitizeHtml(truncateMiddle(item.description || 'No description of this data set is available.', 150, 75), ALLOWED_HTML)"
          ></small>
        </p>
      </div>
    </div>

    <div class="row mt-1 fs-6">
      <div class="col-12 col-md">
        <span v-if="item.analysisType && item.analysisType.toLowerCase() !== 'not specified'" class="text-muted fw-lighter">
          {{ item.analysisType }}
        </span>
      </div>
      <div class="col-12 col-md-auto text-md-end ps-md-3">
        <div class="d-inline-flex flex-row-reverse flex-md-row flex-wrap gap-1 justify-content-start justify-content-md-end">
          <span class="badge bg-light text-muted fw-light">{{ item.repository }}</span>
          <span class="badge bg-brc-light-blue fw-light text-muted">{{ item.date }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-group-item-content {
  overflow: hidden;
  overflow-wrap: anywhere;
}
</style>
