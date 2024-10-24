FROM node:20

RUN apt-get update && apt-get install -y cron
RUN ["mkdir", "/install"]
WORKDIR /install
ENV NODE_PATH=/install/node_modules
COPY package*.json .
RUN npm install

WORKDIR /api
COPY . .
CMD npm start
