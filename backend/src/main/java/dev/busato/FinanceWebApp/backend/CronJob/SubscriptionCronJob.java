package dev.busato.FinanceWebApp.backend.CronJob;

import dev.busato.FinanceWebApp.backend.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SubscriptionCronJob {

    private final SubscriptionService subscriptionService;

    // Run every day at 2:00 a.m.
    @Scheduled(cron = "0 0 2 * * *")
    public void runDailySubscriptions() {
        System.out.println("Running the daily subscription job...");
        subscriptionService.processDueSubscriptions();
    }
}