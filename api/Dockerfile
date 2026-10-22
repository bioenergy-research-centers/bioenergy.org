FROM node:20

RUN apt-get update && apt-get install -y cron

WORKDIR /api
# Install dependencies first so this layer is cached until package*.json changes.
# The trailing slash is required when copying more than one file (package.json and
# package-lock.json) with Docker's older builder.
COPY package*.json ./
RUN npm install

# .dockerignore keeps the host's node_modules out, so this doesn't replace the install above.
COPY . .

CMD npm start