package dev.busato.FinanceWebApp.backend.CronJob;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
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
  void run_CallsService_ReturnsMessage() {
    String message = subscriptionCronJob.run();

    assertEquals("Processed due subscriptions", message);
    verify(subscriptionService, times(1)).processDueSubscriptions();
  }

  @Test
  void run_Idempotency_CallingTwiceDelegatesEachTime() {
    subscriptionCronJob.run();
    subscriptionCronJob.run();

    // The job just delegates. Idempotency is guaranteed by the service
    // querying for dates <= today and updating them to the future.
    verify(subscriptionService, times(2)).processDueSubscriptions();
  }

  @Test
  void run_Error_Propagates() {
    doThrow(new RuntimeException("Database error"))
        .when(subscriptionService)
        .processDueSubscriptions();

    assertThrows(RuntimeException.class, () -> subscriptionCronJob.run());

    verify(subscriptionService, times(1)).processDueSubscriptions();
  }

  @Test
  void metadata_IsStable() {
    assertEquals("subscriptions", subscriptionCronJob.key());
    assertEquals("Subscription Execution", subscriptionCronJob.displayName());
    assertTrue(subscriptionCronJob.available());
    assertEquals(JobFrequency.DAILY, subscriptionCronJob.defaults().frequency());
    assertEquals(0, subscriptionCronJob.defaults().hour());
    assertEquals(5, subscriptionCronJob.defaults().minute());
  }
}
