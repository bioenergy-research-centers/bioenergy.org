<script setup>
import { computed } from 'vue';
import AuthorList from '@/components/AuthorList.vue';
import { pluralizeAuthors } from '@/utils/pluralize';
import { sanitizeDatasetHtml } from '@/utils/sanitizeDatasetHtml';
import { selectVisibleCreators } from '@/utils/visibleCreators';

const searchAuthorMaxVisible = 3;

const props = defineProps(['item']);

// What matched a text search (see SearchHighlights in the API docs). Empty when browsing.
const highlights = computed(() => props.item.highlights ?? {});

// Indexed fields a list item does not show, in display order. When nothing the item shows
// is marked, a match in one of them is listed on a "Matching fields" line so the result still
// says why it was found. Analysis type and repository are shown, so they are marked in place.
const MATCHING_FIELDS = [
  ['datasetName', 'Dataset name'],
  ['identifier', 'Identifier'],
  ['keywords', 'Keywords'],
  ['species', 'Species'],
  ['strains', 'Strains'],
  ['topic', 'Topic'],
  ['theme', 'Theme'],
  ['journal_name', 'Journal'],
  ['brc', 'BRC'],
];
const MATCHING_FIELDS_MAX_VALUES = 3;

// A value identical to the title (often the case for datasetName) would only repeat it.
const unmarked = (html) => html.replace(/<\/?mark>/g, '');

const markedAnalysisType = computed(() => highlights.value.matchedIn?.analysisType?.[0]);
const markedRepository = computed(() => highlights.value.matchedIn?.repository?.[0]);

// Whether something already on screen is marked, which explains the match by itself.
const hasVisibleMatch = computed(() => {
  const h = highlights.value;
  return Boolean(
    h.title || h.snippet || h.creators?.length || h.contributors?.length ||
    markedAnalysisType.value || markedRepository.value
  );
});

const matchingFields = computed(() => hasVisibleMatch.value ? [] :
  MATCHING_FIELDS.flatMap(([key, label]) => {
    const values = (highlights.value.matchedIn?.[key] ?? [])
      .filter((value) => unmarked(value) !== props.item.title);
    if (values.length === 0) return [];
    return [{
      key,
      label,
      shown: values.slice(0, MATCHING_FIELDS_MAX_VALUES),
      more: values.length - MATCHING_FIELDS_MAX_VALUES,
    }];
  })
);

// Creators not shown in the trimmed author list. A matched author past the first three is
// shown, so is not counted here.
const hiddenAuthorCount = computed(() => {
  const creators = props.item.creator;
  if (!Array.isArray(creators)) return 0;
  return creators.length - selectVisibleCreators(creators, searchAuthorMaxVisible, highlights.value.creators).length;
});

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
            v-if="highlights.title"
            v-html="sanitizeDatasetHtml(highlights.title)"
          ></span>
          <span
            v-else
            v-html="sanitizeDatasetHtml(truncateMiddle(item.title || 'Untitled data set', 75, 50))"
          ></span>
        </router-link>
      </div>
    </div>

    <div class="row">
      <div class="fs-6 fw-light">
        <AuthorList
          :creators="item.creator"
          :max-visible="searchAuthorMaxVisible"
          :highlighted-names="highlights.creators"
        />
        <span
          v-if="hiddenAuthorCount > 0"
          class="small text-muted"
        >
          +{{ hiddenAuthorCount }} more
          {{ pluralizeAuthors(hiddenAuthorCount) }}
        </span>
      </div>
    </div>

    <!-- Contributors are not listed in results, so a match on one is shown here. -->
    <div v-if="highlights.contributors?.length" class="row">
      <div class="small text-muted contributor-matches">
        Contributor:
        <template v-for="(name, index) in highlights.contributors" :key="name + index">
          <mark>{{ name }}</mark><span v-if="index !== highlights.contributors.length - 1">; </span>
        </template>
      </div>
    </div>

    <div class="row">
      <div class="mt-2">
        <p>
          <small v-if="highlights.snippet" class="snippet">
            <span v-if="highlights.snippetField === 'abstract'" class="text-muted">From the abstract: </span>
            <span v-html="sanitizeDatasetHtml(highlights.snippet)"></span>
          </small>
          <small
            v-else
            v-html="sanitizeDatasetHtml(truncateMiddle(item.description || 'No description of this data set is available.', 150, 75))"
          ></small>
        </p>
      </div>
    </div>

    <div v-if="matchingFields.length" class="row">
      <div class="small text-muted matching-fields mb-2">
        <strong>Matching fields</strong> —
        <template v-for="(field, fieldIndex) in matchingFields" :key="field.key">
          <span v-if="fieldIndex > 0"> · </span>
          {{ field.label }}:
          <template v-for="(value, valueIndex) in field.shown" :key="field.key + valueIndex">
            <span v-if="valueIndex > 0">, </span><span v-html="sanitizeDatasetHtml(value)"></span>
          </template>
          <span v-if="field.more > 0"> +{{ field.more }} more</span>
        </template>
      </div>
    </div>

    <div class="row mt-1 fs-6">
      <div class="col-12 col-md">
        <span v-if="markedAnalysisType" class="text-muted fw-lighter" v-html="sanitizeDatasetHtml(markedAnalysisType)"></span>
        <span v-else-if="item.analysisType && item.analysisType.toLowerCase() !== 'not specified'" class="text-muted fw-lighter">
          {{ item.analysisType }}
        </span>
      </div>
      <div class="col-12 col-md-auto text-md-end ps-md-3">
        <div class="d-inline-flex flex-row-reverse flex-md-row flex-wrap gap-1 justify-content-start justify-content-md-end">
          <span v-if="markedRepository" class="badge bg-light text-muted fw-light" v-html="sanitizeDatasetHtml(markedRepository)"></span>
          <span v-else class="badge bg-light text-muted fw-light">{{ item.repository }}</span>
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

/* Search matches, including names marked inside AuthorList. The colour is set site-wide
   in assets/main.css. */
.list-group-item-content :deep(mark) {
  padding: 0.2rem 0.1em;
}
</style>
