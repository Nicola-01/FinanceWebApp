package dev.busato.FinanceWebApp.backend.CronJob;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.service.BackupService;
import java.io.IOException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BackupCronJobTest {

  @Mock private BackupService backupService;

  @InjectMocks private BackupCronJob backupCronJob;

  @Test
  void scheduledBackup_Success_CallsBackupService() throws Exception {
    when(backupService.runBackup()).thenReturn("backup_2024.sql.gz.enc");

    assertDoesNotThrow(() -> backupCronJob.scheduledBackup());

    verify(backupService, times(1)).runBackup();
  }

  @Test
  void scheduledBackup_ExceptionThrown_CaughtAndDoesNotCrash() throws Exception {
    when(backupService.runBackup()).thenThrow(new IOException("Disk full"));

    // Verify that the exception is swallowed by the cron job (as designed)
    assertDoesNotThrow(() -> backupCronJob.scheduledBackup());

    verify(backupService, times(1)).runBackup();
  }
}
