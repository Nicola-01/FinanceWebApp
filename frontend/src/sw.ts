/// <reference lib="WebWorker" />
// Custom service worker (injectManifest). Replaces the generated one to add
// Web Push handling; precache + runtime caching replicate the old generateSW config.
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { notificationTargetUrl, type PushPayload } from "./push/swPayload";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// vite-plugin-pwa "prompt" flow: the page asks us to activate the new version.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

// Runtime config (/config.js): network-first-ish with cache fallback for offline.
registerRoute(
  ({ url }) => url.pathname === "/config.js",
  new StaleWhileRevalidate({ cacheName: "runtime-config" }),
);
const fontsPlugins = () => [
  new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
  new CacheableResponsePlugin({ statuses: [0, 200] }),
];
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({ cacheName: "google-fonts-cache", plugins: fontsPlugins() }),
);
registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({ cacheName: "gstatic-fonts-cache", plugins: fontsPlugins() }),
);

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const payload = event.data.json() as PushPayload;
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const visible = clients.filter((c) => c.visibilityState === "visible");
      if (visible.length > 0) {
        // App in foreground: hand over to the page (in-app toast) instead of a system notification.
        visible.forEach((c) =>
          c.postMessage({ type: "PUSH_RECEIVED", payload }),
        );
        return;
      }
      await self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: "/pwa-192x192.png",
        badge: "/pwa-64x64.png",
        tag: payload.notificationId,
        data: payload,
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const payload = (event.notification.data ?? {}) as PushPayload;
  const target = notificationTargetUrl(payload);
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const existing = clients[0];
      if (existing) {
        await existing.focus();
        existing.postMessage({ type: "OPEN_NOTIFICATION", url: target });
        return;
      }
      await self.clients.openWindow(target);
    })(),
  );
});
