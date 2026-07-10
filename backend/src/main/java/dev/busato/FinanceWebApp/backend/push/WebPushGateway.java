package dev.busato.FinanceWebApp.backend.push;

import jakarta.annotation.PostConstruct;
import java.security.Security;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * The only class that touches the {@code nl.martijndwars:web-push} library. Kept deliberately
 * minimal: all recipient fan-out and pruning logic lives in {@link WebPushSender}, so this class
 * needs no dedicated unit test (it is exercised indirectly / integration only).
 */
@Component
public class WebPushGateway implements PushGateway {

  @Value("${application.push.vapid.public-key}")
  private String publicKey;

  @Value("${application.push.vapid.private-key}")
  private String privateKey;

  @Value("${application.push.vapid.subject}")
  private String subject;

  private PushService pushService;

  @PostConstruct
  void init() throws Exception {
    if (!isConfigured()) return;
    if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
      Security.addProvider(new BouncyCastleProvider());
    }
    pushService = new PushService(publicKey, privateKey, subject);
  }

  @Override
  public boolean isConfigured() {
    return publicKey != null && !publicKey.isBlank() && privateKey != null && !privateKey.isBlank();
  }

  @Override
  public int send(String endpoint, String p256dh, String auth, String payload) throws Exception {
    Notification notification = new Notification(endpoint, p256dh, auth, payload);
    return pushService.send(notification).getStatusLine().getStatusCode();
  }

  /** Exposed to the {@code /api/push/public-key} endpoint (empty string when unconfigured). */
  public String getPublicKey() {
    return publicKey;
  }
}
