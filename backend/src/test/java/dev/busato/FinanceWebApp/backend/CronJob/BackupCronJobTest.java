package dev.busato.FinanceWebApp.backend.CronJob;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
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
  void run_Success_CallsBackupServiceAndReturnsMessage() throws Exception {
    when(backupService.runBackup()).thenReturn("backup_2024.sql.gz.enc");

    String message = backupCronJob.run();

    assertEquals("Backup created: backup_2024.sql.gz.enc", message);
    verify(backupService, times(1)).runBackup();
  }

  @Test
  void run_ExceptionThrown_Propagates() throws Exception {
    when(backupService.runBackup()).thenThrow(new IOException("Disk full"));

    // The scheduler wrapper records the failure; the job itself propagates.
    assertThrows(IOException.class, () -> backupCronJob.run());

    verify(backupService, times(1)).runBackup();
  }

  @Test
  void metadata_IsStable() {
    assertEquals("backup", backupCronJob.key());
    assertEquals("Database Backup", backupCronJob.displayName());
    assertTrue(backupCronJob.available());
    assertEquals(JobFrequency.DAILY, backupCronJob.defaults().frequency());
    assertEquals(3, backupCronJob.defaults().hour());
    assertEquals(0, backupCronJob.defaults().minute());
  }
}
