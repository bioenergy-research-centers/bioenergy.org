import { describe, it, expect, vi, beforeEach } from 'vitest';
import SchemaDataService from '@/services/SchemaDataService';
import http from '@/http-common';

vi.mock('@/http-common', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('SchemaDataService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getSupported calls GET /schema', () => {
    SchemaDataService.getSupported();
    expect(http.get).toHaveBeenCalledWith('/schema');
  });

  it('get calls GET /schema/:version with encoded version', () => {
    SchemaDataService.get('0.1.7');
    expect(http.get).toHaveBeenCalledWith('/schema/0.1.7');
  });
});
