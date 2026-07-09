import { describe, it, expect, vi, beforeEach } from 'vitest';
import DatasetDataService from '@/services/DatasetDataService';
import http from '@/http-common';

vi.mock('@/http-common', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('DatasetDataService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('calls GET /datasets with pagination and query params', () => {
      DatasetDataService.getAll({ page: 2, rows: 25, query: 'ethanol', filters: { brc: 'JBEI' }, from_date: '2025-01-01', until_date: '2025-12-31', });
      expect(http.get).toHaveBeenCalledWith('/datasets', {
        params: { page: 2, rows: 25, q: 'ethanol', filters: { brc: 'JBEI' }, nofacets: undefined, from_date: '2025-01-01', until_date: '2025-12-31' },
      });
    });

    it('accepts q as alias for query', () => {
      DatasetDataService.getAll({ q: 'biomass' });
      expect(http.get).toHaveBeenCalledWith('/datasets', {
        params: expect.objectContaining({ q: 'biomass' }),
      });
    });

    it('passes nofacets when set', () => {
      DatasetDataService.getAll({ nofacets: true });
      expect(http.get).toHaveBeenCalledWith('/datasets', {
        params: expect.objectContaining({ nofacets: true }),
      });
    });

    it('works with no options', () => {
      DatasetDataService.getAll();
      expect(http.get).toHaveBeenCalledWith('/datasets', {
        params: { page: undefined, rows: undefined, q: undefined, filters: undefined, nofacets: undefined, from_date: undefined, until_date: undefined },
      });
    });
  });

  describe('get', () => {
    it('calls GET /datasets/:id with encoded id', () => {
      DatasetDataService.get('abc/123');
      expect(http.get).toHaveBeenCalledWith('/datasets/abc%2F123');
    });
  });

  describe('lookup', () => {
    it('calls GET /datasets/lookup/:uid with encoded uid', () => {
      DatasetDataService.lookup('abc/123');
      expect(http.get).toHaveBeenCalledWith('/datasets/lookup/abc%2F123');
    });
  });

  describe('runAdvancedSearch', () => {
    it('calls POST /datasets/ with query and sequence', () => {
      DatasetDataService.runAdvancedSearch('test', 'ATCGATCG');
      expect(http.post).toHaveBeenCalledWith('/datasets/', {
        query: 'test',
        sequence: 'ATCGATCG',
      });
    });
  });

  describe('getMetrics', () => {
    it('calls GET /datasets/metrics', () => {
      DatasetDataService.getMetrics();
      expect(http.get).toHaveBeenCalledWith('/datasets/metrics', undefined);
    });
  });
});
