// client/src/services/SchemaDataService.js
import http from "../http-common";

class SchemaDataService {
  // GET /api/schema -> { supported: [...] }
  getSupported() {
    return http.get("/schema");
  }

  // GET /api/schema/:version -> schema JSON
  get(version) {
    return http.get(`/schema/${encodeURIComponent(version)}`);
  }
}

export default new SchemaDataService();