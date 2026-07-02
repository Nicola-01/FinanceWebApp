// Config iniettata a RUNTIME da /config.js (generato dall'entrypoint del
// container, vedi frontend/docker-entrypoint.d/40-config.sh). Una sola immagine
// frontend serve tutti gli ambienti: i valori cambiano col .env, non col build.
interface RuntimeEnv {
  apiUrl?: string;
  version?: string;
  date?: string;
}

interface Window {
  __ENV__?: RuntimeEnv;
}
