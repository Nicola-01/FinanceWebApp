import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import { triggerToast } from "../components/ui/ToastNotification";
import type { PushPayload } from "./swPayload";

/**
 * App-side bridge for push, mounted once (inside Router context). It:
 * - acks (deletes) the notification a push click opened, read from `?notif=<id>`
 *   on mount, then strips the param so a refresh doesn't re-ack;
 * - listens for the service worker's messages: a foreground `PUSH_RECEIVED`
 *   becomes an in-app toast, an `OPEN_NOTIFICATION` navigates to its url.
 */
export function usePushMessages(): void {
  const navigate = useNavigate();

  // Fire-and-forget ack of a click-opened notification; errors are ignored.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const notif = params.get("notif");
    if (!notif) return;
    void api.post(`/notifications/${notif}/ack`).catch(() => {});
    params.delete("notif");
    const query = params.toString();
    const newUrl =
      window.location.pathname +
      (query ? `?${query}` : "") +
      window.location.hash;
    window.history.replaceState(null, "", newUrl);
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      const data = event.data as
        { type?: string; payload?: PushPayload; url?: string } | undefined;
      if (!data || typeof data !== "object") return;
      if (data.type === "PUSH_RECEIVED" && data.payload) {
        triggerToast(`${data.payload.title} — ${data.payload.body}`, true);
      } else if (data.type === "OPEN_NOTIFICATION" && data.url) {
        navigate(data.url);
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [navigate]);
}
