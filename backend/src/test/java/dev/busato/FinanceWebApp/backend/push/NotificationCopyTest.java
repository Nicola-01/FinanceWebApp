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
            walletId,
            null);
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
                walletId,
                null)
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
                walletId,
                null)
            .title());
  }

  @Test
  void transactionCopyDeepLinksExceptOnDelete() {
    UUID txId = UUID.randomUUID();
    BigDecimal amount = new BigDecimal("12.50");
    assertEquals(
        "/dashboard/" + walletId + "?tab=transactions&tx=" + txId,
        NotificationCopy.transactionActivity(
                Notification.NotificationType.TRANSACTION_UPDATED,
                "nicola",
                "Food",
                amount,
                "EUR",
                "Casa",
                walletId,
                txId)
            .url());
    assertEquals(
        "/dashboard/" + walletId + "?tab=transactions",
        NotificationCopy.transactionActivity(
                Notification.NotificationType.TRANSACTION_DELETED,
                "nicola",
                "Food",
                amount,
                "EUR",
                "Casa",
                walletId,
                txId)
            .url());
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
            "Netflix", new BigDecimal("9.99"), "EUR", "Casa", walletId, UUID.randomUUID());
    assertEquals("Recurring transaction executed", copy.title());
    assertEquals("Netflix · 9.99 EUR · Casa", copy.body());
    assertEquals("/dashboard/" + walletId + "?tab=subscriptions", copy.url());
  }

  @Test
  void recurringReminderCopyAsksForAmountAndOpensTransaction() {
    UUID txId = UUID.randomUUID();
    var copy =
        NotificationCopy.recurringExecuted("Electricity", null, "EUR", "Casa", walletId, txId);
    assertEquals("Recurring reminder: amount needed", copy.title());
    assertEquals("Electricity · Casa", copy.body());
    assertEquals("/dashboard/" + walletId + "?tab=transactions&tx=" + txId, copy.url());
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
            walletId,
            null);
    assertEquals("Untagged · 12.50 EUR · Casa", copy.body());
  }

  @Test
  void monthlyReportReadyCopy() {
    var copy = NotificationCopy.monthlyReportReady("June 2026");
    assertEquals("Your June 2026 report is ready", copy.title());
    assertEquals("Your monthly summary was just emailed to you as a PDF.", copy.body());
    assertEquals("/dashboard", copy.url());
  }

  @Test
  void yearlyReportReadyCopy() {
    var copy = NotificationCopy.yearlyReportReady(2025);
    assertEquals("Your 2025 wrap-up is here 🎉", copy.title());
    assertEquals("Your year in review was just emailed to you as a PDF.", copy.body());
    assertEquals("/dashboard", copy.url());
  }

  @Test
  void budgetAlertCopy() {
    UUID walletId = UUID.randomUUID();
    NotificationCopy.Copy warn = NotificationCopy.budgetAlert("Food", 80, "Casa", walletId);
    assertEquals("Budget at 80%", warn.title());
    assertEquals("\"Food\" reached 80% of its limit in Casa", warn.body());
    assertEquals("/dashboard/" + walletId + "?tab=budget", warn.url());
    assertEquals(
        "Budget limit reached",
        NotificationCopy.budgetAlert("Food", 100, "Casa", walletId).title());
  }
}
