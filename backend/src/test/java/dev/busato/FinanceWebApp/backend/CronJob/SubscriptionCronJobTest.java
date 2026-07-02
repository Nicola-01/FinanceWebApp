package dev.busato.FinanceWebApp.backend.CronJob;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.service.SubscriptionService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SubscriptionCronJobTest {

  @Mock private SubscriptionService subscriptionService;

  @InjectMocks private SubscriptionCronJob subscriptionCronJob;

  @Test
  void runDailySubscriptions_CallsService() {
    assertDoesNotThrow(() -> subscriptionCronJob.runDailySubscriptions());

    verify(subscriptionService, times(1)).processDueSubscriptions();
  }

  @Test
  void runDailySubscriptions_Idempotency_CallingTwiceOnlyProcessesWhatServiceFinds() {
    subscriptionCronJob.runDailySubscriptions();
    subscriptionCronJob.runDailySubscriptions();

    // The job just delegates. Idempotency is guaranteed by the service
    // querying for dates <= today, and updating them to the future.
    verify(subscriptionService, times(2)).processDueSubscriptions();
  }

  @Test
  void runDailySubscriptions_ErrorHandling_SpringAbsorbsExceptions() {
    doThrow(new RuntimeException("Database error"))
        .when(subscriptionService)
        .processDueSubscriptions();

    // The cron job method itself doesn't catch it, but Spring's @Scheduled
    // will log the exception and move on without crashing the app.
    assertThrows(RuntimeException.class, () -> subscriptionCronJob.runDailySubscriptions());

    verify(subscriptionService, times(1)).processDueSubscriptions();
  }
}
