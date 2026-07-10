package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.busato.FinanceWebApp.backend.model.Notification;
import dev.busato.FinanceWebApp.backend.model.Notification.NotificationType;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.push.NotificationCopy;
import dev.busato.FinanceWebApp.backend.push.WebPushSender;
import dev.busato.FinanceWebApp.backend.repository.NotificationRepository;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

  @Mock private NotificationRepository notificationRepository;
  @Mock private WebPushSender webPushSender;
  @Spy private ObjectMapper objectMapper = new ObjectMapper();

  @InjectMocks private NotificationService notificationService;

  @Test
  void notifyUser_persistsRowAndPushesPayloadWithPersistedId() {
    User recipient = new User();
    recipient.setId(UUID.randomUUID());
    UUID walletId = UUID.randomUUID();
    UUID persistedId = UUID.randomUUID();
    NotificationCopy.Copy copy =
        new NotificationCopy.Copy(
            "New transaction by @nicola",
            "Food · 12.50 EUR · Casa",
            "/dashboard/" + walletId + "?tab=transactions");

    when(notificationRepository.save(any(Notification.class)))
        .thenAnswer(
            inv -> {
              Notification n = inv.getArgument(0);
              n.setId(persistedId);
              return n;
            });

    notificationService.notifyUser(recipient, NotificationType.TRANSACTION_CREATED, walletId, copy);

    ArgumentCaptor<Notification> saved = ArgumentCaptor.forClass(Notification.class);
    verify(notificationRepository).save(saved.capture());
    assertEquals("New transaction by @nicola", saved.getValue().getTitle());
    assertEquals("Food · 12.50 EUR · Casa", saved.getValue().getBody());
    assertEquals(walletId, saved.getValue().getWalletId());
    assertEquals(recipient, saved.getValue().getUser());
    assertEquals(NotificationType.TRANSACTION_CREATED, saved.getValue().getType());

    ArgumentCaptor<String> payload = ArgumentCaptor.forClass(String.class);
    verify(webPushSender).sendToUser(eq(recipient.getId()), payload.capture());
    assertTrue(payload.getValue().contains("notificationId"));
    assertTrue(payload.getValue().contains(persistedId.toString()));
  }

  @Test
  void ack_delegatesToOwnedDelete() {
    UUID id = UUID.randomUUID();
    UUID userId = UUID.randomUUID();

    notificationService.ack(id, userId);

    verify(notificationRepository).deleteByIdAndUserId(id, userId);
  }
}
