package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.core.sync.ResponseTransformer;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Object;

class R2StorageServiceTest {

  private R2StorageService r2StorageService;
  private S3Client mockS3Client;
  private Path tempFile;

  @BeforeEach
  void setUp() {
    r2StorageService = new R2StorageService();
    mockS3Client = mock(S3Client.class);
    ReflectionTestUtils.setField(r2StorageService, "bucket", "test-bucket");
  }

  @AfterEach
  void tearDown() throws IOException {
    if (tempFile != null && Files.exists(tempFile)) {
      Files.deleteIfExists(tempFile);
    }
  }

  private void enable() {
    ReflectionTestUtils.setField(r2StorageService, "enabled", true);
    ReflectionTestUtils.setField(r2StorageService, "s3", mockS3Client);
  }

  // ==================== isEnabled ====================

  @Test
  void isEnabled_ReturnsTrue_WhenEnabledFieldIsTrue() {
    ReflectionTestUtils.setField(r2StorageService, "enabled", true);
    assertTrue(r2StorageService.isEnabled());
  }

  @Test
  void isEnabled_ReturnsFalse_WhenEnabledFieldIsFalse() {
    ReflectionTestUtils.setField(r2StorageService, "enabled", false);
    assertFalse(r2StorageService.isEnabled());
  }

  // ==================== requireEnabled (via listBackups/upload/download/delete)
  // ====================

  @Test
  void listBackups_ThrowsIllegalStateException_WhenDisabled() {
    ReflectionTestUtils.setField(r2StorageService, "enabled", false);
    assertThrows(IllegalStateException.class, () -> r2StorageService.listBackups());
  }

  @Test
  void listBackups_ThrowsIllegalStateException_WhenS3NotInitialized() {
    ReflectionTestUtils.setField(r2StorageService, "enabled", true);
    ReflectionTestUtils.setField(r2StorageService, "s3", null);
    assertThrows(IllegalStateException.class, () -> r2StorageService.listBackups());
  }

  @Test
  void upload_ThrowsIllegalStateException_WhenDisabled() {
    ReflectionTestUtils.setField(r2StorageService, "enabled", false);
    Path fakePath = Path.of("nonexistent.file");
    assertThrows(IllegalStateException.class, () -> r2StorageService.upload(fakePath, "key"));
  }

  @Test
  void download_ThrowsIllegalStateException_WhenDisabled() {
    ReflectionTestUtils.setField(r2StorageService, "enabled", false);
    Path fakePath = Path.of("nonexistent.file");
    assertThrows(IllegalStateException.class, () -> r2StorageService.download("key", fakePath));
  }

  @Test
  void delete_ThrowsIllegalStateException_WhenDisabled() {
    ReflectionTestUtils.setField(r2StorageService, "enabled", false);
    assertThrows(IllegalStateException.class, () -> r2StorageService.delete("key"));
  }

  // ==================== listBackups ====================

  @Test
  void listBackups_ReturnsEntriesSortedNewestFirst() {
    enable();

    Instant older = Instant.parse("2026-01-01T00:00:00Z");
    Instant newer = Instant.parse("2026-06-01T00:00:00Z");

    S3Object oldObject =
        S3Object.builder().key("backup-old.sql.gz.enc").lastModified(older).size(100L).build();
    S3Object newObject =
        S3Object.builder().key("backup-new.sql.gz.enc").lastModified(newer).size(200L).build();

    ListObjectsV2Response response =
        ListObjectsV2Response.builder().contents(oldObject, newObject).build();

    when(mockS3Client.listObjectsV2(any(ListObjectsV2Request.class))).thenReturn(response);

    List<R2StorageService.BackupEntry> result = r2StorageService.listBackups();

    assertEquals(2, result.size());
    assertEquals("backup-new.sql.gz.enc", result.get(0).key());
    assertEquals(newer, result.get(0).lastModified());
    assertEquals(200L, result.get(0).sizeBytes());
    assertEquals("backup-old.sql.gz.enc", result.get(1).key());
    assertEquals(older, result.get(1).lastModified());
    assertEquals(100L, result.get(1).sizeBytes());
  }

  @Test
  void listBackups_ReturnsEmptyList_WhenNoObjects() {
    enable();

    ListObjectsV2Response response = ListObjectsV2Response.builder().contents(List.of()).build();
    when(mockS3Client.listObjectsV2(any(ListObjectsV2Request.class))).thenReturn(response);

    List<R2StorageService.BackupEntry> result = r2StorageService.listBackups();

    assertTrue(result.isEmpty());
  }

  // ==================== upload ====================

  @Test
  void upload_CallsPutObject_WithCorrectBucketAndKey() throws IOException {
    enable();
    tempFile = Files.createTempFile("r2-upload-test", ".sql.gz.enc");
    Files.writeString(tempFile, "dummy content");

    r2StorageService.upload(tempFile, "my-backup-key.sql.gz.enc");

    ArgumentCaptor<PutObjectRequest> captor = ArgumentCaptor.forClass(PutObjectRequest.class);
    verify(mockS3Client).putObject(captor.capture(), any(RequestBody.class));

    PutObjectRequest request = captor.getValue();
    assertEquals("test-bucket", request.bucket());
    assertEquals("my-backup-key.sql.gz.enc", request.key());
  }

  // ==================== download ====================

  @Test
  void download_CallsGetObject_WithCorrectBucketAndKey() {
    enable();
    Path destination = Path.of("some/local/destination.sql.gz.enc");

    r2StorageService.download("remote-key.sql.gz.enc", destination);

    ArgumentCaptor<GetObjectRequest> captor = ArgumentCaptor.forClass(GetObjectRequest.class);
    verify(mockS3Client).getObject(captor.capture(), any(ResponseTransformer.class));

    GetObjectRequest request = captor.getValue();
    assertEquals("test-bucket", request.bucket());
    assertEquals("remote-key.sql.gz.enc", request.key());
  }

  // ==================== delete ====================

  @Test
  void delete_CallsDeleteObject_WithCorrectBucketAndKey() {
    enable();

    r2StorageService.delete("delete-me.sql.gz.enc");

    ArgumentCaptor<DeleteObjectRequest> captor = ArgumentCaptor.forClass(DeleteObjectRequest.class);
    verify(mockS3Client).deleteObject(captor.capture());

    DeleteObjectRequest request = captor.getValue();
    assertEquals("test-bucket", request.bucket());
    assertEquals("delete-me.sql.gz.enc", request.key());
  }

  // ==================== BackupEntry record ====================

  @Test
  void backupEntry_AccessorsReturnConstructorValues() {
    Instant now = Instant.now();
    R2StorageService.BackupEntry entry = new R2StorageService.BackupEntry("k.sql.gz.enc", now, 42L);

    assertEquals("k.sql.gz.enc", entry.key());
    assertEquals(now, entry.lastModified());
    assertEquals(42L, entry.sizeBytes());
  }
}
