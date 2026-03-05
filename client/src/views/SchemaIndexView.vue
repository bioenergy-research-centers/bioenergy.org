<template>
  <div class="container py-4">
    <h2 class="mb-3">Schemas</h2>

    <div v-if="loading" class="text-muted">Loading...</div>

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

<script>
import SchemaDataService from "../services/SchemaDataService";

export default {
  name: "SchemaIndexView",

  data() {
    return {
      loading: true,
      error: null,
      versions: [],
    };
  },

  async mounted() {
    try {
      const res = await SchemaDataService.getSupported();
      this.versions = res.data?.supported || [];
    } catch (err) {
      const apiError = err?.response?.data?.error;
      this.error = apiError || err.message || "Unknown error";
    } finally {
      this.loading = false;
    }
  },
};
</script>