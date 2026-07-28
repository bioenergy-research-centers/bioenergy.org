import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick, reactive } from 'vue';
import McpDocs from '@/views/McpDocs.vue';

const routerMock = vi.hoisted(() => ({
  route: null,
  replace: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => routerMock.route,
  useRouter: () => ({ replace: routerMock.replace }),
}));

vi.mock('@/views/HeaderView.vue', () => ({
  default: { template: '<div />' },
}));

const mountMcpDocs = () => mount(McpDocs);

describe('McpDocs', () => {
  beforeEach(() => {
    routerMock.route = reactive({ query: {}, hash: '' });
    routerMock.replace.mockReset();
  });

  it('selects a tab from the URL and falls back for an unknown tab', async () => {
    routerMock.route.query.tab = 'using-mcp-server';
    const wrapper = mountMcpDocs();

    expect(wrapper.get('[aria-controls="using-mcp-server-tab"]').attributes('aria-selected')).toBe('true');

    routerMock.route.query.tab = 'unknown';
    await nextTick();

    expect(wrapper.get('[aria-controls="getting-started-tab"]').attributes('aria-selected')).toBe('true');
  });

  it('updates the URL when a tab is selected', async () => {
    routerMock.route.query.source = 'test';
    const wrapper = mountMcpDocs();
    routerMock.replace.mockClear();

    await wrapper.get('[aria-controls="using-mcp-server-tab"]').trigger('click');

    expect(routerMock.replace).toHaveBeenCalledWith({
      query: {
        source: 'test',
        tab: 'using-mcp-server',
      },
      hash: '',
    });
  });
});
