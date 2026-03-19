import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '@/App.vue';

describe('App', () => {
  it('renders Footer component', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterView: { template: '<div class="stub-router-view"><slot :Component="\'div\'" /></div>' },
          Footer: { template: '<footer data-testid="footer">Footer</footer>' },
        },
      },
    });
    expect(wrapper.find('[data-testid="footer"]').exists()).toBe(true);
  });
});
