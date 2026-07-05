import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const envDirectory = path.resolve(__dirname, "..");
  const env = loadEnv(mode, envDirectory, "");

  const rawHosts = env.VITE_ALLOWED_HOSTS
    ? env.VITE_ALLOWED_HOSTS.split(",")
    : [];
  const allowedHosts = rawHosts.map((host) =>
    host
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, ""),
  );

  console.log("--- DEBUG VITE CONFIG ---");
  console.log("Current Dir:", __dirname);
  console.log("Env Dir:", envDirectory);
  console.log("RAW VITE_ALLOWED_HOSTS:", env.VITE_ALLOWED_HOSTS);
  console.log("CLEANED ALLOWED HOSTS:", allowedHosts);
  console.log("VITE_API_URL:", env.VITE_API_URL);
  console.log("-------------------------");

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Serve /config.js SOLO in dev (in prod lo genera l'entrypoint del
      // container). Usa BACKEND_URL dal .env — la stessa chiave usata a runtime
      // in prod — cosi window.__ENV__ esiste anche in locale, senza 404, e
      // config.js NON e un asset di build -> non finisce nel precache del SW.
      {
        name: "dev-runtime-config",
        apply: "serve",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === "/config.js") {
              res.setHeader("Content-Type", "application/javascript");
              res.end(
                `window.__ENV__ = ${JSON.stringify({
                  apiUrl: env.BACKEND_URL || "",
                })};\n`,
              );
              return;
            }
            next();
          });
        },
      },
      VitePWA({
        registerType: "prompt",
        includeAssets: ["favicon.ico", "apple-touch-icon-180x180.png"],
        manifest: {
          name: "Finance Web App",
          short_name: "FinanceApp",
          description: "Track your wallets and transactions offline!",
          theme_color: "#0d0d12",
          background_color: "#0d0d12",
          display: "standalone",
          icons: [
            {
              src: "pwa-64x64.png",
              sizes: "64x64",
              type: "image/png",
            },
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "maskable-icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          // config.js e generato a runtime dal container: NON va precache-ato
          // (altrimenti il SW servirebbe il placeholder di build). Serve sia il
          // pattern root ("config.js") sia "**/config.js": il primo perche
          // "**/" in minimatch NON matcha un file nella root.
          globIgnores: ["config.js", "**/config.js"],
          runtimeCaching: [
            {
              // Config runtime (/config.js, generato dal container): rete-first
              // con fallback cache per l'offline. Non e nel precache perche non
              // e un asset di build.
              urlPattern: ({ url }) => url.pathname === "/config.js",
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "runtime-config",
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "gstatic-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],
    server: {
      allowedHosts: allowedHosts.length > 0 ? allowedHosts : true,
      host: true,
      port: 5173,
    },
    envDir: envDirectory,
  };
});
