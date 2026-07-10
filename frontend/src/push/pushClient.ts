// App-side Web Push client: enrollment state + subscribe/unsubscribe on THIS
// device. All server calls go through the shared axios instance. The base64
// helpers are exported so tests can pin their encoding.
import api from "../api/axiosConfig";

/** Enrollment state of the current browser/device. */
export type PushEnrollment =
  "subscribed" | "unsupported" | "denied" | "disabled-server" | "unsubscribed";

/** True when the browser exposes both the Service Worker and Push APIs. */
export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window;
}

/** Decodes a base64url VAPID key into the byte array `pushManager.subscribe` wants. */
export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

/** Encodes a subscription key (`getKey(...)`) as standard base64 for the backend. */
export function keyToBase64(key: ArrayBuffer | null): string {
  if (!key) return "";
  const bytes = new Uint8Array(key);
  let binary = "";
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** GET the server's VAPID public key. Empty string ⇒ push disabled server-side. */
async function fetchPublicKey(): Promise<string> {
  try {
    const res = await api.get("/push/public-key");
    return (res.data?.publicKey as string | undefined) ?? "";
  } catch {
    return "";
  }
}

/** Resolves the current enrollment state without prompting the user. */
export async function getEnrollment(): Promise<PushEnrollment> {
  if (!isPushSupported()) return "unsupported";
  if (
    typeof Notification !== "undefined" &&
    Notification.permission === "denied"
  ) {
    return "denied";
  }
  const publicKey = await fetchPublicKey();
  if (!publicKey) return "disabled-server";
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return subscription ? "subscribed" : "unsubscribed";
}

/**
 * Enrolls this device: request permission → fetch the public key (empty ⇒
 * disabled-server) → subscribe via the push manager → register the endpoint
 * with the backend. Returns the resulting enrollment state.
 */
export async function subscribeThisDevice(): Promise<PushEnrollment> {
  if (!isPushSupported()) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const publicKey = await fetchPublicKey();
  if (!publicKey) return "disabled-server";

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await api.post("/push/subscriptions", {
    endpoint: subscription.endpoint,
    p256dh: keyToBase64(subscription.getKey("p256dh")),
    auth: keyToBase64(subscription.getKey("auth")),
    userAgent: navigator.userAgent,
  });
  return "subscribed";
}

/** Removes this device's subscription (push manager + backend row). */
export async function unsubscribeThisDevice(): Promise<void> {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await api.delete("/push/subscriptions", { data: { endpoint } });
}
