// Pure, testable helpers shared between the service worker (src/sw.ts) and the
// app-side push client. Kept dependency-free so both a WebWorker and the DOM
// bundle can import them.

/** Shape of the JSON the backend pushes and the SW hands to the page. */
export interface PushPayload {
  title: string;
  body: string;
  url: string;
  notificationId: string;
}

/**
 * Builds the URL to open when a push is clicked: the notification's target url
 * with a `notif=<id>` query param appended, so the app can ack (delete) that
 * notification on load. Falls back to `/dashboard` when no url is present.
 *
 *   "/dashboard/w1?tab=transactions" → "/dashboard/w1?tab=transactions&notif=<id>"
 *   "/dashboard"                     → "/dashboard?notif=<id>"
 */
export function notificationTargetUrl(
  p: Pick<PushPayload, "url" | "notificationId">,
): string {
  const base = p.url && p.url.length > 0 ? p.url : "/dashboard";
  if (!p.notificationId) return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}notif=${p.notificationId}`;
}
