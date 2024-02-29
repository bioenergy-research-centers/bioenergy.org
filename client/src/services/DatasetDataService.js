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
}

export default new DatasetDataService();