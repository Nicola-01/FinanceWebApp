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
ARG VITE_DEMO_ENABLED

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ALLOWED_HOSTS=$VITE_ALLOWED_HOSTS
ENV VITE_DEMO_ENABLED=$VITE_DEMO_ENABLED

# NOTA: versione e data NON sono qui. Sono iniettate a RUNTIME (vedi lo script
# in /docker-entrypoint.d che genera version.json all'avvio del container), cosi
# non serve ricostruire il frontend per aggiornare la versione mostrata.

RUN npm run build

FROM nginx:alpine AS production
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build-prod /app/dist /usr/share/nginx/html
# Genera /version.json all'avvio dalle env APP_VERSION/APP_BUILD_DATE.
# nginx:alpine esegue automaticamente gli script in /docker-entrypoint.d/ prima
# di avviare nginx.
COPY docker-entrypoint.d/40-version.sh /docker-entrypoint.d/40-version.sh
RUN chmod +x /docker-entrypoint.d/40-version.sh
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]