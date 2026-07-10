package dev.busato.FinanceWebApp.backend.push;

import static org.junit.jupiter.api.Assertions.assertEquals;

import dev.busato.FinanceWebApp.backend.model.Notification;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** Pins the exact, user-approved notification copy byte-for-byte. */
class NotificationCopyTest {

  private final UUID walletId = UUID.randomUUID();

  @Test
  void newTransactionCopy() {
    var copy =
        NotificationCopy.transactionActivity(
            Notification.NotificationType.TRANSACTION_CREATED,
            "nicola",
            "Food",
            new BigDecimal("12.50"),
            "EUR",
            "Casa",
            walletId);
    assertEquals("New transaction by @nicola", copy.title());
    assertEquals("Food · 12.50 EUR · Casa", copy.body());
    assertEquals("/dashboard/" + walletId + "?tab=transactions", copy.url());
  }

  @Test
  void updatedAndDeletedTransactionTitles() {
    assertEquals(
        "Transaction updated by @nicola",
        NotificationCopy.transactionActivity(
                Notification.NotificationType.TRANSACTION_UPDATED,
                "nicola",
                "Food",
                new BigDecimal("12.50"),
                "EUR",
                "Casa",
                walletId)
            .title());
    assertEquals(
        "Transaction deleted by @nicola",
        NotificationCopy.transactionActivity(
                Notification.NotificationType.TRANSACTION_DELETED,
                "nicola",
                "Food",
                new BigDecimal("12.50"),
                "EUR",
                "Casa",
                walletId)
            .title());
  }

  @Test
  void newSubscriptionCopy() {
    var copy =
        NotificationCopy.subscriptionActivity(
            Notification.NotificationType.SUBSCRIPTION_CREATED,
            "nicola",
            "Streaming",
            new BigDecimal("9.99"),
            "EUR",
            "Casa",
            walletId);
    assertEquals("New subscription by @nicola", copy.title());
    assertEquals("Streaming · 9.99 EUR · Casa", copy.body());
    assertEquals("/dashboard/" + walletId + "?tab=subscriptions", copy.url());
  }

  @Test
  void updatedAndDeletedSubscriptionTitles() {
    assertEquals(
        "Subscription updated by @nicola",
        NotificationCopy.subscriptionActivity(
                Notification.NotificationType.SUBSCRIPTION_UPDATED,
                "nicola",
                "Streaming",
                new BigDecimal("9.99"),
                "EUR",
                "Casa",
                walletId)
            .title());
    assertEquals(
        "Subscription deleted by @nicola",
        NotificationCopy.subscriptionActivity(
                Notification.NotificationType.SUBSCRIPTION_DELETED,
                "nicola",
                "Streaming",
                new BigDecimal("9.99"),
                "EUR",
                "Casa",
                walletId)
            .title());
  }

  @Test
  void recurringExecutedCopy() {
    var copy =
        NotificationCopy.recurringExecuted(
            "Netflix", new BigDecimal("9.99"), "EUR", "Casa", walletId);
    assertEquals("Recurring transaction executed", copy.title());
    assertEquals("Netflix · 9.99 EUR · Casa", copy.body());
    assertEquals("/dashboard/" + walletId + "?tab=subscriptions", copy.url());
  }

  @Test
  void walletInviteCopy() {
    var copy = NotificationCopy.walletInvite("nicola", "Casa");
    assertEquals("Wallet invitation", copy.title());
    assertEquals("@nicola invited you to \"Casa\"", copy.body());
    assertEquals("/dashboard", copy.url());
  }

  @Test
  void nullTagRendersUntagged() {
    var copy =
        NotificationCopy.transactionActivity(
            Notification.NotificationType.TRANSACTION_CREATED,
            "nicola",
            null,
            new BigDecimal("12.50"),
            "EUR",
            "Casa",
            walletId);
    assertEquals("Untagged · 12.50 EUR · Casa", copy.body());
  }
}
