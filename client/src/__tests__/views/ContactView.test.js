import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ContactView from '@/views/ContactView.vue';

// Mock useTurnstile composable
vi.mock('@/composables/useTurnstile', () => ({
  useTurnstile: vi.fn(),
}));

// Mock MessageDataService
const mockCreate = vi.fn();
vi.mock('@/services/MessageDataService', () => ({
  default: { create: (...args) => mockCreate(...args) },
}));

function mountContact() {
  return mount(ContactView, {
    global: {
      stubs: {
        HeaderView: { template: '<div />' },
      },
    },
  });
}

describe('ContactView', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the contact form', () => {
    const wrapper = mountContact();
    expect(wrapper.find('form').exists()).toBe(true);
    expect(wrapper.text()).toContain('Contact Us');
  });

  it('renders contact reason options', () => {
    const wrapper = mountContact();
    const options = wrapper.findAll('option');
    expect(options.length).toBeGreaterThanOrEqual(3);
    expect(wrapper.text()).toContain('Adding data to the site');
    expect(wrapper.text()).toContain('Site feature/bug/update');
  });

  it('disables submit button when agree checkbox is unchecked', () => {
    const wrapper = mountContact();
    const button = wrapper.find('button[type="submit"]');
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('enables submit button when agree checkbox is checked', async () => {
    const wrapper = mountContact();
    await wrapper.find('#contactAgreeCheck').setValue(true);
    const button = wrapper.find('button[type="submit"]');
    expect(button.attributes('disabled')).toBeUndefined();
  });

  it('shows success message on successful submission', async () => {
    mockCreate.mockResolvedValue({ data: { success: true, message: 'Message saved.' } });
    const wrapper = mountContact();
    await wrapper.find('#contactAgreeCheck').setValue(true);
    await wrapper.find('form').trigger('submit');
    await vi.dynamicImportSettled();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Thank you for your feedback');
  });

  it('shows error message on failed submission', async () => {
    mockCreate.mockResolvedValue({ data: { error: 'Something went wrong.' } });
    const wrapper = mountContact();
    await wrapper.find('#contactAgreeCheck').setValue(true);
    await wrapper.find('form').trigger('submit');
    await vi.dynamicImportSettled();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Something went wrong');
  });

  it('shows network error on exception', async () => {
    mockCreate.mockRejectedValue(new Error('Network failure'));
    const wrapper = mountContact();
    await wrapper.find('#contactAgreeCheck').setValue(true);
    await wrapper.find('form').trigger('submit');
    await vi.dynamicImportSettled();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Network error');
  });
});
