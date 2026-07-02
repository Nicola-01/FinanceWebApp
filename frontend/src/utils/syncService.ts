import { offlineDb } from "./offlineDb";
import api from "../api/axiosConfig";
import { getApiErrorStatus } from "./apiError";

export const syncOfflineData = async () => {
  if (!navigator.onLine) return;

  try {
    const queue = await offlineDb.syncQueue.orderBy("createdAt").toArray();
    if (queue.length === 0) return;

    console.log(`Starting sync for ${queue.length} offline items`);

    for (const item of queue) {
      try {
        await api({
          method: item.method,
          url: item.url,
          data: item.payload,
          headers: item.headers,
          isSyncRequest: true, // custom flag to avoid re-queueing
        });

        if (item.id) {
          await offlineDb.syncQueue.delete(item.id);
        }
      } catch (err: unknown) {
        console.error("Failed to sync item:", item, err);

        const status = getApiErrorStatus(err);
        if (
          status &&
          status >= 400 &&
          status < 500 &&
          status !== 408 &&
          status !== 429
        ) {
          if (item.id) await offlineDb.syncQueue.delete(item.id);
        }
      }
    }

    console.log("Sync complete");
    window.dispatchEvent(new CustomEvent("offline-sync-complete"));

    // Let's trigger a full refresh in the UI if needed
  } catch (e) {
    console.error("Error in syncService:", e);
  }
};

window.addEventListener("online", syncOfflineData);

export const initSync = () => {
  if (navigator.onLine) {
    setTimeout(syncOfflineData, 2000); // 2 seconds delay to allow auth
  }
};
