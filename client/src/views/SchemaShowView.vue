<script setup lang="ts">
import HeaderView from "@/views/HeaderView.vue";
import SchemaDataService from "../services/SchemaDataService";
import { computed, ref, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();

const goBack = () => {
  router.back();
};

const route = useRoute();

const version = computed(() => route.params.version as string);

const schema = ref(null);
const loading = ref(true);
const error = ref<string | null>(null);

const debug = ref({
  status: null as number | null,
  contentType: null as string | null,
  url: null as string | null,
});

const formattedSchema = computed(() => {
  return schema.value ? JSON.stringify(schema.value, null, 2) : "";
});

watchEffect(async () => {
  error.value = null;
  loading.value = true;
  schema.value = null;
  debug.value = {
    status: null,
    contentType: null,
    url: null,
  };

  if (!version.value) {
    loading.value = false;
    error.value = "No schema version provided.";
    return;
  }

  try {
    const res = await SchemaDataService.get(version.value);
    debug.value = {
      status: res.status ?? null,
      contentType: res.headers?.["content-type"] ?? null,
      url: res.config?.url ?? null,
    };
    schema.value = res.data;
  } catch (err: any) {
    debug.value = {
      status: err?.response?.status ?? null,
      contentType: err?.response?.headers?.["content-type"] ?? null,
      url: err?.config?.url ?? null,
    };

    const apiError = err?.response?.data?.error;
    error.value =
      apiError ||
      (err?.response?.status ? `Request failed with status ${err.response.status}` : null) ||
      err?.message ||
      "Unknown error";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <HeaderView />

  <div class="container py-4">
    <div class="d-flex align-items-start justify-content-between gap-3">
      <div>
        <h2 class="mb-1">Schema {{ version }}</h2>
      </div>
      <div class="text-end">
        <button @click="goBack" class="btn btn-dark rounded-pill px-3 pe-4 fw-bold fs-5">
          <i class="bi bi-arrow-left pe-3" aria-hidden="true"></i>Return to previous page
        </button>
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
        <div class="d-flex flex-column text-muted small">
          <div>
            API endpoint:
            <code>/api/schema/{{ version }}</code>
          </div>

          <div v-if="debug.contentType">
            Content-Type:
            <code>{{ debug.contentType }}</code>
          </div>
        </div>

        <div class="d-flex gap-3">
          <a
            class="link-primary small"
            :href="`/api/schema/${encodeURIComponent(version)}`"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open raw JSON ↗
          </a>

          <router-link class="link-secondary small" to="/schema">
            List available schemas
          </router-link>
        </div>
      </div>

      <pre
        class="bg-light p-3 border rounded small"
        style="overflow-x: auto; max-height: 70vh;"
      >{{ formattedSchema }}</pre>
    </div>
  </div>
</template>

<style scoped>
</style>