package dev.busato.FinanceWebApp.backend.push;

import java.util.UUID;

/** Published when a real wallet-invitation access row is persisted; targets only the invitee. */
public record WalletInviteEvent(
    UUID invitedUserId, String inviterUsername, UUID walletId, String walletName) {}
