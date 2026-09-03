import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import RelatedItems from '@/components/RelatedItems.vue';

describe('RelatedItems', () => {
  it('groups items by type and renders each type heading once', () => {
    const wrapper = mount(RelatedItems, {
      props: {
        items: [
          { relatedItemType: 'Journal Article', title: 'Article One', relatedItemIdentifier: 'https://example.org/one' },
          { relatedItemType: 'Journal Article', title: 'Article Two', relatedItemIdentifier: 'https://example.org/two' },
          { relatedItemType: 'Dataset', title: 'Dataset One', relatedItemIdentifier: 'https://example.org/dataset' },
        ],
      },
    });

    const journalArticleGroup = wrapper.get('[data-related-item-type="Journal Article"]');

    expect(wrapper.findAll('[data-related-item-type="Journal Article"]')).toHaveLength(1);
    expect(journalArticleGroup.findAll('li')).toHaveLength(2);
    expect(journalArticleGroup.text()).toContain('Article One');
    expect(journalArticleGroup.text()).toContain('Article Two');

    expect(wrapper.get('[data-related-item-type="Dataset"]').findAll('li')).toHaveLength(1);
  });

  it('does not render an empty section', () => {
    const wrapper = mount(RelatedItems, { props: { items: [] } });

    expect(wrapper.find('section').exists()).toBe(false);
  });

  it('limits large groups and expands them on request', async () => {
    const wrapper = mount(RelatedItems, {
      props: {
        items: Array.from({ length: 6 }, (_, index) => ({
          relatedItemType: 'Dataset',
          title: `Dataset ${index}`,
          relatedItemIdentifier: `https://example.org/${index}`,
        })),
      },
    });

    const datasetGroup = wrapper.get('[data-related-item-type="Dataset"]');

    expect(wrapper.text()).toContain('Show all 6');
    expect(datasetGroup.findAll('li')).toHaveLength(5);

    await wrapper.get('button').trigger('click');

    expect(wrapper.text()).toContain('Show fewer');
    expect(datasetGroup.findAll('li')).toHaveLength(6);
  });
});
