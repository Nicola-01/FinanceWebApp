package dev.busato.FinanceWebApp.backend.push;

import dev.busato.FinanceWebApp.backend.model.Notification.NotificationType;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Pure, static builders for the user-facing notification copy. Every string here is user-approved
 * and pinned byte-for-byte by {@code NotificationCopyTest} — do not reword.
 */
public final class NotificationCopy {

  private NotificationCopy() {}

  /** The three rendered strings for one notification. */
  public record Copy(String title, String body, String url) {}

  public static Copy transactionActivity(
      NotificationType type,
      String actorUsername,
      String tagName,
      BigDecimal amount,
      String currency,
      String walletName,
      UUID walletId) {
    String title =
        switch (type) {
          case TRANSACTION_CREATED -> "New transaction by @" + actorUsername;
          case TRANSACTION_UPDATED -> "Transaction updated by @" + actorUsername;
          case TRANSACTION_DELETED -> "Transaction deleted by @" + actorUsername;
          default -> throw new IllegalArgumentException("Not a transaction type: " + type);
        };
    return new Copy(title, recap(tagName, amount, currency, walletName), transactionUrl(walletId));
  }

  public static Copy subscriptionActivity(
      NotificationType type,
      String actorUsername,
      String tagName,
      BigDecimal amount,
      String currency,
      String walletName,
      UUID walletId) {
    String title =
        switch (type) {
          case SUBSCRIPTION_CREATED -> "New subscription by @" + actorUsername;
          case SUBSCRIPTION_UPDATED -> "Subscription updated by @" + actorUsername;
          case SUBSCRIPTION_DELETED -> "Subscription deleted by @" + actorUsername;
          default -> throw new IllegalArgumentException("Not a subscription type: " + type);
        };
    return new Copy(title, recap(tagName, amount, currency, walletName), subscriptionUrl(walletId));
  }

  public static Copy recurringExecuted(
      String txName, BigDecimal amount, String currency, String walletName, UUID walletId) {
    return new Copy(
        "Recurring transaction executed",
        recap(txName, amount, currency, walletName),
        subscriptionUrl(walletId));
  }

  public static Copy walletInvite(String inviterUsername, String walletName) {
    return new Copy(
        "Wallet invitation",
        "@" + inviterUsername + " invited you to \"" + walletName + "\"",
        "/dashboard");
  }

  /** Recap body: {@code "{name} · {amount} {currency} · {walletName}"}; null name → "Untagged". */
  private static String recap(String name, BigDecimal amount, String currency, String walletName) {
    String label = (name == null) ? "Untagged" : name;
    return label + " · " + amount + " " + currency + " · " + walletName;
  }

  private static String transactionUrl(UUID walletId) {
    return "/dashboard/" + walletId + "?tab=transactions";
  }

  private static String subscriptionUrl(UUID walletId) {
    return "/dashboard/" + walletId + "?tab=subscriptions";
  }
}
