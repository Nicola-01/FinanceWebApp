/**
 * Per-device UI version switch. Stored in localStorage (not synced across
 * devices) and mirrored onto `<html data-ui>` so styles can key off it.
 */

export type UiVersion = "v1" | "v2";

const STORAGE_KEY = "ui-version";
const listeners = new Set<() => void>();

/** Defaults to v2; only an explicit stored "v1" opts out. Any storage failure (private mode, blocked site data) falls back to v2. */
export function getUiVersion(): UiVersion {
  try {
    return localStorage.getItem(STORAGE_KEY) === "v1" ? "v1" : "v2";
  } catch {
    return "v2";
  }
}

export function setUiVersion(v: UiVersion): void {
  try {
    localStorage.setItem(STORAGE_KEY, v);
  } catch {
    // Storage unavailable: still apply the attribute for this page load.
  }
  document.documentElement.dataset.ui = v;
  listeners.forEach((listener) => listener());
}

/** Called once at boot, before render, so the first paint uses the stored version. */
export function applyUiVersion(): void {
  document.documentElement.dataset.ui = getUiVersion();
}

export function subscribeUiVersion(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
