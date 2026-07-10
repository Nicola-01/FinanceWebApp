package dev.busato.FinanceWebApp.backend.push;

import dev.busato.FinanceWebApp.backend.model.Notification;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Published by domain services AFTER their JPA writes and consumed after the transaction commits.
 * Carries everything the dispatcher needs to resolve recipients and build the notification copy.
 *
 * @param tagName nullable — the copy renders "Untagged" when absent
 * @param actorId nullable — null for cron/recurring events, meaning "no actor to exclude"
 * @param entityName subscription/transaction name; used by the RECURRING_EXECUTED copy
 */
public record WalletActivityEvent(
    Notification.NotificationType type,
    UUID walletId,
    String walletName,
    String currency,
    UUID actorId,
    String actorUsername,
    String tagName,
    BigDecimal amount,
    String entityName) {}
