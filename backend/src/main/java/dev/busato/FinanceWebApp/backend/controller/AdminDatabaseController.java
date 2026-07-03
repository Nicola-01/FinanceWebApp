package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.service.BackupService;
import dev.busato.FinanceWebApp.backend.service.R2StorageService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST controller for database backup / restore / download / list operations.
 *
 * <p>All paths are under /api/admin/* which is already secured by SecurityConfig
 * (hasRole('ADMIN')). The @PreAuthorize here is a double safety-net, matching the pattern of
 * AdminUserController.
 *
 * <p>GET /api/admin/backup/list → list available backups (from R2 or local) POST /api/admin/backup
 * → trigger manual backup GET /api/admin/backup/download/{key} → download + decrypt a specific
 * backup POST /api/admin/restore/{key} → restore DB from a specific backup key POST
 * /api/admin/backup/upload → upload a .sql / .gz.enc file
 */
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDatabaseController {

  private final BackupService backupService;

  // ── 1. List available backups ─────────────────────────────────────────────

  /**
   * Returns the list of available backups, sorted newest-first. When R2 is enabled, lists bucket
   * objects; otherwise lists local /tmp files.
   *
   * <p>GET /api/admin/backup/list
   */
  @GetMapping("/backup/list")
  public ResponseEntity<List<R2StorageService.BackupEntry>> listBackups() throws Exception {
    List<R2StorageService.BackupEntry> entries = backupService.listAvailableBackups();
    return ResponseEntity.ok(entries);
  }

  // ── 2. Manual backup ──────────────────────────────────────────────────────

  /**
   * Triggers a full pg_dump → gzip → encrypt cycle. If R2 is enabled, the encrypted file is
   * uploaded and the local copy removed.
   *
   * <p>POST /api/admin/backup
   */
  @PostMapping("/backup")
  public ResponseEntity<String> triggerManualBackup() throws Exception {
    log.info("[AdminDatabaseController] Manual backup requested");
    String filename = backupService.runBackup();
    return ResponseEntity.ok("Backup completed: " + filename);
  }

  // ── 3. Download a backup ──────────────────────────────────────────────────

  /**
   * Decrypts + decompresses the backup identified by {key} and streams it back as
   * application/octet-stream.
   *
   * <p>{key} is the object key in R2 (or the filename in local mode), e.g.
   * "db_backup_2025-04-15_02-00.sql.gz.enc"
   *
   * <p>GET /api/admin/backup/download/db_backup_2025-04-15_02-00.sql.gz.enc
   */
  @GetMapping("/backup/download/{key}")
  public ResponseEntity<Resource> downloadBackup(@PathVariable String key) throws Exception {
    log.info("[AdminDatabaseController] Download backup requested – key={}", key);
    Resource resource = backupService.downloadBackup(key);

    return ResponseEntity.ok()
        .contentType(MediaType.APPLICATION_OCTET_STREAM)
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"" + resource.getFilename() + "\"")
        .body(resource);
  }

  // ── 4. Restore a backup ───────────────────────────────────────────────────

  /**
   * Downloads (from R2 or local) and restores the backup identified by {key}. DESTRUCTIVE –
   * overwrites current database content.
   *
   * <p>POST /api/admin/restore/db_backup_2025-04-15_02-00.sql.gz.enc
   */
  @PostMapping("/restore/{key}")
  public ResponseEntity<String> restoreBackup(@PathVariable String key) throws Exception {
    log.warn("[AdminDatabaseController] RESTORE requested – key={}", key);
    backupService.restoreBackup(key);
    return ResponseEntity.ok("Restore from '" + key + "' completed successfully.");
  }

  // ── 5. Delete a backup ────────────────────────────────────────────────────

  /**
   * Deletes the backup identified by {key}. Removes the R2 object when R2 is enabled, otherwise the
   * local file.
   *
   * <p>DELETE /api/admin/backup/db_backup_2025-04-15_02-00.sql.gz.enc
   */
  @DeleteMapping("/backup/{key}")
  public ResponseEntity<String> deleteBackup(@PathVariable String key) throws Exception {
    log.warn("[AdminDatabaseController] DELETE backup requested – key={}", key);
    backupService.deleteBackup(key);
    return ResponseEntity.ok("Backup '" + key + "' deleted.");
  }

  // ── 6. Upload a backup file ───────────────────────────────────────────────

  /**
   * Accepts a multipart upload of an .sql or .sql.gz.enc file. Saves locally, then pushes to R2 if
   * enabled.
   *
   * <p>POST /api/admin/backup/upload
   */
  @PostMapping(value = "/backup/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<String> uploadBackup(@RequestParam("file") MultipartFile file)
      throws Exception {
    if (file.isEmpty()) return ResponseEntity.badRequest().body("No file provided.");
    log.info(
        "[AdminDatabaseController] Upload received – name={} size={}",
        file.getOriginalFilename(),
        file.getSize());
    String saved = backupService.uploadBackup(file.getOriginalFilename(), file.getBytes());
    return ResponseEntity.ok("File saved as: " + saved);
  }
}
