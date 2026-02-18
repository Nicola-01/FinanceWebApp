FROM node:22-slim AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

FROM base AS development
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

FROM base AS build-prod

ARG VITE_API_URL
ARG VITE_ALLOWED_HOSTS

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ALLOWED_HOSTS=$VITE_ALLOWED_HOSTS

RUN npm run build

FROM nginx:alpine AS production
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-prod /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]