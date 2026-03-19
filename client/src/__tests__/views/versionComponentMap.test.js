import { describe, it, expect } from 'vitest';
import { resolveComponentVersion } from '@/views/datasets/versionComponentMap';
import Dataset_0_1_0 from '@/views/datasets/Dataset_0_1_0.vue';

describe('resolveComponentVersion', () => {
  it('returns Dataset_0_1_0 for version 0.1.1', () => {
    expect(resolveComponentVersion({ schema_version: '0.1.1' })).toBe(Dataset_0_1_0);
  });

  it('returns Dataset_0_1_0 for version 0.1.7', () => {
    expect(resolveComponentVersion({ schema_version: '0.1.7' })).toBe(Dataset_0_1_0);
  });

  it('returns Dataset_0_1_0 for version 0.1.10', () => {
    expect(resolveComponentVersion({ schema_version: '0.1.10' })).toBe(Dataset_0_1_0);
  });

  it('falls back to default component for unknown version', () => {
    const component = resolveComponentVersion({ schema_version: '99.99.99' });
    expect(component).toBe(Dataset_0_1_0);
  });
});
