// axios defined api endpoint
import http from "../http-common";

class DatasetDataService {
  getAll() {
    return http.get("/datasets");
  }

  get(id) {
    return http.get(`/datasets/${encodeURIComponent(id)}`);
  }

  published() {
    return http.get("/datasets/published");
  }

  findByTitle(title) {
    return http.get(`/datasets?title=${title}`);
  }

  findByBRC(brc) {
    return http.get(`/datasets?brc=${brc}`);
  }

  findByFullText(full_text) {
    return http.get(`/datasets?fulltext=${full_text}`);
  }

  runAdvancedSearch(filter, sequence) {
    const payload = { query: filter, sequence: sequence };
    return http.post('/datasets/', payload);
  }

  runFilteredSearch(payload) {
    return http.post('/datasets/filters', payload);
  }

  getMetrics(payload) {
    return http.get('/datasets/metrics', payload);
  }

  // Query for datasets using multiple filters
  findByParams(params) {
    var queryParams = new URLSearchParams();
    for (const key in params) {
      queryParams.append(key, params[key]);
    }
    return http.get(`/datasets?${queryParams.toString()}`);
  }
}

export default new DatasetDataService();
