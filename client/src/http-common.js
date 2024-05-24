import axios from "axios";

export default axios.create({
  baseURL: import.meta.env.VITE_BIOENERGY_ORG_API_URI +"/api",
  headers: {
    "Content-type": "application/json"
  }
});
