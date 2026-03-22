import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AuthorList from '@/components/AuthorList.vue';

describe('AuthorList', () => {
  const creators = [
    { name: 'Dr. Smith', primaryContact: true, email: 'smith@example.com', affiliation: 'MIT' },
    { name: 'Dr. Jones', primaryContact: false, affiliation: 'Stanford' },
  ];

  it('renders all creator names', () => {
    const wrapper = mount(AuthorList, { props: { creators } });
    expect(wrapper.text()).toContain('Dr. Smith');
    expect(wrapper.text()).toContain('Dr. Jones');
  });

  it('shows email icon only for primary contacts', () => {
    const wrapper = mount(AuthorList, { props: { creators } });
    const envelopeIcons = wrapper.findAll('.bi-envelope');
    expect(envelopeIcons).toHaveLength(1);
  });

  it('shows affiliation icon for all creators', () => {
    const wrapper = mount(AuthorList, { props: { creators } });
    const infoIcons = wrapper.findAll('.bi-info-circle');
    expect(infoIcons).toHaveLength(2);
  });

  it('shows semicolons between creators but not after the last', () => {
    const wrapper = mount(AuthorList, { props: { creators } });
    const text = wrapper.text();
    expect(text).toContain(';');
    expect(text.endsWith(';')).toBe(false);
  });

  it('handles empty creators array', () => {
    const wrapper = mount(AuthorList, { props: { creators: [] } });
    expect(wrapper.text()).toBe('');
  });

  it('handles non-array creators prop', () => {
    const wrapper = mount(AuthorList, { props: { creators: null } });
    expect(wrapper.text()).toBe('');
  });
});
