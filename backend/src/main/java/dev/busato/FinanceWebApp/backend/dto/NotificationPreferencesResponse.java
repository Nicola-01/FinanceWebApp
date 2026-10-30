package dev.busato.FinanceWebApp.backend.dto;

import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * The caller's global notification toggles plus the per-wallet preferences of each accepted
 * membership.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferencesResponse {

  private boolean invites;
  private boolean monthlyReport;
  private boolean yearlyReport;
  private List<WalletPrefs> wallets;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class WalletPrefs {
    private UUID walletId;
    private String walletName;
    private boolean muted;
    private boolean transactions;
    private boolean subscriptions;
    private boolean recurringExecutions;
    private boolean budgets;
  }
}
