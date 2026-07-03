package dev.busato.FinanceWebApp.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

/**
 * Provides the {@link ThreadPoolTaskScheduler} used by {@link
 * dev.busato.FinanceWebApp.backend.scheduling.ScheduledJobService} to run managed jobs on
 * DB-driven, editable cron triggers (replacing the old hardcoded {@code @Scheduled} annotations).
 */
@Configuration
public class SchedulingConfig {

  @Bean
  public ThreadPoolTaskScheduler taskScheduler() {
    ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
    scheduler.setPoolSize(2);
    scheduler.setThreadNamePrefix("job-sched-");
    scheduler.setWaitForTasksToCompleteOnShutdown(true);
    scheduler.initialize();
    return scheduler;
  }
}
