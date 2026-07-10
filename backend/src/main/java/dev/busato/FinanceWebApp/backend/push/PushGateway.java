package dev.busato.FinanceWebApp.backend.push;

/**
 * Thin, mockable seam over the underlying web-push library. Keeping the library behind this
 * interface lets {@link WebPushSender} be unit-tested without any real crypto or network I/O.
 */
public interface PushGateway {

  /**
   * Encrypts and delivers a single push message.
   *
   * @return the HTTP status returned by the browser push service (e.g. 201 created, 404/410 when
   *     the subscription is gone).
   */
  int send(String endpoint, String p256dh, String auth, String payload) throws Exception;

  /**
   * @return {@code true} only when VAPID keys are configured; otherwise push is disabled.
   */
  boolean isConfigured();
}
