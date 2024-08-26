# Description: Dockerfile for the client side of the application
# Copied from https://v2.vuejs.org/v2/cookbook/dockerize-vuejs-app

# build stage
FROM node:20 as build-stage
ARG VITE_BIOENERGY_ORG_API_URI
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# production stage
FROM nginx:stable-alpine as production-stage
# Add custom nginx handling for history-mode routing to handle page refresh or direct navigation to routes
# https://v3.router.vuejs.org/guide/essentials/history-mode.html#nginx
# Using sed to avoid copying/editing/managing the full nginx config
RUN sed -i '/^\s*root\s\+\/usr\/share\/nginx\/html\s*;/a \ \ \ \ try_files $uri $uri/ /index.html;' /etc/nginx/conf.d/default.conf
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]