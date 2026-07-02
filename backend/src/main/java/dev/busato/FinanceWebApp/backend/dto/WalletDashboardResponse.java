package dev.busato.FinanceWebApp.backend.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WalletDashboardResponse {
  private WalletResponse wallet;
  private List<TransactionResponse> transactions;
  private List<SubscriptionResponse> subscriptions;
  private List<TagResponse> tags;
}
