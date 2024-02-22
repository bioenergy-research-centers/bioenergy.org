// axios defined api endpoint
import http from "../http-common";

class DatasetDataService {
  getAll() {
    return http.get("/datasets");
  }

  get(id) {
    return http.get(`/datasets/${id}`);
  }

  create(data) {
    return http.post("/datasets", data);
  }

  update(id, data) {
    return http.put(`/datasets/${id}`, data);
  }

  delete(id) {
    return http.delete(`/datasets/${id}`);
  }

  deleteAll() {
    return http.delete(`/datasets`);
  }

  findByTitle(title) {
    return http.get(`/datasets?title=${title}`);
  }
}

export default new DatasetDataService();