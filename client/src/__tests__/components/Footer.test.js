import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import Footer from '@/components/Footer.vue';

describe('Footer', () => {
  const wrapper = mount(Footer, {
    global: {
      stubs: { RouterLink: { template: '<a><slot /></a>' } },
    },
  });

  it('renders the DOE disclosure text', () => {
    expect(wrapper.text()).toContain('Office of Science');
  });

  it('renders copyright year', () => {
    expect(wrapper.text()).toContain('2025');
  });

  it('renders Contact Us link', () => {
    expect(wrapper.text()).toContain('Contact Us');
  });

  it('renders Developer API Docs link', () => {
    expect(wrapper.text()).toContain('Developer API Docs');
  });

  it('renders GitHub link', () => {
    const ghLink = wrapper.find('a[href="https://github.com/bioenergy-research-centers/"]');
    expect(ghLink.exists()).toBe(true);
  });
});
