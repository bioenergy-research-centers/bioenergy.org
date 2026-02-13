// axios defined api endpoint
import http from "../http-common";

class DatasetDataService {
  getAll(options = {}) {
    const page = options.page;
    const rows = options.rows;
    const q = options.query || options.q;
    const filters = options.filters;
    const nofacets = options.nofacets;
    return http.get("/datasets", { params: { page, rows, q, filters, nofacets } });
  }

  get(id) {
    return http.get(`/datasets/${encodeURIComponent(id)}`);
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
