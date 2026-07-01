package dev.busato.FinanceWebApp.backend.CronJob;

import dev.busato.FinanceWebApp.backend.service.BackupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Runs every day at 03:00 AM. */
@Slf4j
@Component
@RequiredArgsConstructor
public class BackupCronJob {

  private final BackupService backupService;

  // Every day at 03:00 AM  →  cron: "0 0 2 * * *"
  @Scheduled(cron = "0 0 3 * * *")
  public void scheduledBackup() {
    log.info("[BackupCronJob] Automatic backup started");
    try {
      String filename = backupService.runBackup();
      log.info("[BackupCronJob] Backup completed – file={}", filename);
    } catch (Exception e) {
      log.error("[BackupCronJob] Backup failed: {}", e.getMessage(), e);
    }
  }
}
