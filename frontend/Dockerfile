FROM node:22-slim AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

FROM base AS development
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

FROM base AS build-prod

ARG VITE_ALLOWED_HOSTS
ARG VITE_DEMO_ENABLED

ENV VITE_ALLOWED_HOSTS=$VITE_ALLOWED_HOSTS
ENV VITE_DEMO_ENABLED=$VITE_DEMO_ENABLED

# NOTA: API URL, versione e data NON sono qui. Sono iniettate a RUNTIME via
# /config.js (window.__ENV__), generato dall'entrypoint del container. Cosi una
# sola immagine va bene per tutti gli ambienti e non serve ricostruire il FE.

RUN npm run build

FROM nginx:alpine AS production
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-prod /app/dist /usr/share/nginx/html
# Genera /config.js all'avvio (window.__ENV__: apiUrl/version/date) dalle env.
# nginx:alpine esegue automaticamente gli script in /docker-entrypoint.d/ prima
# di avviare nginx.
COPY docker-entrypoint.d/40-config.sh /docker-entrypoint.d/40-config.sh
RUN chmod +x /docker-entrypoint.d/40-config.sh
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]