#!/bin/sh
# Genera /config.js all'avvio del container dalle variabili d'ambiente di
# runtime. nginx:alpine esegue automaticamente questo script (in
# /docker-entrypoint.d/) prima di avviare nginx.
#
# window.__ENV__ (apiUrl/version/date) e letto dall'app a runtime: cosi UNA sola
# immagine frontend va bene per demo, prod e locale — cambia solo il .env del
# rispettivo ambiente, senza ricostruire nulla.
set -eu

API_URL="${APP_API_URL:-}"
VERSION="${APP_VERSION:-dev}"
BUILD_DATE="${APP_BUILD_DATE:-}"

cat > /usr/share/nginx/html/config.js <<EOF
window.__ENV__ = {"apiUrl":"${API_URL}","version":"${VERSION}","date":"${BUILD_DATE}"};
EOF

echo "[40-config] config.js -> apiUrl=${API_URL} version=${VERSION} date=${BUILD_DATE}"
