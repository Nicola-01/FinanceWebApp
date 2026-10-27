package dev.busato.FinanceWebApp.backend.openbanking;

import java.time.Duration;

/** Injectable pause, so polling code can be tested without waiting. */
@FunctionalInterface
public interface Sleeper {
  void sleep(Duration duration) throws InterruptedException;
}
