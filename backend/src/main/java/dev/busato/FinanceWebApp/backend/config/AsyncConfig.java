package dev.busato.FinanceWebApp.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Enables Spring's {@code @Async} support so the notification dispatcher runs off the request
 * thread. NOTE: this also activates the pre-existing {@code @Async} on {@code
 * PatService.updateLastUsedAsync} — intended and harmless.
 */
@Configuration
@EnableAsync
public class AsyncConfig {}
