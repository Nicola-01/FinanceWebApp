package dev.busato.FinanceWebApp.backend.CronJob;

import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
import dev.busato.FinanceWebApp.backend.scheduling.ManagedJob;
import dev.busato.FinanceWebApp.backend.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Materializes due subscriptions into transactions. Default schedule: daily at 00:05 (editable in
 * the admin System tab).
 */
@Component
@RequiredArgsConstructor
public class SubscriptionCronJob implements ManagedJob {

  private final SubscriptionService subscriptionService;

  @Override
  public String key() {
    return "subscriptions";
  }

  @Override
  public String displayName() {
    return "Subscription Execution";
  }

  @Override
  public ScheduleDefaults defaults() {
    return new ScheduleDefaults(JobFrequency.DAILY, 0, 5, null);
  }

  @Override
  public String run() {
    subscriptionService.processDueSubscriptions();
    return "Processed due subscriptions";
  }
}
