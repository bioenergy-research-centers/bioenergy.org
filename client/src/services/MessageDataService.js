import http from "../http-common";

class MessageDataService {
  create(params) {
    return http.post('/messages/', params);
  }
}

export default new MessageDataService();