import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSearchStore } from '@/store/searchStore';

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

// Mock vue-router
const mockPush = vi.fn();
const mockRoute = { query: {} };
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute: () => mockRoute,
}));

// Mock DatasetDataService
const mockGetAll = vi.fn();
const mockGetFacets = vi.fn();
const mockRunAdvancedSearch = vi.fn();
vi.mock('@/services/DatasetDataService', () => ({
  default: {
    getAll: (...args) => mockGetAll(...args),
    getFacets: (...args) => mockGetFacets(...args),
    runAdvancedSearch: (...args) => mockRunAdvancedSearch(...args),
  },
}));

describe('searchStore', () => {
  let store;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetFacets.mockResolvedValue({ data: {} });
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
          facets: null,
        },
      });
      mockGetFacets.mockResolvedValue({
        data: { brc: [{ value: 'JBEI', count: 10 }] },
      });

      store.searchTerm = 'ethanol';
      await store.runSearch(false);
      await flushPromises();

      expect(mockGetAll).toHaveBeenCalledWith({
        page: 1,
        rows: 50,
        query: 'ethanol',
        filters: {},
        from_date: undefined,
        until_date: undefined,
      });
      expect(mockGetFacets).toHaveBeenCalledWith({
        query: 'ethanol',
        filters: {},
        from_date: undefined,
        until_date: undefined,
      });
      expect(store.searchResults).toEqual([{ uid: '1', title: 'Dataset A' }]);
      expect(store.totalPages).toBe(3);
      expect(store.totalResults).toBe(25);
      expect(store.facets).toEqual({ brc: [{ value: 'JBEI', count: 10 }] });
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
      expect(mockGetFacets).not.toHaveBeenCalled();
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

  it('does not refetch facets on page-only searches', async () => {
    mockGetAll.mockResolvedValue({
      data: { items: [], totalPages: 5, totalResults: 100, query: { page: 1 }, facets: null },
    });
    mockGetFacets.mockResolvedValue({
      data: { brc: [{ value: 'JBEI', count: 10 }] },
    });

    store.searchTerm = 'ethanol';
    await store.runSearch(false);
    await flushPromises();

    mockGetAll.mockResolvedValueOnce({
      data: { items: [], totalPages: 5, totalResults: 100, query: { page: 2 }, facets: null },
    });
    store.currentPage = 2;
    await store.runSearch(false);
    await flushPromises();

    expect(mockGetFacets).toHaveBeenCalledTimes(1);
    expect(mockGetAll).toHaveBeenLastCalledWith({
      page: 2,
      rows: 50,
      query: 'ethanol',
      filters: {},
      from_date: undefined,
      until_date: undefined,
    });
    expect(store.facets).toEqual({ brc: [{ value: 'JBEI', count: 10 }] });
  });

  it('does not duplicate an in-flight facet request on page-only searches', async () => {
    let resolveFacets;
    mockGetAll.mockResolvedValue({
      data: { items: [], totalPages: 5, totalResults: 100, query: { page: 1 } },
    });
    mockGetFacets.mockReturnValue(new Promise((resolve) => { resolveFacets = resolve; }));

    store.searchTerm = 'ethanol';
    await store.runSearch(false);

    store.currentPage = 2;
    await store.runSearch(false);

    expect(mockGetFacets).toHaveBeenCalledTimes(1);
    expect(store.facetsLoading).toBe(true);

    resolveFacets({ data: { brc: [{ value: 'JBEI', count: 10 }] } });
    await flushPromises();

    expect(store.facets).toEqual({ brc: [{ value: 'JBEI', count: 10 }] });
    expect(store.facetsLoading).toBe(false);
  });

  it('refetches facets when filters change', async () => {
    mockGetAll.mockResolvedValue({
      data: { items: [], totalPages: 1, totalResults: 0, query: { page: 1 }, facets: null },
    });
    mockGetFacets
      .mockResolvedValueOnce({ data: { brc: [{ value: 'JBEI', count: 10 }] } })
      .mockResolvedValueOnce({ data: { brc: [{ value: 'GLBRC', count: 5 }] } });

    await store.runSearch(false);
    await flushPromises();
    store.brc = ['GLBRC'];
    await store.runSearch(false);
    await flushPromises();

    expect(mockGetFacets).toHaveBeenCalledTimes(2);
    expect(mockGetFacets).toHaveBeenLastCalledWith({
      query: '',
      filters: { brc: ['GLBRC'] },
      from_date: undefined,
      until_date: undefined,
    });
    expect(store.facets).toEqual({ brc: [{ value: 'GLBRC', count: 5 }] });
  });

  it('keeps search results when facet request fails', async () => {
    mockGetAll.mockResolvedValue({
      data: {
        items: [{ uid: '1' }],
        totalPages: 1,
        totalResults: 1,
        query: { page: 1 },
        facets: null,
      },
    });
    mockGetFacets.mockRejectedValue(new Error('facet failed'));

    await store.runSearch(false);
    await flushPromises();

    expect(store.searchResults).toEqual([{ uid: '1' }]);
    expect(store.facets).toEqual({});
    expect(store.facetsError).toBe('Failed to fetch search facets.');
    expect(store.searchResultsError).toBeNull();
  });

  it('does not let a stale result failure cancel a newer facet request', async () => {
    let rejectFirstResults;
    let resolveSecondFacets;

    mockGetAll
      .mockReturnValueOnce(new Promise((_, reject) => { rejectFirstResults = reject; }))
      .mockResolvedValueOnce({
        data: {
          items: [{ uid: '2' }],
          totalPages: 1,
          totalResults: 1,
          query: { page: 1 },
          facets: null,
        },
      });
    mockGetFacets
      .mockResolvedValueOnce({ data: { brc: [{ value: 'JBEI', count: 10 }] } })
      .mockReturnValueOnce(new Promise((resolve) => { resolveSecondFacets = resolve; }));

    store.searchTerm = 'first';
    const firstSearch = store.runSearch(false);
    await flushPromises();

    store.searchTerm = 'second';
    const secondSearch = store.runSearch(false);
    await flushPromises();

    rejectFirstResults(new Error('stale failure'));
    await firstSearch;

    resolveSecondFacets({ data: { brc: [{ value: 'GLBRC', count: 5 }] } });
    await secondSearch;
    await flushPromises();

    expect(store.facets).toEqual({ brc: [{ value: 'GLBRC', count: 5 }] });
    expect(store.facetsLoading).toBe(false);
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

    it('parses page and rows from query', () => {
      store.importFromURLQuery({ page: '3', rows: '25' });
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

  it('passes publication date range to getAll', async () => {
    mockGetAll.mockResolvedValue({
      data: {
        items: [],
        totalPages: 1,
        totalResults: 0,
        query: { page: 1 },
        facets: {},
      },
    });

    store.searchTerm = 'ethanol';
    store.fromDate = '2025-01-01';
    store.untilDate = '2025-12-31';

    await store.runSearch(false);

    expect(mockGetAll).toHaveBeenCalledWith({
      page: 1,
      rows: 50,
      query: 'ethanol',
      filters: {},
      from_date: '2025-01-01',
      until_date: '2025-12-31',
    });
  });

  it('imports date range from query', () => {
    store.importFromURLQuery({
      from_date: '2025-01-01',
      until_date: '2025-12-31',
    });

    expect(store.fromDate).toBe('2025-01-01');
    expect(store.untilDate).toBe('2025-12-31');
  });

  it('clears date range state', () => {
    store.fromDate = '2025-01-01';
    store.untilDate = '2025-12-31';

    store.clearSearchData();

    expect(store.fromDate).toBe('');
    expect(store.untilDate).toBe('');
  });

  it('adds date range to URL query', async () => {
    store.searchTerm = 'ethanol';
    store.fromDate = '2025-01-01';
    store.untilDate = '2025-12-31';

    await store.applySearchToURL();

    expect(mockPush).toHaveBeenCalledWith({
      name: 'datasetSearch',
      query: expect.objectContaining({
        q: 'ethanol',
        from_date: '2025-01-01',
        until_date: '2025-12-31',
        rows: 50,
      }),
    });
  });

  it('detects date range URL changes', () => {
    store.fromDate = '2025-01-01';
    store.untilDate = '2025-12-31';

    expect(store.anyQueryURLChanges({
      from_date: '2025-01-01',
      until_date: '2025-12-30',
    })).toBe(true);
  });

  it('imports page size from rows query param', () => {
    store.importFromURLQuery({
      page: '2',
      rows: '25',
    });

    expect(store.currentPage).toBe(2);
    expect(store.pageSize).toBe(25);
  });

  it('does not report URL changes when numeric pagination state matches string query params', () => {
    store.currentPage = 2;
    store.pageSize = 25;
    store.searchTerm = 'ethanol';
    store.filters = {};

    const result = store.anyQueryURLChanges({
      q: 'ethanol',
      filters: JSON.stringify({}),
      page: '2',
      rows: '25',
    });

    expect(result).toBe(false);
  });
});
