import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";

// The app defaults to v2; the suite still pins v1 so legacy-branch tests keep
// their meaning until Phase 11 deletes v1. v2 tests opt in with setUiVersion("v2").
beforeEach(() => {
  localStorage.setItem("ui-version", "v1");
  document.documentElement.dataset.ui = "v1";
});

afterEach(() => {
  cleanup();
});

// jsdom doesn't implement matchMedia: provide a minimal stub.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

// jsdom doesn't implement ResizeObserver: the Motion Highlight observes its items.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
