package dev.busato.FinanceWebApp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** New values for the global per-event-type notification toggles and report opt-ins. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferencesRequest {
  private boolean invites;
  private boolean transactions;
  private boolean subscriptions;
  private boolean recurringExecutions;
  private boolean monthlyReport;
  private boolean yearlyReport;
}
