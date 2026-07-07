package dev.busato.FinanceWebApp.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Composite payload for the atomic wallet-creation endpoint ({@code POST /api/wallets/full}): the
 * wallet itself plus its initial tags, subscriptions and transactions, persisted in one
 * transaction. Composes {@link WalletRequest} rather than extending it because that DTO is shared
 * with the wallet-update endpoint. The staged lists are optional; null or empty lists are skipped.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WalletFullRequest {
  @NotNull(message = "Wallet is required")
  @Valid
  private WalletRequest wallet;

  @Valid private List<TagRequest> tags;

  @Valid private List<SubscriptionRequest> subscriptions;

  @Valid private List<TransactionRequest> transactions;
}
