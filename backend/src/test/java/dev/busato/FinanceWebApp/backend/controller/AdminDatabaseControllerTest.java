package dev.busato.FinanceWebApp.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import dev.busato.FinanceWebApp.backend.service.BackupService;
import dev.busato.FinanceWebApp.backend.service.R2StorageService;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

@WebMvcTest(
    controllers = AdminDatabaseController.class,
    excludeAutoConfiguration = {
      org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class
    })
@WithMockUser(roles = "ADMIN")
class AdminDatabaseControllerTest extends BaseWebMvcTest {

  @org.springframework.test.context.bean.override.mockito.MockitoBean
  private BackupService backupService;

  @Test
  void listBackups_ShouldReturn200() throws Exception {
    R2StorageService.BackupEntry entry =
        new R2StorageService.BackupEntry("db_backup_1.sql.gz.enc", Instant.now(), 1234L);

    when(backupService.listAvailableBackups()).thenReturn(List.of(entry));

    mockMvc
        .perform(get("/api/admin/backup/list"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].key").value("db_backup_1.sql.gz.enc"))
        .andExpect(jsonPath("$[0].sizeBytes").value(1234));
  }

  @Test
  void triggerManualBackup_ShouldReturn200() throws Exception {
    when(backupService.runBackup()).thenReturn("db_backup_2026-07-01.sql.gz.enc");

    mockMvc
        .perform(post("/api/admin/backup"))
        .andExpect(status().isOk())
        .andExpect(content().string("Backup completed: db_backup_2026-07-01.sql.gz.enc"));
  }

  @Test
  void downloadBackup_ShouldReturn200WithHeaders() throws Exception {
    String key = "db_backup_2026-07-01.sql.gz.enc";
    Resource resource =
        new ByteArrayResource("fake-content".getBytes()) {
          @Override
          public String getFilename() {
            return "db_backup_2026-07-01.sql";
          }
        };

    when(backupService.downloadBackup(eq(key))).thenReturn(resource);

    mockMvc
        .perform(get("/api/admin/backup/download/{key}", key))
        .andExpect(status().isOk())
        .andExpect(content().contentType(MediaType.APPLICATION_OCTET_STREAM))
        .andExpect(
            header()
                .string(
                    HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"db_backup_2026-07-01.sql\""));
  }

  @Test
  void restoreBackup_ShouldReturn200() throws Exception {
    String key = "db_backup_2026-07-01.sql.gz.enc";

    mockMvc
        .perform(post("/api/admin/restore/{key}", key))
        .andExpect(status().isOk())
        .andExpect(content().string("Restore from '" + key + "' completed successfully."));

    verify(backupService).restoreBackup(eq(key));
  }

  @Test
  void uploadBackup_WithFile_ShouldReturn200() throws Exception {
    MockMultipartFile file =
        new MockMultipartFile(
            "file",
            "db_backup.sql",
            MediaType.APPLICATION_OCTET_STREAM_VALUE,
            "content".getBytes());

    when(backupService.uploadBackup(eq("db_backup.sql"), any(byte[].class)))
        .thenReturn("saved_db_backup.sql");

    mockMvc
        .perform(MockMvcRequestBuilders.multipart("/api/admin/backup/upload").file(file))
        .andExpect(status().isOk())
        .andExpect(content().string("File saved as: saved_db_backup.sql"));
  }

  @Test
  void uploadBackup_WithEmptyFile_ShouldReturn400() throws Exception {
    MockMultipartFile emptyFile =
        new MockMultipartFile(
            "file", "empty.sql", MediaType.APPLICATION_OCTET_STREAM_VALUE, new byte[0]);

    mockMvc
        .perform(MockMvcRequestBuilders.multipart("/api/admin/backup/upload").file(emptyFile))
        .andExpect(status().isBadRequest())
        .andExpect(content().string("No file provided."));

    verify(backupService, never()).uploadBackup(any(), any());
  }
}
