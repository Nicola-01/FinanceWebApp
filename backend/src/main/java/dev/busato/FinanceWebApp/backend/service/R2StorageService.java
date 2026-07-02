package dev.busato.FinanceWebApp.backend.service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.URI;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.core.sync.ResponseTransformer;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

/**
 * Thin wrapper around AWS SDK v2 S3Client configured to talk to Cloudflare R2.
 *
 * <p>R2 is S3-compatible: we just point the endpoint at the R2 account URL. The client is built
 * lazily (only when r2.enabled=true) so local dev without any R2 credentials still works.
 */
@Slf4j
@Service
public class R2StorageService {

  @Value("${r2.access-key:}")
  private String accessKey;

  @Value("${r2.secret-key:}")
  private String secretKey;

  @Value("${r2.endpoint:}")
  private String endpoint;

  @Value("${r2.bucket:}")
  private String bucket;

  @Value("${r2.enabled:false}")
  private boolean enabled;

  private S3Client s3;

  @PostConstruct
  private void init() {
    if (!enabled) {
      log.info("[R2] Integration disabled (r2.enabled=false) – operating in local-only mode.");
      return;
    }
    if (accessKey.isBlank() || secretKey.isBlank() || endpoint.isBlank() || bucket.isBlank()) {
      log.warn(
          "[R2] One or more R2 config values are empty – R2 integration will fail at runtime.");
    }
    s3 =
        S3Client.builder()
            .endpointOverride(URI.create(endpoint))
            // R2 uses "auto" as region placeholder
            .region(Region.of("auto"))
            .credentialsProvider(
                StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey)))
            .forcePathStyle(true) // required for R2
            .build();
    log.info("[R2] S3 client initialised – endpoint={} bucket={}", endpoint, bucket);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  public boolean isEnabled() {
    return enabled;
  }

  /**
   * List all backup objects in the bucket, sorted newest-first. Returns a list of [key,
   * lastModified, sizeBytes] records.
   */
  public List<BackupEntry> listBackups() {
    requireEnabled();
    ListObjectsV2Response resp =
        s3.listObjectsV2(ListObjectsV2Request.builder().bucket(bucket).build());

    return resp.contents().stream()
        .map(o -> new BackupEntry(o.key(), o.lastModified(), o.size()))
        .sorted(Comparator.comparing(BackupEntry::lastModified).reversed())
        .toList();
  }

  /**
   * Upload a local file to R2.
   *
   * @param localFile path to the .sql.gz.enc file
   * @param key object key to use in R2 (usually the filename)
   */
  public void upload(Path localFile, String key) throws IOException {
    requireEnabled();
    log.info("[R2] Uploading {} → s3://{}/{}", localFile.getFileName(), bucket, key);
    s3.putObject(
        PutObjectRequest.builder().bucket(bucket).key(key).build(),
        RequestBody.fromFile(localFile));
    log.info("[R2] Upload complete: {}", key);
  }

  /**
   * Download an object from R2 and write it to localFile.
   *
   * @param key object key in R2
   * @param localFile destination path
   */
  public void download(String key, Path localFile) {
    requireEnabled();
    log.info("[R2] Downloading s3://{}/{} → {}", bucket, key, localFile);
    s3.getObject(
        GetObjectRequest.builder().bucket(bucket).key(key).build(),
        ResponseTransformer.toFile(localFile));
    log.info("[R2] Download complete: {}", key);
  }

  /** Delete an object from R2. */
  public void delete(String key) {
    requireEnabled();
    s3.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
    log.info("[R2] Deleted: {}", key);
  }

  // ── Helper types ──────────────────────────────────────────────────────────

  private void requireEnabled() {
    if (!enabled || s3 == null) {
      throw new IllegalStateException(
          "R2 integration is disabled – set r2.enabled=true and configure credentials.");
    }
  }

  public record BackupEntry(String key, Instant lastModified, long sizeBytes) {}
}
