package dev.busato.FinanceWebApp.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Drops the {@code notifications_type_check} constraint Hibernate generated back when the column
 * was mapped with {@code @Enumerated(STRING)}: it lists only the types that existed at creation and
 * would reject newer ones (e.g. BANK_CONNECTION). Idempotent; PostgreSQL only (H2 test databases
 * are created fresh through the converter and never have it).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationTypeConstraintCleanup implements ApplicationRunner {

  private final JdbcTemplate jdbc;

  @Override
  public void run(ApplicationArguments args) {
    String db =
        jdbc.execute((ConnectionCallback<String>) c -> c.getMetaData().getDatabaseProductName());
    if (!"PostgreSQL".equals(db)) return;
    jdbc.execute("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check");
    log.info("Ensured notifications_type_check constraint is absent");
  }
}
