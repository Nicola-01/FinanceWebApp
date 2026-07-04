/**
 * Shared helpers for unit tests.
 */

/** URL-safe base64 encoding of a JSON-serialisable value (no padding). */
const base64url = (value: unknown): string =>
  btoa(JSON.stringify(value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/**
 * Builds an unsigned JWT for tests. `jwt-decode` never verifies the signature,
 * so a dummy signature segment is enough to exercise decode/expiry logic.
 */
export const makeJwt = (payload: Record<string, unknown>): string =>
  `${base64url({ alg: "none", typ: "JWT" })}.${base64url(payload)}.sig`;

/** Replaces `window.location` with a writable stub and returns it. */
export const stubLocation = (): { href: string } => {
  const stub = { href: "" };
  Object.defineProperty(window, "location", {
    value: stub,
    writable: true,
    configurable: true,
  });
  return stub;
};

/** Forces `navigator.onLine` for the duration of a test. */
export const setOnline = (online: boolean): void => {
  Object.defineProperty(navigator, "onLine", {
    value: online,
    configurable: true,
  });
};
