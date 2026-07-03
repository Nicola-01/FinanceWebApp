package dev.busato.FinanceWebApp.backend.CronJob;

import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
import dev.busato.FinanceWebApp.backend.scheduling.ManagedJob;
import dev.busato.FinanceWebApp.backend.service.BackupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/** Database backup job. Default schedule: daily at 03:00 (editable in the admin System tab). */
@Slf4j
@Component
@RequiredArgsConstructor
public class BackupCronJob implements ManagedJob {

  private final BackupService backupService;

  @Override
  public String key() {
    return "backup";
  }

  @Override
  public String displayName() {
    return "Database Backup";
  }

  @Override
  public ScheduleDefaults defaults() {
    return new ScheduleDefaults(JobFrequency.DAILY, 3, 0, null);
  }

  @Override
  public String run() throws Exception {
    log.info("[BackupCronJob] Backup started");
    String filename = backupService.runBackup();
    log.info("[BackupCronJob] Backup completed – file={}", filename);
    return "Backup created: " + filename;
  }
}
