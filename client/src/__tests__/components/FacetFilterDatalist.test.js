import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FacetFilterDatalist from '@/components/FacetFilterDatalist.vue';

describe('FacetFilterDatalist', () => {
  const baseProps = {
    title: 'Species',
    label: 'species',
    items: [
      { value: 'Saccharomyces', count: 15 },
      { value: 'Arabidopsis', count: 30 },
      { value: 'Zymomonas', count: 5 },
    ],
    modelValue: '',
  };

  it('renders title and input', () => {
    const wrapper = mount(FacetFilterDatalist, { props: baseProps });
    expect(wrapper.text()).toContain('Species');
    expect(wrapper.find('input').exists()).toBe(true);
  });

  it('renders datalist options', () => {
    const wrapper = mount(FacetFilterDatalist, { props: baseProps });
    const options = wrapper.findAll('option');
    expect(options).toHaveLength(3);
  });

  it('sorts by count by default', () => {
    const wrapper = mount(FacetFilterDatalist, { props: baseProps });
    const options = wrapper.findAll('option');
    expect(options[0].attributes('value')).toBe('Arabidopsis');
  });

  it('sorts alphabetically when alphabetical prop is set', () => {
    const wrapper = mount(FacetFilterDatalist, { props: { ...baseProps, alphabetical: true } });
    const options = wrapper.findAll('option');
    expect(options[0].attributes('value')).toBe('Arabidopsis');
    expect(options[1].attributes('value')).toBe('Saccharomyces');
    expect(options[2].attributes('value')).toBe('Zymomonas');
  });

  it('handles empty items', () => {
    const wrapper = mount(FacetFilterDatalist, { props: { ...baseProps, items: [] } });
    expect(wrapper.findAll('option')).toHaveLength(0);
  });
});
