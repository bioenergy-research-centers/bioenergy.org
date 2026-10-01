import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import RelatedIdentifiers from '@/components/RelatedIdentifiers.vue';
import RelatedItems from '@/components/RelatedItems.vue';
import Dataset_0_1_0 from '@/views/datasets/Dataset_0_1_0.vue';
import Dataset_0_2_0 from '@/views/datasets/Dataset_0_2_0.vue';

// Add new dataset views here when they should share these linked-resource display tests.
const datasetViews = [
  { name: 'Dataset_0_1_0', component: Dataset_0_1_0 },
  { name: 'Dataset_0_2_0', component: Dataset_0_2_0 },
];

const relatedItem = {
  relatedItemType: 'Dataset',
  title: 'Related data record ABCD',
  relatedItemIdentifier: 'https://example.org/related',
};

const enrichedIdentifier = {
  id: 'biosample:SAMN1',
  local_id: 'SAMN1234',
  registered: true,
  url: 'https://example.org/SAMN1',
  registry: {
    prefix: 'biosample',
    name: 'NCBI BioSample',
  },
};

const unresolvedIdentifier = {
  id: 'unknown:1234',
  local_id: '1234',
  registered: false,
  valid: null,
  url: null,
  registry: null,
};

const cases = [
  {
    name: 'no linked resource values',
    resources: {},
    showsHeading: false,
    showsRelatedItem: false,
    showsEnrichedIdentifier: false,
  },
  {
    name: 'unresolved identifiers only',
    resources: { bioregistry_enriched_ids: [unresolvedIdentifier] },
    showsHeading: false,
    showsRelatedItem: false,
    showsEnrichedIdentifier: false,
  },
  {
    name: 'related items only',
    resources: { relatedItem: [relatedItem] },
    showsHeading: true,
    showsRelatedItem: true,
    showsEnrichedIdentifier: false,
  },
  {
    name: 'enriched identifiers only',
    resources: { bioregistry_enriched_ids: [enrichedIdentifier] },
    showsHeading: true,
    showsRelatedItem: false,
    showsEnrichedIdentifier: true,
  },
  {
    name: 'related items and enriched identifiers',
    resources: {
      relatedItem: [relatedItem],
      bioregistry_enriched_ids: [enrichedIdentifier],
    },
    showsHeading: true,
    showsRelatedItem: true,
    showsEnrichedIdentifier: true,
  },
];

describe.each(datasetViews)('$name linked resources', ({ component }) => {
  it.each(cases)('displays data with $name', ({
    resources,
    showsHeading,
    showsRelatedItem,
    showsEnrichedIdentifier,
  }) => {
    const wrapper = mount(component, {
      props: {
        selectedResult: {
          title: 'Dataset title',
          creator: [],
          ...resources,
        },
      },
    });

    const displayedText = wrapper.text();
    const relatedItems = wrapper.findComponent(RelatedItems);
    const relatedIdentifiers = wrapper.findComponent(RelatedIdentifiers);
    const relatedItemsText = relatedItems.exists() ? relatedItems.text() : '';
    const relatedIdentifiersText = relatedIdentifiers.exists() ? relatedIdentifiers.text() : '';

    expect(displayedText.includes('Linked Resources')).toBe(showsHeading);
    expect(relatedItemsText.includes('Dataset')).toBe(showsRelatedItem);
    expect(relatedItemsText.includes('Related data record ABCD')).toBe(showsRelatedItem);
    expect(relatedIdentifiersText.includes('NCBI BioSample')).toBe(showsEnrichedIdentifier);
    expect(relatedIdentifiersText.includes('SAMN1234')).toBe(showsEnrichedIdentifier);
  });
});
