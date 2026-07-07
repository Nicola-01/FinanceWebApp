import "axios";

// Augment Axios' request config with our custom flag so the offline-sync
// replay path can mark requests without casting to `any`.
declare module "axios" {
  export interface AxiosRequestConfig {
    /** Set on replayed offline-queue requests to skip re-queueing them. */
    isSyncRequest?: boolean;
    /**
     * Opt this request out of the offline queue: reject immediately on a
     * network error instead of queueing and faking a success. For flows that
     * must not pretend to have succeeded (e.g. atomic wallet creation).
     */
    skipOfflineQueue?: boolean;
  }
}
