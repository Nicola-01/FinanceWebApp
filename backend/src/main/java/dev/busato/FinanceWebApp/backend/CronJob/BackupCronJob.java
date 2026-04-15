package dev.busato.FinanceWebApp.backend.CronJob;

import dev.busato.FinanceWebApp.backend.service.BackupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Replicates the cron behaviour of backup_sh.sh --auto
 * Runs every day at 02:00 AM (matches the shell cron suggestion).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BackupCronJob {

    private final BackupService backupService;

    // Every day at 02:00 AM  →  cron: "0 0 2 * * *"
    @Scheduled(cron = "0 0 2 * * *")
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
