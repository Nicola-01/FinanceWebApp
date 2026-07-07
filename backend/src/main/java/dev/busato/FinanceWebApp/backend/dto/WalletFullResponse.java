package dev.busato.FinanceWebApp.backend.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Result of the atomic wallet-creation endpoint: the created wallet plus the per-resource bulk
 * outcomes, so clients can render a per-resource recap. Every section is always present; a resource
 * that was not staged simply reports empty lists.
 */
@Data
@Builder
public class WalletFullResponse {
  private WalletResponse wallet;
  private TagBulkResponse tags;
  private SubscriptionBulkResponse subscriptions;
  private TransactionBulkResponse transactions;
}
