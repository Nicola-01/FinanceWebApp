package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.WalletDashboardResponse;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WalletDashboardService {

  private final WalletService walletService;
  private final TransactionService transactionService;
  private final SubscriptionService subscriptionService;
  private final TagService tagService;

  /**
   * Aggregates the wallet, its transactions, subscriptions and tags into a single response.
   * Delegates to the existing per-resource services so their {@code @PreAuthorize} checks still
   * apply — this class performs no authorization of its own.
   */
  public WalletDashboardResponse getDashboard(UUID walletId, UUID userId) {
    return WalletDashboardResponse.builder()
        .wallet(walletService.getWallet(userId, walletId))
        .transactions(transactionService.getTransactionsByWalletID(walletId, userId))
        .subscriptions(subscriptionService.getSubscriptionsByWalletID(walletId, userId))
        .tags(tagService.getTags(walletId, userId))
        .build();
  }
}
