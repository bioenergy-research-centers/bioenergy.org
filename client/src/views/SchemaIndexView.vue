<script setup lang="ts">
import HeaderView from "@/views/HeaderView.vue";
import SchemaDataService from "../services/SchemaDataService";
import { ref, onMounted } from "vue";

const loading = ref(true);
const error = ref<string | null>(null);
const versions = ref<string[]>([]);

onMounted(async () => {
  try {
    const res = await SchemaDataService.getSupported();
    versions.value = res.data?.supported || [];
  } catch (err: any) {
    const apiError = err?.response?.data?.error;
    error.value = apiError || err.message || "Unknown error";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <HeaderView />

  <div class="container py-4">
    <h2 class="mb-3">Schemas</h2>

    <div v-if="loading" class="text-muted">
      Loading...
    </div>

    <div v-else-if="error" class="alert alert-danger">
      <strong>Error:</strong> {{ error }}
    </div>

    <div v-else>
      <div class="text-muted small mb-2">
        Available schema versions ({{ versions.length }})
      </div>

      <ul class="list-group">
        <li
          v-for="v in versions"
          :key="v"
          class="list-group-item d-flex justify-content-between align-items-center"
        >
          <router-link :to="`/schema/${v}`" class="link-primary">
            {{ v }}
          </router-link>

          <a
            class="link-secondary small"
            :href="`/api/schema/${encodeURIComponent(v)}`"
            target="_blank"
            rel="noopener noreferrer"
            title="Open raw schema JSON"
          >
            raw ↗
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
</style>