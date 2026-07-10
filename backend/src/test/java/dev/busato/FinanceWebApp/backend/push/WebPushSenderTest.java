package dev.busato.FinanceWebApp.backend.push;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import dev.busato.FinanceWebApp.backend.model.PushSubscription;
import dev.busato.FinanceWebApp.backend.repository.PushSubscriptionRepository;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WebPushSenderTest {

  @Mock private PushSubscriptionRepository pushSubscriptionRepository;
  @Mock private PushGateway pushGateway;
  @InjectMocks private WebPushSender webPushSender;

  @Test
  void sendsPayloadToEverySubscriptionOfTheUser() throws Exception {
    UUID userId = UUID.randomUUID();
    when(pushGateway.isConfigured()).thenReturn(true);
    when(pushSubscriptionRepository.findAllByUserId(userId))
        .thenReturn(List.of(sub("e1"), sub("e2")));
    when(pushGateway.send(any(), any(), any(), any())).thenReturn(201);

    webPushSender.sendToUser(userId, "{\"title\":\"x\"}");

    verify(pushGateway, times(2)).send(any(), any(), any(), eq("{\"title\":\"x\"}"));
  }

  @Test
  void prunesSubscriptionOn410Gone() throws Exception {
    UUID userId = UUID.randomUUID();
    PushSubscription dead = sub("dead");
    when(pushGateway.isConfigured()).thenReturn(true);
    when(pushSubscriptionRepository.findAllByUserId(userId)).thenReturn(List.of(dead));
    when(pushGateway.send(any(), any(), any(), any())).thenReturn(410);

    webPushSender.sendToUser(userId, "{}");

    verify(pushSubscriptionRepository).delete(dead);
  }

  @Test
  void doesNothingWhenNotConfigured() {
    when(pushGateway.isConfigured()).thenReturn(false);

    webPushSender.sendToUser(UUID.randomUUID(), "{}");

    verifyNoInteractions(pushSubscriptionRepository);
  }

  @Test
  void aFailingEndpointDoesNotStopTheOthers() throws Exception {
    UUID userId = UUID.randomUUID();
    when(pushGateway.isConfigured()).thenReturn(true);
    when(pushSubscriptionRepository.findAllByUserId(userId))
        .thenReturn(List.of(sub("boom"), sub("ok")));
    when(pushGateway.send(eq("boom"), any(), any(), any())).thenThrow(new RuntimeException("x"));
    when(pushGateway.send(eq("ok"), any(), any(), any())).thenReturn(201);

    webPushSender.sendToUser(userId, "{}");

    verify(pushGateway).send(eq("ok"), any(), any(), any());
  }

  private PushSubscription sub(String endpoint) {
    return PushSubscription.builder().endpoint(endpoint).p256dh("p").auth("a").build();
  }
}
