// axios defined api endpoint
import http from "../http-common";

class DatasetDataService {
  getAll(options = {}) {
    const page = options.page;
    const rows = options.rows;
    const q = options.query || options.q;
    const filters = options.filters;
    const nofacets = options.nofacets;
    const from_date = options.from_date;
    const until_date = options.until_date;
    // overrides the default 'detail' shape for dataset records that returns all values
    // uses the smaller fixed 'list-item' shape by default for search
    const shape = options.shape ?? 'list-item';
    return http.get("/datasets", { params: { page, rows, q, filters, nofacets, from_date, until_date, shape } });
  }

  get(id) {
    return http.get(`/datasets/${encodeURIComponent(id)}`, { params: { shape: 'detail' } });
  }

  lookup(uid) {
    return http.get(`/datasets/lookup/${encodeURIComponent(uid)}`);
  }

  runAdvancedSearch(filter, sequence) {
    // overrides the default 'detail' shape for dataset records that returns all values
    // uses the smaller fixed 'list-item' shape for search
    const payload = { query: filter, sequence: sequence, shape: 'list-item' };
    return http.post('/datasets/', payload);
  }


  getMetrics(payload) {
    return http.get('/datasets/metrics', payload);
  }

}

export default new DatasetDataService();
