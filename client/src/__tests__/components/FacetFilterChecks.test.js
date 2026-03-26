import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FacetFilterChecks from '@/components/FacetFilterChecks.vue';

describe('FacetFilterChecks', () => {
  const baseProps = {
    title: 'BRC',
    label: 'brc',
    items: [
      { value: 'JBEI', count: 10 },
      { value: 'GLBRC', count: 25 },
      { value: 'CABBI', count: 5 },
    ],
    modelValue: [],
  };

  it('renders title and all items', () => {
    const wrapper = mount(FacetFilterChecks, { props: baseProps });
    expect(wrapper.text()).toContain('BRC');
    expect(wrapper.text()).toContain('JBEI');
    expect(wrapper.text()).toContain('GLBRC');
    expect(wrapper.text()).toContain('CABBI');
  });

  it('sorts by count descending by default', () => {
    const wrapper = mount(FacetFilterChecks, { props: baseProps });
    const labels = wrapper.findAll('.form-check-label');
    expect(labels[0].text()).toContain('GLBRC');
    expect(labels[1].text()).toContain('JBEI');
    expect(labels[2].text()).toContain('CABBI');
  });

  it('sorts alphabetically when alphabetical prop is set', () => {
    const wrapper = mount(FacetFilterChecks, { props: { ...baseProps, alphabetical: true } });
    const labels = wrapper.findAll('.form-check-label');
    expect(labels[0].text()).toContain('CABBI');
    expect(labels[1].text()).toContain('GLBRC');
    expect(labels[2].text()).toContain('JBEI');
  });

  it('reverses sort order when reverse prop is set', () => {
    const wrapper = mount(FacetFilterChecks, { props: { ...baseProps, reverse: true } });
    const labels = wrapper.findAll('.form-check-label');
    expect(labels[0].text()).toContain('CABBI');
    expect(labels[2].text()).toContain('GLBRC');
  });

  it('shows counts when showCounts is true', () => {
    const wrapper = mount(FacetFilterChecks, { props: { ...baseProps, showCounts: true } });
    expect(wrapper.text()).toContain('(25)');
    expect(wrapper.text()).toContain('(10)');
  });

  it('shows empty message when items array is empty', () => {
    const wrapper = mount(FacetFilterChecks, { props: { ...baseProps, items: [] } });
    expect(wrapper.text()).toContain('no brc options in results');
  });

  it('handles undefined items gracefully', () => {
    const wrapper = mount(FacetFilterChecks, { props: { ...baseProps, items: undefined } });
    expect(wrapper.text()).toContain('no brc options in results');
  });
});
