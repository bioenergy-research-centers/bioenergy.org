import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSearchStore } from '@/store/searchStore';

// Mock vue-router
const mockPush = vi.fn();
const mockRoute = { query: {} };
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => mockRoute,
}));

// Mock DatasetDataService
const mockGetAll = vi.fn();
const mockRunAdvancedSearch = vi.fn();
vi.mock('@/services/DatasetDataService', () => ({
  default: {
    getAll: (...args) => mockGetAll(...args),
    runAdvancedSearch: (...args) => mockRunAdvancedSearch(...args),
  },
}));

describe('searchStore', () => {
  let store;

  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    store = useSearchStore();
    mockRoute.query = {};
  });

  describe('initial state', () => {
    it('has empty defaults', () => {
      expect(store.searchTerm).toBe('');
      expect(store.searchResults).toEqual([]);
      expect(store.searchResultsLoading).toBe(false);
      expect(store.searchResultsError).toBeNull();
      expect(store.currentPage).toBe(1);
      expect(store.pageSize).toBe(50);
      expect(store.totalPages).toBe(1);
      expect(store.totalResults).toBe(0);
    });
  });

  describe('clearSearchData', () => {
    it('resets all state to defaults', () => {
      store.searchTerm = 'ethanol';
      store.searchResults = [{ uid: '1' }];
      store.currentPage = 5;
      store.totalResults = 100;

      store.clearSearchData();

      expect(store.searchTerm).toBe('');
      expect(store.searchResults).toEqual([]);
      expect(store.currentPage).toBe(1);
      expect(store.totalResults).toBe(0);
      expect(store.dnaSequence).toBe('');
      expect(store.facets).toEqual({});
    });
  });

  describe('filter fields', () => {
    it('brc getter returns empty array by default', () => {
      expect(store.brc).toEqual([]);
    });

    it('brc setter updates filters', () => {
      store.brc = ['JBEI', 'GLBRC'];
      expect(store.filters.brc).toEqual(['JBEI', 'GLBRC']);
    });

    it('setting empty array removes filter key', () => {
      store.brc = ['JBEI'];
      store.brc = [];
      expect(store.filters.brc).toBeUndefined();
    });

    it('setting null removes filter key', () => {
      store.species = 'Saccharomyces';
      store.species = null;
      expect(store.filters.species).toBeUndefined();
    });

    it('setting empty string removes filter key', () => {
      store.personName = 'Smith';
      store.personName = '';
      expect(store.filters.personName).toBeUndefined();
    });

    it('string filter fields work correctly', () => {
      store.species = 'Saccharomyces';
      expect(store.species).toBe('Saccharomyces');
      expect(store.filters.species).toBe('Saccharomyces');
    });

    it('array filter fields work correctly', () => {
      store.year = ['2024', '2023'];
      expect(store.year).toEqual(['2024', '2023']);
    });
  });

  describe('runSearch', () => {
    it('fetches paginated results and stores them', async () => {
      mockGetAll.mockResolvedValue({
        data: {
          items: [{ uid: '1', title: 'Dataset A' }],
          totalPages: 3,
          totalResults: 25,
          query: { page: 1 },
          facets: { brc: [{ value: 'JBEI', count: 10 }] },
        },
      });

      store.searchTerm = 'ethanol';
      await store.runSearch(false);

      expect(mockGetAll).toHaveBeenCalledWith({
        page: 1,
        rows: 50,
        query: 'ethanol',
        filters: {},
      });
      expect(store.searchResults).toEqual([{ uid: '1', title: 'Dataset A' }]);
      expect(store.totalPages).toBe(3);
      expect(store.totalResults).toBe(25);
      expect(store.searchResultsLoading).toBe(false);
    });

    it('handles raw array response (advanced search)', async () => {
      mockGetAll.mockResolvedValue({
        data: [{ uid: '1' }, { uid: '2' }],
      });

      await store.runSearch(false);

      expect(store.searchResults).toEqual([{ uid: '1' }, { uid: '2' }]);
      expect(store.totalResults).toBe(2);
      expect(store.totalPages).toBe(1);
    });

    it('uses advanced search when dnaSequence is set', async () => {
      mockRunAdvancedSearch.mockResolvedValue({
        data: [{ uid: '1' }],
      });

      store.dnaSequence = 'ATCGATCG';
      store.searchTerm = 'query';
      await store.runSearch(false);

      expect(mockRunAdvancedSearch).toHaveBeenCalledWith('query', 'ATCGATCG');
    });

    it('sets error on failure', async () => {
      mockGetAll.mockRejectedValue(new Error('Network error'));

      await store.runSearch(false);

      expect(store.searchResults).toEqual([]);
      expect(store.searchResultsError).toBe('Failed to fetch search results.');
      expect(store.searchResultsLoading).toBe(false);
    });

    it('resets page to 1 when filter changes are pending', async () => {
      mockGetAll.mockResolvedValue({
        data: { items: [], totalPages: 1, totalResults: 0, query: { page: 1 }, facets: {} },
      });

      store.currentPage = 5;
      store.brc = ['JBEI']; // triggers filterChanges
      await store.runSearch(false);

      expect(store.currentPage).toBe(1);
    });
  });

  describe('importFromURLQuery', () => {
    it('sets search term from query', () => {
      store.importFromURLQuery({ q: 'biomass' });
      expect(store.searchTerm).toBe('biomass');
    });

    it('parses JSON filters from query string', () => {
      store.importFromURLQuery({ filters: '{"brc":["JBEI"]}' });
      expect(store.filters).toEqual({ brc: ['JBEI'] });
    });

    it('handles invalid JSON filters gracefully', () => {
      store.importFromURLQuery({ filters: 'not-json' });
      expect(store.filters).toBeUndefined();
    });

    it('clears filters when not present in query', () => {
      store.filters = { brc: ['JBEI'] };
      store.importFromURLQuery({});
      expect(store.filters).toBeUndefined();
    });

    it('parses page and size from query', () => {
      store.importFromURLQuery({ page: '3', size: '25' });
      expect(store.currentPage).toBe(3);
      expect(store.pageSize).toBe(25);
    });

    it('defaults to page 1 for invalid page values', () => {
      store.importFromURLQuery({ page: '-1' });
      expect(store.currentPage).toBe(1);
    });
  });

  describe('anyQueryURLChanges', () => {
    it('returns true when search term differs', () => {
      store.searchTerm = 'ethanol';
      expect(store.anyQueryURLChanges({ q: 'biomass' })).toBe(true);
    });

    it('returns false when state matches query', () => {
      store.searchTerm = 'ethanol';
      store.filters = { brc: ['JBEI'] };
      expect(store.anyQueryURLChanges({
        q: 'ethanol',
        filters: '{"brc":["JBEI"]}',
        page: 1,
        rows: 50,
      })).toBe(false);
    });
  });

  describe('goToPage', () => {
    it('clamps to valid page range', async () => {
      mockGetAll.mockResolvedValue({
        data: { items: [], totalPages: 5, totalResults: 0, query: { page: 5 }, facets: {} },
      });
      store.totalPages = 5;

      store.goToPage(10);
      expect(store.currentPage).toBe(5);
    });

    it('clamps negative page to 1', async () => {
      mockGetAll.mockResolvedValue({
        data: { items: [], totalPages: 5, totalResults: 0, query: { page: 1 }, facets: {} },
      });
      store.totalPages = 5;

      store.goToPage(-3);
      expect(store.currentPage).toBe(1);
    });
  });
});
