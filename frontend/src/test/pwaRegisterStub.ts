// Test-only stand-in for vite-plugin-pwa's virtual module (aliased in vitest.config.ts).
export const useRegisterSW = () => ({
  needRefresh: [false, () => {}],
  offlineReady: [false, () => {}],
  updateServiceWorker: async () => {},
});
