package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.SubscriptionBulkResponse;
import dev.busato.FinanceWebApp.backend.dto.TagBulkResponse;
import dev.busato.FinanceWebApp.backend.dto.TransactionBulkResponse;
import dev.busato.FinanceWebApp.backend.dto.WalletFullRequest;
import dev.busato.FinanceWebApp.backend.dto.WalletFullResponse;
import dev.busato.FinanceWebApp.backend.dto.WalletResponse;
import jakarta.transaction.Transactional;
import java.util.UUID;
import java.util.function.Supplier;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Atomic wallet provisioning for the creation wizard: creates the wallet and bulk-upserts its
 * initial tags, subscriptions and transactions in a single transaction, so a failure at any stage
 * rolls back everything and no half-initialised wallet is ever persisted.
 *
 * <p>The bulk stages go through the services' {@code *BulkInternal} variants (no
 * {@code @PreAuthorize}): access is true by construction — the wallet was just created here with
 * the caller as OWNER — and the pre-authorized variants would wrongly 403 PAT callers, whose
 * in-memory credentials don't yet reflect the auto-grant {@code createWallet} wrote to the DB.
 */
@Service
@RequiredArgsConstructor
public class WalletProvisioningService {

  private final WalletService walletService;
  private final TagService tagService;
  private final SubscriptionService subscriptionService;
  private final TransactionService transactionService;

  /**
   * Creates the wallet and persists its staged resources atomically. Stages run sequentially, tags
   * first, so tags referenced by name from subscriptions/transactions are the ones the user styled
   * rather than auto-created defaults.
   *
   * @param request The composite draft (wallet plus optional tag/subscription/transaction lists)
   * @param userId The UUID of the creating user, who becomes the wallet's OWNER
   * @return The created wallet and the per-resource bulk outcomes
   * @throws IllegalArgumentException if any stage rejects a row; the message is prefixed with the
   *     failing resource (e.g. {@code "Transactions: Row 3: ..."}) and the whole transaction —
   *     wallet included — is rolled back
   */
  @Transactional
  public WalletFullResponse createWalletFull(WalletFullRequest request, UUID userId) {
    WalletResponse wallet = walletService.createWallet(request.getWallet(), userId);
    UUID walletId = wallet.getId();

    TagBulkResponse tags =
        stage("Tags", () -> tagService.createTagsBulkInternal(request.getTags(), walletId));
    SubscriptionBulkResponse subscriptions =
        stage(
            "Subscriptions",
            () ->
                subscriptionService.createSubscriptionsBulkInternal(
                    request.getSubscriptions(), walletId));
    TransactionBulkResponse transactions =
        stage(
            "Transactions",
            () ->
                transactionService.createTransactionsBulkInternal(
                    request.getTransactions(), walletId));

    return WalletFullResponse.builder()
        .wallet(wallet)
        .tags(tags)
        .subscriptions(subscriptions)
        .transactions(transactions)
        .build();
  }

  /** Re-throws a stage's row error prefixed with the resource name so clients can attribute it. */
  private <T> T stage(String resource, Supplier<T> action) {
    try {
      return action.get();
    } catch (IllegalArgumentException ex) {
      throw new IllegalArgumentException(resource + ": " + ex.getMessage(), ex);
    }
  }
}
