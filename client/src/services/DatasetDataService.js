// axios defined api endpoint
import http from "../http-common";

class DatasetDataService {
  getAll() {
    return http.get("/datasets");
  }

  get(id) {
    return http.get(`/datasets/${id}`);
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

  // Query for datasets using multiple filters
  findByParams(params) {
    var queryParams = new URLSearchParams();
    for (const key in params) {
      queryParams.append(key, params[key])
    }
    return http.get(`/datasets?${queryParams.toString()}`);
  }
}

export default new DatasetDataService();