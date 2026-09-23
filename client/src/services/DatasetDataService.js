// axios defined api endpoint
import http from "../http-common";

class DatasetDataService {
  getAll(options = {}) {
    const page = options.page;
    const rows = options.rows;
    const q = options.query || options.q;
    const filters = options.filters;
    const from_date = options.from_date;
    const until_date = options.until_date;
    return http.get("/datasets", { params: { page, rows, q, filters, from_date, until_date } });
  }

  getFacets(options = {}) {
    const q = options.query || options.q;
    const filters = options.filters;
    const from_date = options.from_date;
    const until_date = options.until_date;
    return http.get("/datasets/facets", { params: { q, filters, from_date, until_date } });
  }

  get(id) {
    return http.get(`/datasets/${encodeURIComponent(id)}`);
  }

  lookup(uid) {
    return http.get(`/datasets/lookup/${encodeURIComponent(uid)}`);
  }

  runAdvancedSearch(filter, sequence) {
    const payload = { query: filter, sequence: sequence };
    return http.post('/datasets/', payload);
  }


  getMetrics(payload) {
    return http.get('/datasets/metrics', payload);
  }

}

export default new DatasetDataService();
