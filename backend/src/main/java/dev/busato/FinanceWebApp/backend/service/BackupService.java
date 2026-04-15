package dev.busato.FinanceWebApp.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Mirrors the full logic of backup_sh.sh with Cloudflare R2 integration.
 *
 *  backup  → pg_dump | gzip | openssl enc → local .sql.gz.enc → upload to R2
 *  restore → download from R2 (or local) → openssl dec | gzip -d → psql
 *  download→ download from R2 (or local) → decrypt → return bytes
 *  upload  → save uploaded bytes locally → push to R2
 *  list    → delegate to R2StorageService.listBackups()
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BackupService {

    private final R2StorageService r2;

    // ── Config ────────────────────────────────────────────────────────────────

@Value("${backup.container-name:finance_db_prod}")
    private String containerName; // kept for reference, no longer used for docker exec

    @Value("${backup.db-host:db}")
    private String dbHost;

    @Value("${backup.db-port:5432}")
    private String dbPort;

    @Value("${backup.db-user:admin}")
    private String dbUser;

    @Value("${backup.db-pass:}")
    private String dbPass;

    @Value("${backup.db-name:financedb}")
    private String dbName;

    @Value("${backup.dir:/tmp}")
    private String backupDir;

    @Value("${backup.encryption-pass:}")
    private String encryptionPass;

    private static final DateTimeFormatter FILE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm");
    private static final DateTimeFormatter DATE_FMT  = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * 1. pg_dump → gzip → openssl enc → .sql.gz.enc (local)
     * 2. Upload to R2 (if enabled)
     * 3. Cleanup local file
     */
    public String runBackup() throws IOException, InterruptedException {
        String timestamp = LocalDateTime.now().format(FILE_FMT);
        Path   sqlFile   = Path.of(backupDir, "db_backup_" + timestamp + ".sql");
        Path   encFile   = Path.of(backupDir, "db_backup_" + timestamp + ".sql.gz.enc");

        log.info("[Backup] Starting – timestamp={}", timestamp);

        runDockerPgDump(sqlFile);
        compressAndEncrypt(sqlFile, encFile);
        Files.deleteIfExists(sqlFile);

        if (r2.isEnabled()) {
            r2.upload(encFile, encFile.getFileName().toString());
            Files.deleteIfExists(encFile);   // remove local copy after upload
            log.info("[Backup] Uploaded to R2 and cleaned local copy");
        }

        log.info("[Backup] Done – file={}", encFile.getFileName());
        return encFile.getFileName().toString();
    }

    /**
     * List available backups.
     * - R2 enabled  → list from R2 bucket
     * - R2 disabled → list local .sql.gz.enc files
     */
    public List<R2StorageService.BackupEntry> listAvailableBackups() throws IOException {
        if (r2.isEnabled()) {
            return r2.listBackups();
        }
        // Local fallback
        try (var files = Files.list(Path.of(backupDir))) {
            return files
                    .filter(p -> p.getFileName().toString().endsWith(".sql.gz.enc"))
                    .sorted((a, b) -> b.getFileName().toString().compareTo(a.getFileName().toString()))
                    .map(p -> {
                        try {
                            return new R2StorageService.BackupEntry(
                                    p.getFileName().toString(),
                                    Files.getLastModifiedTime(p).toInstant(),
                                    Files.size(p));
                        } catch (IOException e) {
                            return new R2StorageService.BackupEntry(p.getFileName().toString(), null, 0L);
                        }
                    })
                    .toList();
        }
    }

    /**
     * Download (decrypt) the backup identified by the given R2 key / local filename.
     * If R2 is enabled, the .enc file is first fetched from R2 into a temp path.
     */
    public Resource downloadBackup(String key) throws IOException, InterruptedException {
        Path encFile;

        if (r2.isEnabled()) {
            // Fetch from R2 into a temp local file, decrypt, then remove temp
            encFile = Path.of(backupDir, "dl_tmp_" + key);
            r2.download(key, encFile);
        } else {
            // Local mode: file must already exist on disk
            encFile = resolveEncFile(key);
        }

        log.info("[Download] Decrypting {}", encFile.getFileName());
        byte[] sqlBytes = decryptAndDecompress(encFile);

        if (r2.isEnabled()) Files.deleteIfExists(encFile);

        String sqlName = key.replace(".sql.gz.enc", "").replace(".gz.enc", "") + ".sql";
        return new ByteArrayResource(sqlBytes) {
            @Override public String getFilename() { return sqlName; }
        };
    }

    /**
     * Restore the database from the backup identified by the given key.
     * Downloads from R2 if enabled, otherwise uses local file.
     */
    public void restoreBackup(String key) throws IOException, InterruptedException {
        Path encFile;
        boolean tempEnc;

        if (r2.isEnabled()) {
            encFile = Path.of(backupDir, "restore_enc_tmp_" + key);
            r2.download(key, encFile);
            tempEnc = true;
        } else {
            encFile = resolveEncFile(key);
            tempEnc = false;
        }

        Path sqlFile = Path.of(backupDir, "restore_sql_tmp_" + key.replace(".gz.enc", ""));

        log.info("[Restore] Decrypting {}", encFile.getFileName());
        byte[] sqlBytes = decryptAndDecompress(encFile);
        if (tempEnc) Files.deleteIfExists(encFile);

        Files.write(sqlFile, sqlBytes);

        log.info("[Restore] Importing into container={} db={}", containerName, dbName);
        runDockerPsqlRestore(sqlFile);
        Files.deleteIfExists(sqlFile);

        log.info("[Restore] Completed for key={}", key);
    }

    /**
     * Accept a raw uploaded file, save locally, then push to R2 if enabled.
     */
    public String uploadBackup(String originalFilename, byte[] data) throws IOException {
        String safeName = originalFilename.replaceAll("[^a-zA-Z0-9._\\-]", "_");
        Path target = Path.of(backupDir, safeName);
        Files.write(target, data);
        log.info("[Upload] Saved {} ({} bytes)", target.getFileName(), data.length);

        if (r2.isEnabled()) {
            r2.upload(target, safeName);
            Files.deleteIfExists(target);
            log.info("[Upload] Pushed to R2: {}", safeName);
        }
        return safeName;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /** Resolve the local enc file path for a given key (local-mode only) */
    private Path resolveEncFile(String key) throws FileNotFoundException {
        Path local = Path.of(backupDir, key);
        if (!Files.exists(local)) {
            throw new FileNotFoundException("Backup file not found locally: " + key);
        }
        return local;
    }

    /**
     * pg_dump directly via TCP (no docker exec required).
     * PGPASSWORD is passed via environment variable, stdout → sqlFile.
     * Stderr is captured separately so errors are visible in logs.
     */
    private void runDockerPgDump(Path sqlFile) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(
                "pg_dump",
                "-h", dbHost,
                "-p", dbPort,
                "-U", dbUser,
                "--clean", "--if-exists",
                dbName
        );
        pb.environment().put("PGPASSWORD", dbPass);
        pb.redirectOutput(sqlFile.toFile());   // stdout → sql file
        pb.redirectErrorStream(false);          // keep stderr separate

        Process p = pb.start();
        // Read stderr BEFORE waitFor to avoid blocking
        String stderr = new String(p.getErrorStream().readAllBytes());
        int code = p.waitFor();
        if (code != 0) {
            log.error("[pg_dump] failed (exit {}): {}", code, stderr);
            throw new IOException("pg_dump failed with exit code " + code + ": " + stderr);
        }
        if (!stderr.isBlank()) log.warn("[pg_dump] stderr: {}", stderr);
    }

    /** gzip -c file | openssl enc -aes-256-cbc */
    private void compressAndEncrypt(Path sqlFile, Path encFile) throws IOException, InterruptedException {
        ProcessBuilder gzipPb = new ProcessBuilder("gzip", "-c", sqlFile.toAbsolutePath().toString());
        ProcessBuilder sslPb  = new ProcessBuilder(
                "openssl", "enc", "-aes-256-cbc", "-salt", "-pbkdf2",
                "-pass", "pass:" + encryptionPass,
                "-out", encFile.toAbsolutePath().toString()
        );

        Process gzip = gzipPb.start();
        Process ssl  = sslPb.start();

        try (InputStream gzipOut = gzip.getInputStream();
             OutputStream sslIn  = ssl.getOutputStream()) {
            gzipOut.transferTo(sslIn);
        }

        int gzipExit = gzip.waitFor();
        int sslExit  = ssl.waitFor();
        if (gzipExit != 0) throw new IOException("gzip exited with code " + gzipExit);
        if (sslExit  != 0) throw new IOException("openssl enc exited with code " + sslExit);
    }

    /** openssl dec | gzip -d → raw bytes */
    private byte[] decryptAndDecompress(Path encFile) throws IOException, InterruptedException {
        ProcessBuilder sslPb  = new ProcessBuilder(
                "openssl", "enc", "-d", "-aes-256-cbc", "-pbkdf2",
                "-pass", "pass:" + encryptionPass,
                "-in", encFile.toAbsolutePath().toString()
        );
        ProcessBuilder gzipPb = new ProcessBuilder("gzip", "-d");

        Process ssl  = sslPb.start();
        Process gzip = gzipPb.start();

        try (InputStream sslOut  = ssl.getInputStream();
             OutputStream gzipIn = gzip.getOutputStream()) {
            sslOut.transferTo(gzipIn);
        }

        byte[] result = gzip.getInputStream().readAllBytes();
        int sslExit  = ssl.waitFor();
        int gzipExit = gzip.waitFor();
        if (sslExit  != 0) throw new IOException("openssl dec exited with code " + sslExit);
        if (gzipExit != 0) throw new IOException("gzip -d exited with code " + gzipExit);
        return result;
    }

    /**
     * psql restore directly via TCP (no docker exec required).
     * stdin ← sqlFile, stderr captured for logging.
     */
    private void runDockerPsqlRestore(Path sqlFile) throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(
                "psql",
                "-h", dbHost,
                "-p", dbPort,
                "-U", dbUser,
                "-d", dbName,
                "--quiet"
        );
        pb.environment().put("PGPASSWORD", dbPass);
        pb.redirectInput(sqlFile.toFile());
        pb.redirectErrorStream(false);

        Process p = pb.start();
        String stderr = new String(p.getErrorStream().readAllBytes());
        int code = p.waitFor();
        if (code != 0) {
            log.error("[psql restore] failed (exit {}): {}", code, stderr);
            throw new IOException("psql restore failed with exit code " + code + ": " + stderr);
        }
        if (!stderr.isBlank()) log.warn("[psql restore] stderr: {}", stderr);
    }

    private void runProcess(ProcessBuilder pb, String label) throws IOException, InterruptedException {
        pb.redirectErrorStream(true);
        Process p = pb.start();
        String output = new String(p.getInputStream().readAllBytes());
        int code = p.waitFor();
        if (code != 0) {
            log.error("[{}] failed (exit {}): {}", label, code, output);
            throw new IOException(label + " failed with exit code " + code + ": " + output);
        }
    }
}
