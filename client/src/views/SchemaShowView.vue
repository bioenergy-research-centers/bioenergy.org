<template>
  <div class="container py-4">
    <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
      <div>
        <h2 class="mb-1">Schema {{ version }}</h2>
        <div class="text-muted small">
          API endpoint:
          <code>/api/schema/{{ version }}</code>
        </div>
      </div>

      <div class="text-end">
        <router-link class="link-secondary small" to="/datasets">
          ← Back to datasets
        </router-link>
      </div>
    </div>

    <div v-if="loading" class="text-muted">
      Loading schema...
    </div>

    <div v-else-if="error" class="alert alert-danger">
      <div><strong>Error:</strong> {{ error }}</div>

      <div v-if="debug.status" class="small mt-2">
        <div><strong>Status:</strong> {{ debug.status }}</div>
        <div v-if="debug.contentType"><strong>Content-Type:</strong> {{ debug.contentType }}</div>
        <div v-if="debug.url"><strong>URL:</strong> {{ debug.url }}</div>
      </div>
    </div>

    <div v-else>
      <div class="d-flex align-items-center justify-content-between mb-2">
        <div class="text-muted small">
          <span v-if="debug.contentType">Content-Type: <code>{{ debug.contentType }}</code></span>
        </div>

        <a
          class="link-primary small"
          :href="`/api/schema/${encodeURIComponent(version)}`"
          target="_blank"
          rel="noopener noreferrer"
          title="Open raw schema JSON in a new tab"
        >
          Open raw JSON ↗
        </a>
      </div>

      <pre
        class="bg-light p-3 border rounded small"
        style="overflow-x:auto; max-height: 70vh;"
      >{{ formattedSchema }}</pre>
    </div>
  </div>
</template>

<script>
import SchemaDataService from "../services/SchemaDataService";

export default {
  name: "SchemaShowView",

  data() {
    return {
      loading: true,
      error: null,
      schema: null,
      debug: {
        status: null,
        contentType: null,
        url: null,
      },
    };
  },

  computed: {
    version() {
      return this.$route.params.version;
    },

    formattedSchema() {
      if (!this.schema) return "";
      return JSON.stringify(this.schema, null, 2);
    },
  },

  watch: {
    // If user navigates between versions while staying on this view
    "$route.params.version": {
      handler() {
        this.loadSchema();
      },
    },
  },

  mounted() {
    this.loadSchema();
  },

  methods: {
    async loadSchema() {
      this.loading = true;
      this.error = null;
      this.schema = null;
      this.debug = { status: null, contentType: null, url: null };

      try {
        // axios response
        const res = await SchemaDataService.get(this.version);

        this.debug.status = res.status;
        this.debug.contentType = res.headers?.["content-type"] || null;
        this.debug.url = res.config?.url || null;

        this.schema = res.data;
      } catch (err) {
        // axios error handling
        const status = err?.response?.status;
        const contentType = err?.response?.headers?.["content-type"];
        const apiError = err?.response?.data?.error;

        this.debug.status = status || null;
        this.debug.contentType = contentType || null;

        this.error =
          apiError ||
          (status ? `Request failed with status ${status}` : null) ||
          err.message ||
          "Unknown error";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>