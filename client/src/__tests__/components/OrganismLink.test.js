import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import OrganismLink from '@/components/OrganismLink.vue';

describe('OrganismLink', () => {
  it('renders NCBI link when both scientificName and NCBITaxID are present', () => {
    const wrapper = mount(OrganismLink, {
      props: { organism: { scientificName: 'Saccharomyces cerevisiae', NCBITaxID: '4932' } },
    });
    const link = wrapper.find('a');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toContain('4932');
    expect(link.text()).toContain('Saccharomyces cerevisiae');
  });

  it('renders name without link when NCBITaxID is missing', () => {
    const wrapper = mount(OrganismLink, {
      props: { organism: { scientificName: 'Unknown species' } },
    });
    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.text()).toContain('Unknown species');
  });

  it('renders nothing when organism is null', () => {
    const wrapper = mount(OrganismLink, {
      props: { organism: null },
    });
    expect(wrapper.text()).toBe('');
  });
});
