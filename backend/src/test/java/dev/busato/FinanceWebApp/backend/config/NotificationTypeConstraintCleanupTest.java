package dev.busato.FinanceWebApp.backend.config;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;

class NotificationTypeConstraintCleanupTest {

  private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
  private final NotificationTypeConstraintCleanup cleanup =
      new NotificationTypeConstraintCleanup(jdbc);

  @Test
  void dropsConstraintOnPostgres() {
    when(jdbc.execute(any(ConnectionCallback.class))).thenReturn("PostgreSQL");
    cleanup.run(null);
    verify(jdbc)
        .execute("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check");
  }

  @Test
  void skipsOtherDatabases() {
    when(jdbc.execute(any(ConnectionCallback.class))).thenReturn("H2");
    cleanup.run(null);
    verify(jdbc, never()).execute(anyString());
  }
}
