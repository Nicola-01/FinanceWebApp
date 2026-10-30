package dev.busato.FinanceWebApp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** The caller's notification preferences for one wallet: master mute + per-event-type toggles. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletNotificationPrefsRequest {
  private boolean muted;
  private boolean transactions;
  private boolean subscriptions;
  private boolean recurringExecutions;
  private boolean budgets;
}
