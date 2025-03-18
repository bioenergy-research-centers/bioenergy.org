FROM node:20

RUN apt-get update && apt-get install -y cron
RUN ["mkdir", "/install"]
WORKDIR /install
COPY package*.json .
RUN npm install

WORKDIR /api
COPY . .
RUN cp -r /install/node_modules /api/node_modules
CMD npm start
