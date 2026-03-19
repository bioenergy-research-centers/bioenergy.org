import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { useTurnstile } from '@/composables/useTurnstile';

describe('useTurnstile', () => {
  beforeEach(() => {
    delete window.turnstile;
    delete window.onloadTurnstileCallback;
  });

  afterEach(() => {
    delete window.turnstile;
    delete window.onloadTurnstileCallback;
    // Clean up any scripts added
    document.querySelectorAll('script[src*="turnstile"]').forEach((s) => s.remove());
  });

  function mountWithTurnstile() {
    const TestComponent = defineComponent({
      setup() {
        useTurnstile('#turnstile');
      },
      template: '<div id="turnstile"></div>',
    });
    return mount(TestComponent);
  }

  it('adds turnstile script to document head on mount', () => {
    mountWithTurnstile();
    const script = document.querySelector('script[src*="turnstile"]');
    expect(script).not.toBeNull();
  });

  it('sets onloadTurnstileCallback on window', () => {
    mountWithTurnstile();
    expect(typeof window.onloadTurnstileCallback).toBe('function');
  });

  it('calls turnstile.render when callback fires and turnstile is available', () => {
    const mockRender = vi.fn().mockReturnValue('widget-1');
    window.turnstile = { render: mockRender, remove: vi.fn(), reset: vi.fn() };

    mountWithTurnstile();

    // Simulating the already-loaded path: since window.turnstile exists,
    // onloadTurnstileCallback is called immediately
    expect(mockRender).toHaveBeenCalledWith('#turnstile', expect.objectContaining({ sitekey: expect.anything() }));
  });

  it('calls turnstile.remove on unmount', () => {
    const mockRemove = vi.fn();
    const mockRender = vi.fn().mockReturnValue('widget-1');
    window.turnstile = { render: mockRender, remove: mockRemove, reset: vi.fn() };

    const wrapper = mountWithTurnstile();
    wrapper.unmount();

    expect(mockRemove).toHaveBeenCalledWith('widget-1');
  });
});
