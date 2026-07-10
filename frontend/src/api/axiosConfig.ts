// src/api/axiosConfig.ts
import axios, {
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { offlineDb } from "../utils/offlineDb";

// API URL a RUNTIME da window.__ENV__ (config.js generato dal container);
// fallback su import.meta.env per dev/locale.
const apiBase = window.__ENV__?.apiUrl ?? import.meta.env.VITE_API_URL ?? "";

const api = axios.create({
  baseURL: apiBase + "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Necessario per inviare/ricevere i cookie (refresh_token)
});

// ==================== REQUEST INTERCEPTOR ====================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const publicEndpoints = [
      "/auth/login",
      "/auth/register",
      "/auth/demo",
      "/auth/forgot-password",
      "/auth/reset-password",
    ];

    const isPublic = publicEndpoints.some((endpoint) =>
      config.url?.includes(endpoint),
    );

    if (isPublic) return config;

    const token =
      localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");

    if (token) config.headers.set("Authorization", `Bearer ${token}`);

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// ==================== RESPONSE INTERCEPTOR (auto-refresh) ====================

let isRefreshing = false;
let failedQueue: {
  resolve: (value: AxiosResponse) => void;
  reject: (reason: unknown) => void;
  config: InternalAxiosRequestConfig;
}[] = [];

/**
 * Processa la coda di richieste che erano in attesa del refresh.
 */
const processQueue = (error: unknown, newToken: string | null = null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else if (newToken) {
      config.headers.set("Authorization", `Bearer ${newToken}`);
      api(config).then(resolve).catch(reject);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  async (response) => {
    // Cache GET responses per offline support
    if (
      response.config.method?.toUpperCase() === "GET" &&
      response.config.url
    ) {
      try {
        await offlineDb.cache.put({
          url: response.config.url,
          data: response.data,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error("Failed to cache response", err);
      }
    }
    return response;
  },
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    // ---- Auto-refresh su 401 ----
    if (error.response?.status === 401 && !config._retry) {
      // Se è l'endpoint di refresh che ha fallito, redirect al login
      if (config.url?.includes("/auth/refresh")) {
        localStorage.removeItem("jwtToken");
        sessionStorage.removeItem("jwtToken");
        localStorage.removeItem("mustChangePWD");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      // Se già stiamo facendo un refresh, accoda la richiesta
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config });
        });
      }

      config._retry = true;
      isRefreshing = true;

      try {
        // Chiama l'endpoint di refresh (il cookie refresh_token viene inviato automaticamente)
        const refreshResponse = await api.post("/auth/refresh");
        const newToken = refreshResponse.data.token;

        // Salva il nuovo access token nello storage corretto
        if (localStorage.getItem("jwtToken")) {
          localStorage.setItem("jwtToken", newToken);
        } else {
          sessionStorage.setItem("jwtToken", newToken);
        }

        // Aggiorna la richiesta originale con il nuovo token
        config.headers.set("Authorization", `Bearer ${newToken}`);

        // Processa la coda delle richieste in attesa
        processQueue(null, newToken);

        // Riprova la richiesta originale
        return api(config);
      } catch (refreshError) {
        // Refresh fallito → cancella tutto e redirect al login
        processQueue(refreshError, null);
        localStorage.removeItem("jwtToken");
        sessionStorage.removeItem("jwtToken");
        localStorage.removeItem("mustChangePWD");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ---- Gestione offline (codice esistente) ----
    const isNetworkError =
      !error.response || error.code === "ERR_NETWORK" || !navigator.onLine;

    if (isNetworkError) {
      const method = config.method?.toUpperCase() || "GET";
      const url = config.url || "";

      if (method === "GET") {
        try {
          const cached = await offlineDb.cache.get(url);
          if (cached) {
            return Promise.resolve({
              data: cached.data,
              status: 200,
              statusText: "OK",
              headers: {},
              config,
              isOfflineCache: true,
            });
          }
        } catch (e) {
          console.error("Offline cache error: ", e);
        }
      }
      // Offline POST/PUT/DELETE are no longer queued here: they reject with the
      // network error and callers decide (the typed domain-ops queue handles
      // the mutations that must survive offline).
    }

    return Promise.reject(error);
  },
);

export default api;
