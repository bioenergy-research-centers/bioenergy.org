<script setup lang="ts">
import {RouterLink, useRoute, useRouter} from "vue-router";
import headerIcon from "@/assets/brc-bioenergy-icon.png"
import {onBeforeMount, ref} from "vue";
import {useSearchStore} from '@/store/searchStore';

const docs_link = import.meta.env.VITE_BIOENERGY_ORG_API_URI + "/api-docs";

const router = useRouter();
const route = useRoute();
const searchStore = useSearchStore();

const searchText = ref('');
const dnaSequence = ref('');

onBeforeMount(() => {
  const query = route.query.q as string || '';
  if (query)
    searchText.value = query as string;
})

const onSubmit = () => {
  // save sequence to the store
  searchStore.setDnaSequence(dnaSequence.value);

  // navigate to /data with search text in the URL
  router.push({
    path: '/data',
    query: {
      q: searchText.value,
    },
  });
};

const clearSequence = () => {
  searchStore.clearSearchData();
  dnaSequence.value = '';
};
</script>

<template>
  <header class="sticky-sm-top p-3 shadow-sm bg-white">
    <div class="container">
      <div class="row">
        <div class="col-md-12 col-lg-6">
          <router-link to="/" class="navbar-brand">
            <img :src="headerIcon" alt="" width="66" height="72" class="d-inline-block align-text-bottom">
            Bioenergy.org
          </router-link>
        </div>

        <div class="col-md-12 col-lg-6 d-flex align-items-center">
          <form @submit.prevent="onSubmit" class="flex-grow-1">
            <div class="input-group">
              <!-- Main Search Input -->
              <input class="form-control" placeholder="Search bioenergy.org" v-model="searchText"/>
              <button type="submit" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-search text-muted"></i>
              </button>

              <!-- Advanced Search Dropdown Toggle -->
              <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown"
                      aria-expanded="false">
                Advanced
              </button>

              <!-- Advanced Search Dropdown -->
              <ul class="dropdown-menu p-3">
                <li>
                  <textarea class="form-control" rows="3" placeholder="Enter sequence..."
                            v-model="dnaSequence"></textarea>
                </li>
                <li class="mt-2">
                  <button type="submit" class="btn btn-sm btn-primary">
                    Run Sequence Search
                  </button>&nbsp;
                  <button type="button" class="btn btn-sm btn-secondary" @click.prevent="clearSequence" v-if="searchStore.dnaSequence">
                    Clear
                  </button>
                </li>
              </ul>
            </div>
          </form>
        </div>

      </div>
      <div class="row mt-2">
        <hr>
        <div class="col-12 text-center">
          <router-link to="/data" class="small text-muted me-3">
            Datasets
          </router-link>
          <router-link to="/contact" class=" small text-muted me-3">
            Contact
          </router-link>
          <a :href="docs_link" class="small text-muted" target="_blank" rel="noopener noreferrer">API Docs</a>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.dropdown-menu {
  display: none;
  position: absolute;
  z-index: 1000;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
}

.dropdown-menu.show {
  display: block;
}

textarea {
  resize: none;
}
</style>
