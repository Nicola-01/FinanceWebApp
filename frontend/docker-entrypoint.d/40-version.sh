#!/bin/sh
# Genera /version.json all'avvio del container dalle variabili d'ambiente di
# runtime. nginx:alpine esegue automaticamente questo script (in
# /docker-entrypoint.d/) prima di avviare nginx.
#
# La versione e la data vivono a RUNTIME, non a build-time: cosi una release che
# tocca solo il backend puo aggiornare la versione mostrata semplicemente
# rifacendo `docker compose up -d` con le nuove env, SENZA ricostruire il frontend.
set -eu

VERSION="${APP_VERSION:-dev}"
BUILD_DATE="${APP_BUILD_DATE:-}"

cat > /usr/share/nginx/html/version.json <<EOF
{"version":"${VERSION}","date":"${BUILD_DATE}"}
EOF

echo "[40-version] version.json -> version=${VERSION} date=${BUILD_DATE}"
