# MFA (TOTP + Email code) — Implementation Plan / TODO

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.
> Spec: `docs/superpowers/specs/2026-07-10-mfa-design.md` (read it first — it holds the
> confirmed requirements and all semantics referenced below).
> Branch: `feat/mfa`, cut from **`main`** (house rule: one branch per task, never commit
> to `release/*`/`main`; the user merges manually).

**Goal:** Opt-in two-factor authentication: TOTP (authenticator app) and email one-time
codes, with 10 one-time recovery codes, a two-step login flow, settings UI to
enroll/disable, and an admin MFA reset. Passkeys are Phase 2 (their card stays
"Coming soon").

**Architecture:** Password-correct logins for MFA users return a 5-min `mfa_pending`
JWT instead of tokens; `POST /api/auth/mfa/verify` exchanges pending-token + code for
the real access token + refresh cookie. TOTP secrets are AES-256-GCM encrypted at rest
(`MFA_ENCRYPTION_KEY` env var); email/recovery codes are SHA-256-hashed (same scheme as
PATs / email-change OTPs). State lives in 3 new columns on `User` plus
`mfa_recovery_codes`, `mfa_totp_enrollments`, `mfa_challenges` tables. All MFA logic in
one `MfaService`; endpoints under `/api/auth/mfa/*`.

**Tech Stack:** Spring Boot 3.5 / Java 21 / JPA / jjwt 0.11.5 / new dep
`dev.samstevens.totp:totp:1.7.1` (TOTP + QR data-URI, zero frontend deps); React 19 +
TS + Tailwind 4; Vitest + Testing Library; existing `components/ui/` primitives.

## Global Constraints (apply to every task)

- **English only** — code, comments, UI copy.
- **All endpoints under `/api/...`**.
- Backend gates: `./gradlew test` green, **add tests for your change**, then
  `./gradlew spotlessApply` and keep `./gradlew check` (Spotless + **≥90% line
  coverage**) passing. New entity PKs are **UUIDv7** (`@UuidGenerator(algorithm =
  UuidV7Generator.class)`). Schema evolves via `ddl-auto=update` — **no migration files**.
- Frontend gates (run from `frontend/`, same order as CI): `npm run lint` → `npm test`
  → `npm run build`. Tests live under `src/__tests__/` mirroring the source tree. No
  path aliases — relative imports only.
- **UI:** read `frontend/style.md` before any UI task. Reuse `components/ui/`
  primitives (`Button`, `Input`, `Badge`, `Card`, `WizardShell`/`Wizard`,
  `modals/common/ModalDialog`, `modals/common/ConfirmModal`) — never hand-rolled
  `<button>`/`<input>`. Theme-aware `app-*` tokens; auth screens are always dark; no
  colored glow/halos.
- Do **not** kill the running Vite dev server between turns.
- Codes/secrets are **never logged** and never stored in plaintext (TOTP secret:
  encrypted; email/recovery codes: SHA-256 hex via the same scheme as
  `UserService.sha256Hex`).
- Commit at the end of every task (`feat(mfa): ...` style).

---

## Phase A — Backend foundation

### Task 1: TOTP dependency, `MFA_ENCRYPTION_KEY` property, `MfaCryptoService`

**Files:**
- Modify: `backend/build.gradle` (dependencies block)
- Modify: `backend/src/main/resources/application.properties`
- Modify: `backend/src/test/resources/application-test.properties`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/security/MfaCryptoService.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/security/MfaCryptoServiceTest.java`

**Interfaces (Produces):**
- `MfaCryptoService.encrypt(String plaintext) : String` — base64(12-byte IV ‖ AES-256-GCM ciphertext).
- `MfaCryptoService.decrypt(String encoded) : String` — inverse; throws `IllegalStateException` on tampered/garbage input.
- Property `application.security.mfa.encryption-key` (base64, exactly 32 bytes; startup fails otherwise).

- [ ] **Step 1: Add the dependency and properties**

In `backend/build.gradle`, after the JWT block:

```gradle
    // TOTP (RFC 6238) — secret generation, otpauth:// URI, QR data-URI, code verification
    implementation 'dev.samstevens.totp:totp:1.7.1'
```

In `backend/src/main/resources/application.properties`, after the JWT lines (line ~26):

```properties
application.security.mfa.encryption-key=${MFA_ENCRYPTION_KEY}
```

In `backend/src/test/resources/application-test.properties`, after the JWT mock values:

```properties
# MFA (mock 32-byte key, base64)
application.security.mfa.encryption-key=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
```

- [ ] **Step 2: Write the failing test**

```java
package dev.busato.FinanceWebApp.backend.security;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Base64;
import org.junit.jupiter.api.Test;

class MfaCryptoServiceTest {

  private static final String TEST_KEY =
      Base64.getEncoder().encodeToString(new byte[32]); // 32 zero bytes

  private final MfaCryptoService service = new MfaCryptoService(TEST_KEY);

  @Test
  void encryptDecryptRoundTrip() {
    String secret = "JBSWY3DPEHPK3PXP";
    String encrypted = service.encrypt(secret);
    assertNotEquals(secret, encrypted);
    assertEquals(secret, service.decrypt(encrypted));
  }

  @Test
  void encryptIsNonDeterministic() {
    // Random IV per call — two encryptions of the same plaintext must differ.
    assertNotEquals(service.encrypt("JBSWY3DPEHPK3PXP"), service.encrypt("JBSWY3DPEHPK3PXP"));
  }

  @Test
  void decryptRejectsTamperedPayload() {
    String encrypted = service.encrypt("JBSWY3DPEHPK3PXP");
    byte[] raw = Base64.getDecoder().decode(encrypted);
    raw[raw.length - 1] ^= 0x01; // flip a ciphertext bit
    String tampered = Base64.getEncoder().encodeToString(raw);
    assertThrows(IllegalStateException.class, () -> service.decrypt(tampered));
  }

  @Test
  void rejectsWrongKeyLength() {
    String shortKey = Base64.getEncoder().encodeToString(new byte[16]);
    assertThrows(IllegalStateException.class, () -> new MfaCryptoService(shortKey));
  }
}
```

- [ ] **Step 3: Run it to make sure it fails**

Run (from `backend/`): `./gradlew test --tests "*.MfaCryptoServiceTest"`
Expected: compilation FAILURE — `MfaCryptoService` does not exist.

- [ ] **Step 4: Implement `MfaCryptoService`**

```java
package dev.busato.FinanceWebApp.backend.security;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Encrypts/decrypts MFA TOTP secrets at rest with AES-256-GCM. Unlike passwords (hashed) the TOTP
 * secret must stay readable to verify codes, so a DB dump alone must not expose it — the key lives
 * only in the MFA_ENCRYPTION_KEY env var. Payload layout: base64(12-byte IV || ciphertext+tag).
 */
@Service
public class MfaCryptoService {

  private static final int GCM_IV_BYTES = 12;
  private static final int GCM_TAG_BITS = 128;
  private static final SecureRandom SECURE_RANDOM = new SecureRandom();

  private final SecretKeySpec key;

  public MfaCryptoService(
      @Value("${application.security.mfa.encryption-key}") String base64Key) {
    byte[] keyBytes;
    try {
      keyBytes = Base64.getDecoder().decode(base64Key);
    } catch (IllegalArgumentException e) {
      throw new IllegalStateException("MFA_ENCRYPTION_KEY is not valid base64", e);
    }
    if (keyBytes.length != 32) {
      throw new IllegalStateException(
          "MFA_ENCRYPTION_KEY must decode to exactly 32 bytes (use: openssl rand -base64 32)");
    }
    this.key = new SecretKeySpec(keyBytes, "AES");
  }

  public String encrypt(String plaintext) {
    try {
      byte[] iv = new byte[GCM_IV_BYTES];
      SECURE_RANDOM.nextBytes(iv);
      Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
      cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));
      byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
      return Base64.getEncoder()
          .encodeToString(
              ByteBuffer.allocate(iv.length + ciphertext.length).put(iv).put(ciphertext).array());
    } catch (Exception e) {
      throw new IllegalStateException("MFA secret encryption failed", e);
    }
  }

  public String decrypt(String encoded) {
    try {
      byte[] all = Base64.getDecoder().decode(encoded);
      Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
      cipher.init(
          Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, all, 0, GCM_IV_BYTES));
      byte[] plaintext = cipher.doFinal(all, GCM_IV_BYTES, all.length - GCM_IV_BYTES);
      return new String(plaintext, StandardCharsets.UTF_8);
    } catch (Exception e) {
      throw new IllegalStateException("MFA secret decryption failed", e);
    }
  }
}
```

- [ ] **Step 5: Run the tests and make sure they pass**

Run: `./gradlew test --tests "*.MfaCryptoServiceTest"`
Expected: 4 tests PASS. Also run the full `./gradlew test` — the new property must not
break context loading anywhere (the test properties file already provides it).

- [ ] **Step 6: Commit**

```bash
git add backend/build.gradle backend/src/main/resources/application.properties \
  backend/src/test/resources/application-test.properties \
  backend/src/main/java/dev/busato/FinanceWebApp/backend/security/MfaCryptoService.java \
  backend/src/test/java/dev/busato/FinanceWebApp/backend/security/MfaCryptoServiceTest.java
git commit -m "feat(mfa): AES-GCM crypto service for TOTP secrets + totp dependency"
```

---

### Task 2: MFA pending token in `JwtService` + `JwtAuthenticationFilter` hardening

**Files:**
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/security/JwtService.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/security/JwtAuthenticationFilter.java:63-67`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/security/JwtServiceMfaTest.java`

**Interfaces (Produces):**
- `JwtService.generateMfaPendingToken(User) : String` — claims `type="mfa_pending"`, `ver`; 5-min TTL.
- `JwtService.isMfaPendingToken(String) : boolean`.
- `JwtService.isSpecialPurposeToken(String) : boolean` — true when the token carries ANY
  `type` claim (refresh, mfa_pending) or is unparseable; such tokens must never
  authenticate API requests.

**Security rationale (do not skip):** the pending token is returned to client JS. The
filter currently rejects only `type=refresh`; without this hardening a pending token in
the `Authorization` header would authenticate as a full session, silently bypassing MFA.

- [ ] **Step 1: Write the failing test**

```java
package dev.busato.FinanceWebApp.backend.security;

import static org.junit.jupiter.api.Assertions.*;

import dev.busato.FinanceWebApp.backend.model.User;
import java.util.HashMap;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class JwtServiceMfaTest {

  @Autowired private JwtService jwtService;

  private User user;

  @BeforeEach
  void setUp() {
    user = new User();
    user.setId(UUID.randomUUID());
    user.setUsername("mfa-user");
    user.setTokenVersion(3);
  }

  @Test
  void pendingTokenIsRecognizedAndCarriesVersion() {
    String token = jwtService.generateMfaPendingToken(user);
    assertTrue(jwtService.isMfaPendingToken(token));
    assertEquals("mfa-user", jwtService.extractUsername(token));
    assertEquals(3, jwtService.extractTokenVersion(token));
  }

  @Test
  void pendingAndRefreshTokensAreSpecialPurpose() {
    assertTrue(jwtService.isSpecialPurposeToken(jwtService.generateMfaPendingToken(user)));
    assertTrue(jwtService.isSpecialPurposeToken(jwtService.generateRefreshToken(user)));
    assertTrue(jwtService.isSpecialPurposeToken("garbage.token.value"));
  }

  @Test
  void accessTokenIsNotSpecialPurpose() {
    String access = jwtService.generateToken(new HashMap<>(), user);
    assertFalse(jwtService.isSpecialPurposeToken(access));
    assertFalse(jwtService.isMfaPendingToken(access));
  }

  @Test
  void refreshTokenIsNotAPendingToken() {
    assertFalse(jwtService.isMfaPendingToken(jwtService.generateRefreshToken(user)));
  }
}
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `./gradlew test --tests "*.JwtServiceMfaTest"`
Expected: compilation FAILURE — `generateMfaPendingToken` not defined.

- [ ] **Step 3: Implement the `JwtService` additions**

Add to `JwtService` (after `generateRefreshToken`):

```java
  /** Lifetime of the MFA pending token: enough to type a code, short enough to limit abuse. */
  private static final long MFA_PENDING_EXPIRATION_MS = 5L * 60 * 1000; // 5 minutes

  /**
   * Short-lived token proving only that the password step succeeded. It is NOT an access token:
   * the auth filter rejects every token carrying a "type" claim (see isSpecialPurposeToken), so
   * this token is only accepted by the /api/auth/mfa/verify and /send-email-code endpoints.
   */
  public String generateMfaPendingToken(User user) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("type", "mfa_pending");
    claims.put("ver", user.getTokenVersion());
    return buildToken(claims, user, MFA_PENDING_EXPIRATION_MS);
  }

  /** Controlla se il token è un MFA pending token. */
  public boolean isMfaPendingToken(String token) {
    try {
      return "mfa_pending".equals(extractAllClaims(token).get("type", String.class));
    } catch (Exception e) {
      return false;
    }
  }

  /**
   * True for any special-purpose token (refresh, mfa_pending — anything with a "type" claim) or
   * unparseable token. These must never authenticate regular API requests.
   */
  public boolean isSpecialPurposeToken(String token) {
    try {
      return extractAllClaims(token).get("type", String.class) != null;
    } catch (Exception e) {
      return true;
    }
  }
```

- [ ] **Step 4: Harden the filter**

In `JwtAuthenticationFilter.doFilterInternal`, replace the refresh-only check
(lines 63-67):

```java
      // Blocca i refresh token usati come Bearer token per API normali
      if (jwtService.isRefreshToken(jwt)) {
```

with:

```java
      // Blocca refresh e mfa_pending token usati come Bearer token per API normali
      if (jwtService.isSpecialPurposeToken(jwt)) {
```

- [ ] **Step 5: Run the tests and make sure they pass**

Run: `./gradlew test --tests "*.JwtServiceMfaTest"` then the full `./gradlew test`
(existing auth/integration tests must stay green — access tokens have no `type` claim,
so nothing else changes behavior).
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/dev/busato/FinanceWebApp/backend/security/JwtService.java \
  backend/src/main/java/dev/busato/FinanceWebApp/backend/security/JwtAuthenticationFilter.java \
  backend/src/test/java/dev/busato/FinanceWebApp/backend/security/JwtServiceMfaTest.java
git commit -m "feat(mfa): mfa_pending JWT + reject special-purpose tokens in auth filter"
```

---

### Task 3: MFA entities, repositories, `UserService.invalidateSessions`

**Files:**
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/User.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/MfaRecoveryCode.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/MfaTotpEnrollment.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/model/MfaChallenge.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/repository/MfaRecoveryCodeRepository.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/repository/MfaTotpEnrollmentRepository.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/repository/MfaChallengeRepository.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/UserService.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/repository/MfaRepositoriesTest.java`

**Interfaces (Produces):**
- `User`: `getTotpSecret()/setTotpSecret(String)` (encrypted, non-null ⇔ TOTP enabled),
  `isEmailMfaEnabled()/setEmailMfaEnabled(boolean)`,
  `getLastTotpTimestep()/setLastTotpTimestep(Long)`, helper `isMfaEnabled()`.
- `MfaChallenge.Purpose { LOGIN, EMAIL_ENROLLMENT, SETTINGS }`.
- Repositories:
  `MfaRecoveryCodeRepository.findAllByUserId(UUID)`, `.deleteAllByUserId(UUID)`, `.countByUserId(UUID)`;
  `MfaTotpEnrollmentRepository.findByUserId(UUID)`, `.deleteByUserId(UUID)`;
  `MfaChallengeRepository.findByUserIdAndPurpose(UUID, MfaChallenge.Purpose)`,
  `.deleteByUserIdAndPurpose(UUID, MfaChallenge.Purpose)`, `.deleteAllByUserId(UUID)`.
- `UserService.invalidateSessions(User)` — bumps `tokenVersion` + evicts the Caffeine
  cache but (unlike `incrementTokenVersion`) does **not** delete PATs.

- [ ] **Step 1: Write the failing repository test**

```java
package dev.busato.FinanceWebApp.backend.repository;

import static org.junit.jupiter.api.Assertions.*;

import dev.busato.FinanceWebApp.backend.model.MfaChallenge;
import dev.busato.FinanceWebApp.backend.model.MfaRecoveryCode;
import dev.busato.FinanceWebApp.backend.model.MfaTotpEnrollment;
import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class MfaRepositoriesTest {

  @Autowired private MfaRecoveryCodeRepository recoveryCodes;
  @Autowired private MfaTotpEnrollmentRepository enrollments;
  @Autowired private MfaChallengeRepository challenges;

  private final UUID userId = UUID.randomUUID();

  @Test
  void recoveryCodesCrud() {
    recoveryCodes.save(MfaRecoveryCode.builder().userId(userId).codeHash("h1").build());
    recoveryCodes.save(MfaRecoveryCode.builder().userId(userId).codeHash("h2").build());
    assertEquals(2, recoveryCodes.countByUserId(userId));
    assertEquals(2, recoveryCodes.findAllByUserId(userId).size());
    recoveryCodes.deleteAllByUserId(userId);
    assertEquals(0, recoveryCodes.countByUserId(userId));
  }

  @Test
  void enrollmentIsUniquePerUser() {
    enrollments.save(
        MfaTotpEnrollment.builder()
            .userId(userId)
            .encryptedSecret("enc")
            .expiresAt(LocalDateTime.now().plusMinutes(10))
            .build());
    assertTrue(enrollments.findByUserId(userId).isPresent());
    enrollments.deleteByUserId(userId);
    assertTrue(enrollments.findByUserId(userId).isEmpty());
  }

  @Test
  void challengesAreKeyedByUserAndPurpose() {
    challenges.save(
        MfaChallenge.builder()
            .userId(userId)
            .purpose(MfaChallenge.Purpose.LOGIN)
            .expiresAt(LocalDateTime.now().plusMinutes(5))
            .build());
    challenges.save(
        MfaChallenge.builder()
            .userId(userId)
            .purpose(MfaChallenge.Purpose.EMAIL_ENROLLMENT)
            .expiresAt(LocalDateTime.now().plusMinutes(10))
            .build());

    assertTrue(
        challenges.findByUserIdAndPurpose(userId, MfaChallenge.Purpose.LOGIN).isPresent());
    challenges.deleteByUserIdAndPurpose(userId, MfaChallenge.Purpose.LOGIN);
    assertTrue(challenges.findByUserIdAndPurpose(userId, MfaChallenge.Purpose.LOGIN).isEmpty());
    assertTrue(
        challenges
            .findByUserIdAndPurpose(userId, MfaChallenge.Purpose.EMAIL_ENROLLMENT)
            .isPresent());

    challenges.deleteAllByUserId(userId);
    assertTrue(
        challenges
            .findByUserIdAndPurpose(userId, MfaChallenge.Purpose.EMAIL_ENROLLMENT)
            .isEmpty());
  }
}
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `./gradlew test --tests "*.MfaRepositoriesTest"`
Expected: compilation FAILURE — entities do not exist.

- [ ] **Step 3: Add the `User` columns + helper**

In `User.java`, after the `tokenVersion` field:

```java
  /**
   * AES-GCM-encrypted TOTP secret (see MfaCryptoService). Non-null ⇔ authenticator-app MFA is
   * enabled — pending (unconfirmed) setups live in mfa_totp_enrollments, never here.
   */
  @Column(name = "totp_secret")
  private String totpSecret;

  /** Email one-time-code MFA toggle. */
  @Column(nullable = false, columnDefinition = "boolean default false")
  @Builder.Default
  private boolean emailMfaEnabled = false;

  /** Last accepted TOTP timestep — codes at or before it are rejected (replay guard). */
  private Long lastTotpTimestep;
```

And after `onCreate()`:

```java
  /** True when at least one second factor is active for this account. */
  public boolean isMfaEnabled() {
    return totpSecret != null || emailMfaEnabled;
  }
```

- [ ] **Step 4: Create the three entities**

`MfaRecoveryCode.java`:

```java
package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.persistence.UuidV7Generator;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

/**
 * One unused MFA recovery code. Codes are stored SHA-256-hashed (same scheme as PATs) and are
 * DELETED on use — the remaining count is simply the number of rows for the user.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
    name = "mfa_recovery_codes",
    indexes = @Index(name = "idx_mfa_recovery_user", columnList = "userId"))
public class MfaRecoveryCode {

  @Id
  @UuidGenerator(algorithm = UuidV7Generator.class) // Time-ordered UUID v7 (RFC 9562)
  private UUID id;

  @Column(nullable = false)
  private UUID userId;

  /** SHA-256 hex of the code (never stored in plaintext). */
  @Column(nullable = false)
  private String codeHash;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;
}
```

`MfaTotpEnrollment.java`:

```java
package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.persistence.UuidV7Generator;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

/**
 * A pending (not yet confirmed) TOTP setup. The secret only moves onto the User once the user
 * proves their authenticator produces valid codes. At most one per user; restarting the setup
 * replaces the previous row.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "mfa_totp_enrollments")
public class MfaTotpEnrollment {

  @Id
  @UuidGenerator(algorithm = UuidV7Generator.class) // Time-ordered UUID v7 (RFC 9562)
  private UUID id;

  @Column(nullable = false, unique = true)
  private UUID userId;

  /** AES-GCM-encrypted candidate secret (same encryption as User.totpSecret). */
  @Column(nullable = false)
  private String encryptedSecret;

  @Column(nullable = false)
  private LocalDateTime expiresAt;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;
}
```

`MfaChallenge.java`:

```java
package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.persistence.UuidV7Generator;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

/**
 * Server-side state for a code-verification flow. LOGIN rows are created when a correct password
 * hits an MFA-enabled account (5-min TTL, aligned with the mfa_pending JWT); EMAIL_ENROLLMENT and
 * SETTINGS rows back the settings flows (10-min TTL). emailCodeHash stays null until an email code
 * is actually requested; attempts above the limit drop the row.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
    name = "mfa_challenges",
    uniqueConstraints =
        @UniqueConstraint(
            name = "uq_mfa_challenge_user_purpose",
            columnNames = {"userId", "purpose"}))
public class MfaChallenge {

  public enum Purpose {
    LOGIN,
    EMAIL_ENROLLMENT,
    SETTINGS
  }

  @Id
  @UuidGenerator(algorithm = UuidV7Generator.class) // Time-ordered UUID v7 (RFC 9562)
  private UUID id;

  @Column(nullable = false)
  private UUID userId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Purpose purpose;

  /** SHA-256 hex of the emailed code; null until a code is sent for this challenge. */
  private String emailCodeHash;

  /** When the last email code was sent — drives the 60 s resend cooldown. */
  private LocalDateTime emailCodeSentAt;

  @Column(nullable = false)
  private LocalDateTime expiresAt;

  /** Verify attempts so far; the challenge is dropped once it exceeds the limit. */
  @Column(nullable = false)
  @Builder.Default
  private int attempts = 0;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;
}
```

- [ ] **Step 5: Create the repositories**

`MfaRecoveryCodeRepository.java`:

```java
package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.MfaRecoveryCode;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

public interface MfaRecoveryCodeRepository extends JpaRepository<MfaRecoveryCode, UUID> {
  List<MfaRecoveryCode> findAllByUserId(UUID userId);

  long countByUserId(UUID userId);

  @Modifying
  @Transactional
  void deleteAllByUserId(UUID userId);
}
```

`MfaTotpEnrollmentRepository.java`:

```java
package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.MfaTotpEnrollment;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

public interface MfaTotpEnrollmentRepository extends JpaRepository<MfaTotpEnrollment, UUID> {
  Optional<MfaTotpEnrollment> findByUserId(UUID userId);

  @Modifying
  @Transactional
  void deleteByUserId(UUID userId);
}
```

`MfaChallengeRepository.java`:

```java
package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.MfaChallenge;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

public interface MfaChallengeRepository extends JpaRepository<MfaChallenge, UUID> {
  Optional<MfaChallenge> findByUserIdAndPurpose(UUID userId, MfaChallenge.Purpose purpose);

  @Modifying
  @Transactional
  void deleteByUserIdAndPurpose(UUID userId, MfaChallenge.Purpose purpose);

  @Modifying
  @Transactional
  void deleteAllByUserId(UUID userId);
}
```

- [ ] **Step 6: Add `UserService.invalidateSessions`**

In `UserService.java`, after `incrementTokenVersion` (note the deliberate difference —
no PAT deletion; PATs are wallet-scoped API keys, orthogonal to interactive MFA):

```java
  /**
   * Bumps tokenVersion to sign out every OTHER session (the caller re-issues tokens for the
   * current one). Unlike incrementTokenVersion this does NOT revoke PATs: enabling/disabling MFA
   * changes interactive-login requirements only — API keys are unaffected.
   */
  @CacheEvict(value = "tokenVersions", key = "#user.id")
  @Transactional
  public void invalidateSessions(User user) {
    user.setTokenVersion(user.getTokenVersion() + 1);
    userRepository.save(user);
  }
```

- [ ] **Step 7: Run the tests and make sure they pass**

Run: `./gradlew test --tests "*.MfaRepositoriesTest"` then full `./gradlew test`.
Expected: PASS (H2 recreates the schema; `ddl-auto` handles the new columns in dev).

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/java/dev/busato/FinanceWebApp/backend/model/ \
  backend/src/main/java/dev/busato/FinanceWebApp/backend/repository/ \
  backend/src/main/java/dev/busato/FinanceWebApp/backend/service/UserService.java \
  backend/src/test/java/dev/busato/FinanceWebApp/backend/repository/MfaRepositoriesTest.java
git commit -m "feat(mfa): MFA entities, repositories and PAT-preserving session invalidation"
```

## Phase B — Backend settings flows (enroll / disable / recovery codes)

### Task 4: `TotpConfig` beans + `MfaService` TOTP enrollment + recovery-code generation

**Files:**
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/config/TotpConfig.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/TotpSetupResponse.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/MfaService.java`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/service/MfaServiceTest.java`

**Interfaces (Produces):**
- Beans: `SecretGenerator totpSecretGenerator`, `CodeVerifier totpCodeVerifier`
  (30 s period, ±1 discrepancy), `QrGenerator totpQrGenerator`,
  `CodeGenerator totpCodeGenerator`, `TimeProvider totpTimeProvider`.
- `TotpSetupResponse { String secret; String otpauthUri; String qrDataUri; }`.
- `MfaService.startTotpEnrollment(User) : TotpSetupResponse` — replaces any pending setup.
- `MfaService.confirmTotpEnrollment(User, String code) : List<String>` — returns the 10
  fresh recovery codes when this is the FIRST enabled method, else an empty list;
  bumps `tokenVersion` via `UserService.invalidateSessions`.
- Recovery codes: format `XXXX-XXXX`, alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`,
  stored SHA-256-hashed, deleted on use.

- [ ] **Step 1: Write the failing test**

`MfaServiceTest` uses the full Spring context (H2 + real crypto/TOTP beans) with only
the mail sender mocked, so later tasks extend it without rewiring:

```java
package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.*;

import dev.busato.FinanceWebApp.backend.dto.TotpSetupResponse;
import dev.busato.FinanceWebApp.backend.exceptions.UnauthorizedAccessException;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.repository.MfaRecoveryCodeRepository;
import dev.busato.FinanceWebApp.backend.repository.MfaTotpEnrollmentRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.time.TimeProvider;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class MfaServiceTest {

  @Autowired private MfaService mfaService;
  @Autowired private UserRepository userRepository;
  @Autowired private MfaRecoveryCodeRepository recoveryCodeRepository;
  @Autowired private MfaTotpEnrollmentRepository enrollmentRepository;
  @Autowired private CodeGenerator totpCodeGenerator;
  @Autowired private TimeProvider totpTimeProvider;
  @MockitoBean private SendEmailService sendEmailService;

  private User user;

  @BeforeEach
  void setUp() {
    user =
        userRepository.save(
            User.builder()
                .username("mfa-user")
                .email("mfa@example.com")
                .password("$2a$10$hashhashhashhashhashha") // bcrypt-shaped, unused here
                .passwordMustChange(false)
                .build());
  }

  /** Generates the code a real authenticator app would show right now. */
  private String validCode(String secret) throws Exception {
    return totpCodeGenerator.generate(secret, Math.floorDiv(totpTimeProvider.getTime(), 30));
  }

  @Test
  void startTotpEnrollmentStoresPendingSecretAndReturnsQr() {
    TotpSetupResponse setup = mfaService.startTotpEnrollment(user);
    assertNotNull(setup.getSecret());
    assertTrue(setup.getOtpauthUri().startsWith("otpauth://totp/"));
    assertTrue(setup.getQrDataUri().startsWith("data:image/png;base64,"));
    assertTrue(enrollmentRepository.findByUserId(user.getId()).isPresent());
    assertNull(user.getTotpSecret()); // not enabled until confirmed
  }

  @Test
  void confirmTotpEnablesAndGeneratesRecoveryCodesOnFirstMethod() throws Exception {
    TotpSetupResponse setup = mfaService.startTotpEnrollment(user);
    List<String> codes = mfaService.confirmTotpEnrollment(user, validCode(setup.getSecret()));

    assertEquals(10, codes.size());
    assertTrue(codes.stream().allMatch(c -> c.matches("[A-Z2-9]{4}-[A-Z2-9]{4}")));
    assertEquals(10, recoveryCodeRepository.countByUserId(user.getId()));
    assertNotNull(user.getTotpSecret());
    assertNotEquals(setup.getSecret(), user.getTotpSecret()); // stored encrypted
    assertTrue(enrollmentRepository.findByUserId(user.getId()).isEmpty());
    assertEquals(1, user.getTokenVersion()); // other sessions invalidated
  }

  @Test
  void confirmTotpRejectsWrongCode() {
    mfaService.startTotpEnrollment(user);
    assertThrows(
        BadCredentialsException.class, () -> mfaService.confirmTotpEnrollment(user, "000000"));
    assertNull(user.getTotpSecret());
  }

  @Test
  void confirmWithoutPendingSetupFails() {
    assertThrows(
        IllegalArgumentException.class, () -> mfaService.confirmTotpEnrollment(user, "123456"));
  }

  @Test
  void startTotpTwiceReplacesThePendingSecret() {
    String first = mfaService.startTotpEnrollment(user).getSecret();
    String second = mfaService.startTotpEnrollment(user).getSecret();
    assertNotEquals(first, second);
  }

  @Test
  void demoUsersCannotEnroll() {
    user.setDemo(true);
    assertThrows(UnauthorizedAccessException.class, () -> mfaService.startTotpEnrollment(user));
  }

  @Test
  void alreadyEnabledTotpCannotStartAgain() throws Exception {
    TotpSetupResponse setup = mfaService.startTotpEnrollment(user);
    mfaService.confirmTotpEnrollment(user, validCode(setup.getSecret()));
    assertThrows(IllegalArgumentException.class, () -> mfaService.startTotpEnrollment(user));
  }
}
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `./gradlew test --tests "*.MfaServiceTest"`
Expected: compilation FAILURE — `MfaService`, `TotpSetupResponse`, TOTP beans missing.

- [ ] **Step 3: Create `TotpConfig`**

```java
package dev.busato.FinanceWebApp.backend.config;

import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** java-totp plumbing. SHA1/6-digit/30s is what Google Authenticator & co. expect. */
@Configuration
public class TotpConfig {

  @Bean
  public SecretGenerator totpSecretGenerator() {
    return new DefaultSecretGenerator();
  }

  @Bean
  public TimeProvider totpTimeProvider() {
    return new SystemTimeProvider();
  }

  @Bean
  public CodeGenerator totpCodeGenerator() {
    return new DefaultCodeGenerator(HashingAlgorithm.SHA1, 6);
  }

  @Bean
  public CodeVerifier totpCodeVerifier(CodeGenerator codeGenerator, TimeProvider timeProvider) {
    DefaultCodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
    verifier.setTimePeriod(30);
    verifier.setAllowedTimePeriodDiscrepancy(1); // tolerate ±30 s of clock drift
    return verifier;
  }

  @Bean
  public QrGenerator totpQrGenerator() {
    return new ZxingPngQrGenerator();
  }
}
```

- [ ] **Step 4: Create `TotpSetupResponse`**

```java
package dev.busato.FinanceWebApp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TotpSetupResponse {
  /** Base32 secret for manual entry (shown next to the QR). */
  private String secret;

  /** otpauth:// URI encoded in the QR. */
  private String otpauthUri;

  /** PNG data URI — the frontend renders it directly in an <img>. */
  private String qrDataUri;
}
```

- [ ] **Step 5: Create `MfaService` (first slice)**

```java
package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.TotpSetupResponse;
import dev.busato.FinanceWebApp.backend.exceptions.UnauthorizedAccessException;
import dev.busato.FinanceWebApp.backend.model.MfaRecoveryCode;
import dev.busato.FinanceWebApp.backend.model.MfaTotpEnrollment;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.repository.MfaChallengeRepository;
import dev.busato.FinanceWebApp.backend.repository.MfaRecoveryCodeRepository;
import dev.busato.FinanceWebApp.backend.repository.MfaTotpEnrollmentRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.security.MfaCryptoService;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.util.Utils;
import jakarta.transaction.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

/**
 * All MFA logic: TOTP/email enrollment, disable flows, recovery codes, and (later tasks) the
 * two-step login challenge. Codes are never stored in plaintext; the TOTP secret is stored
 * AES-GCM-encrypted (MfaCryptoService).
 */
@Service
@RequiredArgsConstructor
public class MfaService {

  private static final int MAX_ATTEMPTS = 5;
  private static final int LOGIN_CHALLENGE_MINUTES = 5; // aligned with the mfa_pending JWT TTL
  private static final int ENROLLMENT_MINUTES = 10;
  private static final int EMAIL_RESEND_COOLDOWN_SECONDS = 60;
  private static final int RECOVERY_CODE_COUNT = 10;
  /** No 0/O/1/I — recovery codes are meant to be typed back from paper. */
  private static final String RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  private static final int OTP_LENGTH = 6;
  private static final String TOTP_ISSUER = "Finance";
  private static final int TOTP_PERIOD_SECONDS = 30;
  private static final SecureRandom SECURE_RANDOM = new SecureRandom();

  private final UserRepository userRepository;
  private final MfaRecoveryCodeRepository recoveryCodeRepository;
  private final MfaTotpEnrollmentRepository enrollmentRepository;
  private final MfaChallengeRepository challengeRepository;
  private final MfaCryptoService cryptoService;
  private final UserService userService;
  private final SecretGenerator totpSecretGenerator;
  private final CodeVerifier totpCodeVerifier;
  private final QrGenerator totpQrGenerator;

  // ==================== TOTP ENROLLMENT ====================

  @Transactional
  public TotpSetupResponse startTotpEnrollment(User user) {
    requireNotDemo(user);
    if (user.getTotpSecret() != null)
      throw new IllegalArgumentException("Authenticator app is already enabled");

    enrollmentRepository.deleteByUserId(user.getId());
    String secret = totpSecretGenerator.generate();
    enrollmentRepository.save(
        MfaTotpEnrollment.builder()
            .userId(user.getId())
            .encryptedSecret(cryptoService.encrypt(secret))
            .expiresAt(LocalDateTime.now().plusMinutes(ENROLLMENT_MINUTES))
            .build());

    QrData qrData =
        new QrData.Builder()
            .label(user.getEmail())
            .secret(secret)
            .issuer(TOTP_ISSUER)
            .algorithm(HashingAlgorithm.SHA1)
            .digits(OTP_LENGTH)
            .period(TOTP_PERIOD_SECONDS)
            .build();
    try {
      String qrDataUri =
          Utils.getDataUriForImage(
              totpQrGenerator.generate(qrData), totpQrGenerator.getImageMimeType());
      return new TotpSetupResponse(secret, qrData.getUri(), qrDataUri);
    } catch (QrGenerationException e) {
      throw new IllegalStateException("QR code generation failed", e);
    }
  }

  @Transactional
  public List<String> confirmTotpEnrollment(User user, String code) {
    MfaTotpEnrollment enrollment =
        enrollmentRepository
            .findByUserId(user.getId())
            .orElseThrow(() -> new IllegalArgumentException("No pending authenticator setup"));
    if (enrollment.getExpiresAt().isBefore(LocalDateTime.now())) {
      enrollmentRepository.deleteByUserId(user.getId());
      throw new IllegalArgumentException("Setup expired — restart the authenticator setup");
    }

    String secret = cryptoService.decrypt(enrollment.getEncryptedSecret());
    if (!totpCodeVerifier.isValidCode(secret, normalizeDigits(code)))
      throw new BadCredentialsException("Invalid verification code");

    boolean firstMethod = !user.isMfaEnabled();
    user.setTotpSecret(enrollment.getEncryptedSecret());
    user.setLastTotpTimestep(currentTimestep());
    userRepository.save(user);
    enrollmentRepository.deleteByUserId(user.getId());
    userService.invalidateSessions(user);
    return firstMethod ? generateRecoveryCodes(user) : List.of();
  }

  // ==================== RECOVERY CODES ====================

  /** Replaces every outstanding code with 10 fresh ones and returns their plaintext (shown once). */
  private List<String> generateRecoveryCodes(User user) {
    recoveryCodeRepository.deleteAllByUserId(user.getId());
    List<String> codes = new ArrayList<>();
    for (int i = 0; i < RECOVERY_CODE_COUNT; i++) {
      String code = randomRecoveryCode();
      codes.add(code);
      recoveryCodeRepository.save(
          MfaRecoveryCode.builder().userId(user.getId()).codeHash(sha256Hex(code)).build());
    }
    return codes;
  }

  private static String randomRecoveryCode() {
    StringBuilder sb = new StringBuilder(9);
    for (int i = 0; i < 8; i++) {
      if (i == 4) sb.append('-');
      sb.append(RECOVERY_ALPHABET.charAt(SECURE_RANDOM.nextInt(RECOVERY_ALPHABET.length())));
    }
    return sb.toString();
  }

  // ==================== HELPERS ====================

  private void requireNotDemo(User user) {
    if (user.isDemo()) throw new UnauthorizedAccessException("Demo accounts cannot enable MFA");
  }

  /** Current 30 s TOTP window index (epoch seconds / period). */
  static long currentTimestep() {
    return Math.floorDiv(Instant.now().getEpochSecond(), TOTP_PERIOD_SECONDS);
  }

  /** Keeps only digits — users often paste "123 456". */
  private static String normalizeDigits(String code) {
    return code == null ? "" : code.replaceAll("\\D", "");
  }

  /** Uppercases and trims a recovery-code entry. */
  private static String normalizeRecovery(String code) {
    return code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
  }

  /** SHA-256 hex — same scheme as PATs and email-change codes (see UserService). */
  private static String sha256Hex(String input) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      return HexFormat.of().formatHex(digest.digest(input.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new RuntimeException("SHA-256 algorithm not available", e);
    }
  }
}
```

Note: `UnauthorizedAccessException` already exists in `exceptions/` and is mapped to
403 by `GlobalExceptionHandler` — if its constructor signature differs from
`(String message)`, adapt the call, not the exception.

- [ ] **Step 6: Run the tests and make sure they pass**

Run: `./gradlew test --tests "*.MfaServiceTest"` then full `./gradlew test`.
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/dev/busato/FinanceWebApp/backend/config/TotpConfig.java \
  backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/TotpSetupResponse.java \
  backend/src/main/java/dev/busato/FinanceWebApp/backend/service/MfaService.java \
  backend/src/test/java/dev/busato/FinanceWebApp/backend/service/MfaServiceTest.java
git commit -m "feat(mfa): TOTP enrollment with QR data-URI and recovery-code generation"
```

---

### Task 5: MFA email template + email-code enrollment

**Files:**
- Create: `backend/src/main/resources/templates/email/mfaCodeEmail.html`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/SendEmailService.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/MfaService.java`
- Test: extend `backend/src/test/java/dev/busato/FinanceWebApp/backend/service/MfaServiceTest.java`

**Interfaces (Produces):**
- `SendEmailService.sendMfaCode(String to, String code)` — throws
  `MessagingException, UnsupportedEncodingException` like its siblings.
- `MfaService.startEmailMfaEnrollment(User)` / `confirmEmailMfaEnrollment(User, String) : List<String>`
  (recovery codes when first method, else empty).
- Shared internals later tasks reuse: `sendChallengeCode(User, Purpose, int ttlMinutes)`
  (60 s cooldown), `requireActiveChallenge(User, Purpose)`, `registerAttempt(MfaChallenge)`,
  `generateOtp()`, `isEmailChallengeCodeValid(User, Purpose, String)`.

- [ ] **Step 1: Create the email template**

Duplicate the existing code template and fix the copy:

```bash
cp backend/src/main/resources/templates/email/emailChangeCodeEmail.html \
   backend/src/main/resources/templates/email/mfaCodeEmail.html
```

Then edit `mfaCodeEmail.html`: replace the `{{context}}` placeholder occurrence with the
fixed sentence `Enter this code to verify your identity. It expires in 10 minutes.` and
update any title/heading mentioning "email change" to "verification code". Keep the
`{{code}}` placeholder untouched.

- [ ] **Step 2: Add `SendEmailService.sendMfaCode`**

After `sendEmailChangeCode` (same structure):

```java
  public void sendMfaCode(String to, String code)
      throws MessagingException, UnsupportedEncodingException {
    String htmlTemplate = getHtmlTemplate("templates/email/mfaCodeEmail.html");

    String finalHtml = htmlTemplate.replace("{{code}}", code);

    MimeMessage message = mailSender.createMimeMessage();
    MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

    helper.setFrom("noreply@busato.dev", "FinanceWebApp");
    helper.setTo(to);
    helper.setSubject("Your FinanceWebApp verification code");
    helper.setText(finalHtml, true);

    mailSender.send(message);
  }
```

- [ ] **Step 3: Write the failing tests (extend `MfaServiceTest`)**

```java
  @org.junit.jupiter.api.Nested
  class EmailEnrollment {

    /** Captures the plaintext code handed to the (mocked) mail sender. */
    private String sentCode() throws Exception {
      org.mockito.ArgumentCaptor<String> captor = org.mockito.ArgumentCaptor.forClass(String.class);
      org.mockito.Mockito.verify(sendEmailService, org.mockito.Mockito.atLeastOnce())
          .sendMfaCode(org.mockito.Mockito.eq("mfa@example.com"), captor.capture());
      return captor.getValue();
    }

    @Test
    void enrollmentSendsCodeAndConfirmEnables() throws Exception {
      mfaService.startEmailMfaEnrollment(user);
      List<String> codes = mfaService.confirmEmailMfaEnrollment(user, sentCode());

      assertTrue(user.isEmailMfaEnabled());
      assertEquals(10, codes.size()); // first method → recovery codes
    }

    @Test
    void wrongCodeDoesNotEnable() throws Exception {
      mfaService.startEmailMfaEnrollment(user);
      assertThrows(
          BadCredentialsException.class,
          () -> mfaService.confirmEmailMfaEnrollment(user, "000000"));
      assertFalse(user.isEmailMfaEnabled());
    }

    @Test
    void sixthAttemptDropsTheChallenge() throws Exception {
      mfaService.startEmailMfaEnrollment(user);
      for (int i = 0; i < 5; i++) {
        assertThrows(
            BadCredentialsException.class,
            () -> mfaService.confirmEmailMfaEnrollment(user, "000000"));
      }
      // 6th attempt exceeds MAX_ATTEMPTS → challenge dropped with a flow error
      assertThrows(
          IllegalArgumentException.class,
          () -> mfaService.confirmEmailMfaEnrollment(user, "000000"));
      // and the flow must be restarted
      assertThrows(
          IllegalArgumentException.class,
          () -> mfaService.confirmEmailMfaEnrollment(user, "123456"));
    }

    @Test
    void resendWithinCooldownIsRejected() {
      mfaService.startEmailMfaEnrollment(user);
      assertThrows(IllegalArgumentException.class, () -> mfaService.startEmailMfaEnrollment(user));
    }

    @Test
    void secondMethodDoesNotRegenerateRecoveryCodes() throws Exception {
      TotpSetupResponse setup = mfaService.startTotpEnrollment(user);
      mfaService.confirmTotpEnrollment(user, validCode(setup.getSecret()));

      mfaService.startEmailMfaEnrollment(user);
      List<String> codes = mfaService.confirmEmailMfaEnrollment(user, sentCode());
      assertTrue(codes.isEmpty());
      assertEquals(10, recoveryCodeRepository.countByUserId(user.getId()));
    }
  }
```

Also add the missing imports to the test (`MfaChallengeRepository` if needed).

- [ ] **Step 4: Run to verify failure**

Run: `./gradlew test --tests "*.MfaServiceTest"`
Expected: compilation FAILURE — enrollment methods missing.

- [ ] **Step 5: Implement in `MfaService`**

Add the dependency `private final SendEmailService sendEmailService;` to the service's
fields, plus a new section after the TOTP one:

```java
  // ==================== EMAIL-CODE ENROLLMENT ====================

  /**
   * Not @Transactional on purpose (mirrors UserService email-change): the challenge row must be
   * persisted independently of the mail send, and attempt counters must survive the exception
   * that reports a bad code.
   */
  public void startEmailMfaEnrollment(User user) {
    requireNotDemo(user);
    if (user.isEmailMfaEnabled())
      throw new IllegalArgumentException("Email codes are already enabled");
    sendChallengeCode(user, MfaChallenge.Purpose.EMAIL_ENROLLMENT, ENROLLMENT_MINUTES);
  }

  public List<String> confirmEmailMfaEnrollment(User user, String code) {
    MfaChallenge challenge = requireActiveChallenge(user, MfaChallenge.Purpose.EMAIL_ENROLLMENT);
    registerAttempt(challenge);
    if (challenge.getEmailCodeHash() == null
        || !sha256Hex(normalizeDigits(code)).equals(challenge.getEmailCodeHash()))
      throw new BadCredentialsException("Invalid verification code");

    boolean firstMethod = !user.isMfaEnabled();
    user.setEmailMfaEnabled(true);
    userRepository.save(user);
    challengeRepository.deleteByUserIdAndPurpose(
        user.getId(), MfaChallenge.Purpose.EMAIL_ENROLLMENT);
    userService.invalidateSessions(user);
    return firstMethod ? generateRecoveryCodes(user) : List.of();
  }

  // ==================== CHALLENGE PLUMBING (shared with login + settings flows) ====================

  /** (Re)issues an email code on an existing or fresh challenge, enforcing the resend cooldown. */
  private void sendChallengeCode(User user, MfaChallenge.Purpose purpose, int ttlMinutes) {
    MfaChallenge challenge =
        challengeRepository
            .findByUserIdAndPurpose(user.getId(), purpose)
            .filter(c -> c.getExpiresAt().isAfter(LocalDateTime.now()))
            .orElse(null);

    if (challenge != null
        && challenge.getEmailCodeSentAt() != null
        && challenge
            .getEmailCodeSentAt()
            .isAfter(LocalDateTime.now().minusSeconds(EMAIL_RESEND_COOLDOWN_SECONDS))) {
      throw new IllegalArgumentException("Please wait a minute before requesting another code");
    }

    if (challenge == null) {
      challengeRepository.deleteByUserIdAndPurpose(user.getId(), purpose); // clear expired row
      challenge =
          MfaChallenge.builder()
              .userId(user.getId())
              .purpose(purpose)
              .expiresAt(LocalDateTime.now().plusMinutes(ttlMinutes))
              .build();
    }

    String code = generateOtp();
    challenge.setEmailCodeHash(sha256Hex(code));
    challenge.setEmailCodeSentAt(LocalDateTime.now());
    challengeRepository.save(challenge);

    try {
      sendEmailService.sendMfaCode(user.getEmail(), code);
    } catch (Exception e) {
      throw new RuntimeException("Failed to send the verification code email.", e);
    }
  }

  private MfaChallenge requireActiveChallenge(User user, MfaChallenge.Purpose purpose) {
    MfaChallenge challenge =
        challengeRepository
            .findByUserIdAndPurpose(user.getId(), purpose)
            .orElseThrow(() -> new IllegalArgumentException("No pending verification"));
    if (challenge.getExpiresAt().isBefore(LocalDateTime.now())) {
      challengeRepository.deleteByUserIdAndPurpose(user.getId(), purpose);
      throw new IllegalArgumentException("Verification expired — start again");
    }
    return challenge;
  }

  /** Persists the incremented attempt counter; drops the challenge past the limit. */
  private void registerAttempt(MfaChallenge challenge) {
    challenge.setAttempts(challenge.getAttempts() + 1);
    if (challenge.getAttempts() > MAX_ATTEMPTS) {
      challengeRepository.delete(challenge);
      throw new IllegalArgumentException("Too many attempts — start again");
    }
    challengeRepository.save(challenge);
  }

  /** Consumes a single-use email code for the given purpose; false when absent/expired/mismatch. */
  private boolean isEmailChallengeCodeValid(
      User user, MfaChallenge.Purpose purpose, String rawCode) {
    MfaChallenge challenge =
        challengeRepository
            .findByUserIdAndPurpose(user.getId(), purpose)
            .filter(c -> c.getExpiresAt().isAfter(LocalDateTime.now()))
            .orElse(null);
    if (challenge == null || challenge.getEmailCodeHash() == null) return false;
    if (!sha256Hex(normalizeDigits(rawCode)).equals(challenge.getEmailCodeHash())) return false;
    challengeRepository.delete(challenge); // single use
    return true;
  }

  /** Zero-padded 6-digit code from a CSPRNG (same scheme as UserService). */
  private static String generateOtp() {
    return String.format("%0" + OTP_LENGTH + "d", SECURE_RANDOM.nextInt(1_000_000));
  }
```

Add the `MfaChallenge` import.

- [ ] **Step 6: Run the tests and make sure they pass**

Run: `./gradlew test --tests "*.MfaServiceTest"` then full `./gradlew test`. Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/resources/templates/email/mfaCodeEmail.html \
  backend/src/main/java/dev/busato/FinanceWebApp/backend/service/SendEmailService.java \
  backend/src/main/java/dev/busato/FinanceWebApp/backend/service/MfaService.java \
  backend/src/test/java/dev/busato/FinanceWebApp/backend/service/MfaServiceTest.java
git commit -m "feat(mfa): email-code enrollment with hashed OTPs, cooldown and attempt limits"
```

---

### Task 6: Disable flows, settings email code, recovery-code regeneration, status

**Files:**
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/MfaService.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/MfaStatusResponse.java`
- Test: extend `backend/src/test/java/dev/busato/FinanceWebApp/backend/service/MfaServiceTest.java`

**Interfaces (Produces):**
- `MfaStatusResponse { boolean totpEnabled; boolean emailMfaEnabled; int recoveryCodesRemaining; }`
- `MfaService.disableTotp(User, String password, String code)` /
  `disableEmailMfa(User, String password, String code)` — password + any valid code
  (TOTP / SETTINGS email code / recovery); disabling the LAST method deletes recovery codes.
- `MfaService.sendSettingsEmailCode(User)` — only when email MFA is enabled.
- `MfaService.regenerateRecoveryCodes(User, String password) : List<String>`.
- `MfaService.getStatus(User) : MfaStatusResponse`, `getEnabledMethods(User) : List<String>`
  (`"TOTP"` / `"EMAIL"`).
- Internals later tasks reuse: `isTotpCodeValid(User, String)` (with replay guard),
  `consumeRecoveryCode(User, String)`.

- [ ] **Step 1: Write the failing tests (extend `MfaServiceTest`)**

The user needs a real bcrypt password now — change `setUp()` to encode one:

```java
  @Autowired private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

  // in setUp(), replace the password line with:
  //   .password(passwordEncoder.encode("Password1!"))
```

New nested class:

```java
  @org.junit.jupiter.api.Nested
  class DisableAndRecovery {

    private List<String> enableTotp() throws Exception {
      TotpSetupResponse setup = mfaService.startTotpEnrollment(user);
      return mfaService.confirmTotpEnrollment(user, validCode(setup.getSecret()));
    }

    @Test
    void statusReflectsEnabledMethodsAndRemainingCodes() throws Exception {
      var before = mfaService.getStatus(user);
      assertFalse(before.isTotpEnabled());
      assertEquals(0, before.getRecoveryCodesRemaining());

      enableTotp();
      var after = mfaService.getStatus(user);
      assertTrue(after.isTotpEnabled());
      assertFalse(after.isEmailMfaEnabled());
      assertEquals(10, after.getRecoveryCodesRemaining());
      assertEquals(List.of("TOTP"), mfaService.getEnabledMethods(user));
    }

    @Test
    void disableTotpWithRecoveryCodeRemovesEverything() throws Exception {
      List<String> codes = enableTotp();
      mfaService.disableTotp(user, "Password1!", codes.get(0));

      assertNull(user.getTotpSecret());
      assertFalse(user.isMfaEnabled());
      assertEquals(0, recoveryCodeRepository.countByUserId(user.getId())); // last method → wiped
    }

    @Test
    void disableRequiresCorrectPassword() throws Exception {
      List<String> codes = enableTotp();
      assertThrows(
          BadCredentialsException.class,
          () -> mfaService.disableTotp(user, "wrong-password", codes.get(0)));
      assertNotNull(user.getTotpSecret());
    }

    @Test
    void recoveryCodesAreSingleUse() throws Exception {
      List<String> codes = enableTotp();
      mfaService.disableTotp(user, "Password1!", codes.get(0));
      // Re-enable, then the OLD code must be gone (regenerated set)
      List<String> fresh = enableTotp();
      assertThrows(
          BadCredentialsException.class,
          () -> mfaService.disableTotp(user, "Password1!", codes.get(0)));
      mfaService.disableTotp(user, "Password1!", fresh.get(0));
    }

    @Test
    void totpReplayIsRejected() throws Exception {
      TotpSetupResponse setup = mfaService.startTotpEnrollment(user);
      String code = validCode(setup.getSecret());
      mfaService.confirmTotpEnrollment(user, code);
      // Same 30s window ⇒ lastTotpTimestep blocks reuse of the code
      assertThrows(
          BadCredentialsException.class, () -> mfaService.disableTotp(user, "Password1!", code));
    }

    @Test
    void regenerateReplacesCodes() throws Exception {
      List<String> first = enableTotp();
      List<String> second = mfaService.regenerateRecoveryCodes(user, "Password1!");
      assertEquals(10, second.size());
      assertNotEquals(first, second);
      assertEquals(10, recoveryCodeRepository.countByUserId(user.getId()));
    }

    @Test
    void settingsEmailCodeRequiresEmailMfa() {
      assertThrows(IllegalArgumentException.class, () -> mfaService.sendSettingsEmailCode(user));
    }
  }
```

- [ ] **Step 2: Run to verify failure**

Run: `./gradlew test --tests "*.MfaServiceTest"` — compilation FAILURE (methods missing).

- [ ] **Step 3: Create `MfaStatusResponse`**

```java
package dev.busato.FinanceWebApp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MfaStatusResponse {
  private boolean totpEnabled;
  private boolean emailMfaEnabled;
  private int recoveryCodesRemaining;
}
```

- [ ] **Step 4: Implement in `MfaService`**

Add `private final PasswordEncoder passwordEncoder;` to the fields
(`org.springframework.security.crypto.password.PasswordEncoder`) and the imports for
`MfaStatusResponse`. New sections:

```java
  // ==================== DISABLE / STATUS / RECOVERY MANAGEMENT ====================

  @Transactional
  public void disableTotp(User user, String password, String code) {
    requirePassword(user, password);
    if (user.getTotpSecret() == null)
      throw new IllegalArgumentException("Authenticator app is not enabled");
    requireValidSettingsCode(user, code);

    user.setTotpSecret(null);
    user.setLastTotpTimestep(null);
    userRepository.save(user);
    cleanupIfMfaFullyDisabled(user);
    userService.invalidateSessions(user);
  }

  @Transactional
  public void disableEmailMfa(User user, String password, String code) {
    requirePassword(user, password);
    if (!user.isEmailMfaEnabled())
      throw new IllegalArgumentException("Email codes are not enabled");
    requireValidSettingsCode(user, code);

    user.setEmailMfaEnabled(false);
    userRepository.save(user);
    cleanupIfMfaFullyDisabled(user);
    userService.invalidateSessions(user);
  }

  /** Emails a code usable in the disable flow (only meaningful with email MFA on). */
  public void sendSettingsEmailCode(User user) {
    if (!user.isEmailMfaEnabled())
      throw new IllegalArgumentException("Email codes are not enabled");
    sendChallengeCode(user, MfaChallenge.Purpose.SETTINGS, ENROLLMENT_MINUTES);
  }

  @Transactional
  public List<String> regenerateRecoveryCodes(User user, String password) {
    requirePassword(user, password);
    if (!user.isMfaEnabled()) throw new IllegalArgumentException("MFA is not enabled");
    return generateRecoveryCodes(user);
  }

  public MfaStatusResponse getStatus(User user) {
    return new MfaStatusResponse(
        user.getTotpSecret() != null,
        user.isEmailMfaEnabled(),
        (int) recoveryCodeRepository.countByUserId(user.getId()));
  }

  /** Hint list for the login second step (e.g. ["TOTP", "EMAIL"]). */
  public List<String> getEnabledMethods(User user) {
    List<String> methods = new ArrayList<>();
    if (user.getTotpSecret() != null) methods.add("TOTP");
    if (user.isEmailMfaEnabled()) methods.add("EMAIL");
    return methods;
  }

  // ==================== CODE VERIFICATION PRIMITIVES ====================

  private void requirePassword(User user, String password) {
    if (password == null || !passwordEncoder.matches(password, user.getPassword()))
      throw new BadCredentialsException("Current password is incorrect");
  }

  /** Accepts a TOTP code, a SETTINGS email code, or a recovery code. */
  private void requireValidSettingsCode(User user, String rawCode) {
    if (isTotpCodeValid(user, rawCode)) return;
    if (isEmailChallengeCodeValid(user, MfaChallenge.Purpose.SETTINGS, rawCode)) return;
    if (consumeRecoveryCode(user, rawCode)) return;
    throw new BadCredentialsException("Invalid verification code");
  }

  /**
   * Verifies a TOTP code against the user's (decrypted) secret and enforces the replay guard: a
   * code from an already-consumed 30 s window is rejected even if cryptographically valid.
   */
  private boolean isTotpCodeValid(User user, String rawCode) {
    if (user.getTotpSecret() == null) return false;
    String code = normalizeDigits(rawCode);
    if (code.length() != OTP_LENGTH) return false;
    String secret = cryptoService.decrypt(user.getTotpSecret());
    if (!totpCodeVerifier.isValidCode(secret, code)) return false;

    long timestep = currentTimestep();
    if (user.getLastTotpTimestep() != null && timestep <= user.getLastTotpTimestep())
      return false;
    user.setLastTotpTimestep(timestep);
    userRepository.save(user);
    return true;
  }

  /** Burns the matching recovery code (single use); false when no code matches. */
  private boolean consumeRecoveryCode(User user, String rawCode) {
    String hash = sha256Hex(normalizeRecovery(rawCode));
    return recoveryCodeRepository.findAllByUserId(user.getId()).stream()
        .filter(rc -> rc.getCodeHash().equals(hash))
        .findFirst()
        .map(
            rc -> {
              recoveryCodeRepository.delete(rc);
              return true;
            })
        .orElse(false);
  }

  /** When the last method goes, recovery codes and pending state go with it. */
  private void cleanupIfMfaFullyDisabled(User user) {
    if (!user.isMfaEnabled()) {
      recoveryCodeRepository.deleteAllByUserId(user.getId());
      challengeRepository.deleteAllByUserId(user.getId());
      enrollmentRepository.deleteByUserId(user.getId());
    }
  }
```

Known trade-off (accepted in the spec): right after confirming TOTP enrollment the
current 30 s window is marked used, so a login in the same window reports an invalid
code — the user waits ≤30 s for the next code. Do not "fix" this by weakening the
replay guard.

- [ ] **Step 5: Run the tests and make sure they pass**

Run: `./gradlew test --tests "*.MfaServiceTest"` then full `./gradlew test`. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main/java/dev/busato/FinanceWebApp/backend/service/MfaService.java \
  backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/MfaStatusResponse.java \
  backend/src/test/java/dev/busato/FinanceWebApp/backend/service/MfaServiceTest.java
git commit -m "feat(mfa): disable flows, settings email code, recovery regeneration, status"
```

---

### Task 7: `RefreshCookieService` extraction + `MfaController` settings endpoints + `SecurityConfig`

**Files:**
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/security/RefreshCookieService.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/AuthController.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/MfaCodeRequest.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/MfaDisableRequest.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/MfaRegenerateRequest.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/MfaUpdateResponse.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/MfaController.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/config/SecurityConfig.java:62-70`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/controller/MfaControllerTest.java`

**Interfaces (Produces):**
- `RefreshCookieService` (`@Component`, package `security`):
  `addRefreshTokenCookie(HttpServletResponse, String refreshToken, boolean rememberMe)`,
  `clearRefreshTokenCookie(HttpServletResponse)`,
  `extractRefreshTokenFromCookie(HttpServletRequest) : String`,
  constant `REFRESH_TOKEN_COOKIE = "refresh_token"`.
- DTOs: `MfaCodeRequest { @NotBlank String code; boolean rememberMe; }`,
  `MfaDisableRequest { @NotBlank String password; @NotBlank String code; boolean rememberMe; }`,
  `MfaRegenerateRequest { @NotBlank String password; }`,
  `MfaUpdateResponse { String message; String token; List<String> recoveryCodes; }` (Builder).
- Endpoints (all under `/api/auth/mfa`, authenticated): `GET /status`,
  `POST /totp/setup`, `POST /totp/confirm`, `POST /totp/disable`, `POST /email/setup`,
  `POST /email/confirm`, `POST /email/disable`, `POST /email/send-settings-code`,
  `POST /recovery-codes/regenerate`.
- Enable/disable responses carry a **fresh access token** (`token`) and set a fresh
  refresh cookie (honoring the request's `rememberMe`) because the service bumped
  `tokenVersion` — the frontend must swap its stored JWT.

- [ ] **Step 1: Extract `RefreshCookieService`**

Move the three private helpers + constant out of `AuthController` **verbatim** (this is
a behavior-invariant refactor):

```java
package dev.busato.FinanceWebApp.backend.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Owns the refresh_token cookie lifecycle, shared by AuthController and MfaController. */
@Component
@RequiredArgsConstructor
public class RefreshCookieService {

  public static final String REFRESH_TOKEN_COOKIE = "refresh_token";

  private final JwtService jwtService;

  @Value("${application.frontend.url}")
  private String frontendUrl;

  private boolean isSecureCookie() {
    return frontendUrl != null && frontendUrl.startsWith("https");
  }

  public void addRefreshTokenCookie(
      HttpServletResponse response, String refreshToken, boolean rememberMe) {
    Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, refreshToken);
    cookie.setHttpOnly(true);
    cookie.setSecure(isSecureCookie());
    cookie.setPath("/api/auth");
    cookie.setAttribute("SameSite", isSecureCookie() ? "Strict" : "Lax");

    if (rememberMe) {
      cookie.setMaxAge((int) (jwtService.getRefreshExpiration() / 1000));
    } else {
      cookie.setMaxAge(-1); // session cookie
    }

    response.addCookie(cookie);
  }

  public void clearRefreshTokenCookie(HttpServletResponse response) {
    Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, "");
    cookie.setHttpOnly(true);
    cookie.setSecure(isSecureCookie());
    cookie.setPath("/api/auth");
    cookie.setAttribute("SameSite", isSecureCookie() ? "Strict" : "Lax");
    cookie.setMaxAge(0);
    response.addCookie(cookie);
  }

  public String extractRefreshTokenFromCookie(HttpServletRequest request) {
    if (request.getCookies() == null) return null;
    return Arrays.stream(request.getCookies())
        .filter(c -> REFRESH_TOKEN_COOKIE.equals(c.getName()))
        .map(Cookie::getValue)
        .findFirst()
        .orElse(null);
  }
}
```

In `AuthController`: inject `private final RefreshCookieService refreshCookieService;`,
delete the private helpers + the `REFRESH_TOKEN_COOKIE` constant + the now-unused
`frontendUrl` field and `isSecureCookie()`, and replace every call site
(`addRefreshTokenCookie(...)` → `refreshCookieService.addRefreshTokenCookie(...)`, etc.).
Run `./gradlew test` — the existing `AuthControllerTest` must pass unchanged before
moving on.

- [ ] **Step 2: Create the request/response DTOs**

`MfaCodeRequest.java`:

```java
package dev.busato.FinanceWebApp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MfaCodeRequest {
  @NotBlank private String code;

  /** Where the frontend keeps the JWT (localStorage vs session) — drives the cookie Max-Age. */
  private boolean rememberMe;
}
```

`MfaDisableRequest.java`:

```java
package dev.busato.FinanceWebApp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MfaDisableRequest {
  @NotBlank private String password;
  @NotBlank private String code;
  private boolean rememberMe;
}
```

`MfaRegenerateRequest.java`:

```java
package dev.busato.FinanceWebApp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MfaRegenerateRequest {
  @NotBlank private String password;
}
```

`MfaUpdateResponse.java`:

```java
package dev.busato.FinanceWebApp.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL) // token/recoveryCodes are conditional
public class MfaUpdateResponse {
  private String message;

  /** Fresh access token — present when the operation bumped tokenVersion. */
  private String token;

  /** Plaintext recovery codes — present only when a fresh set was just generated. */
  private List<String> recoveryCodes;
}
```

- [ ] **Step 3: Write the failing controller test**

House pattern: `@WebMvcTest` + `BaseWebMvcTest` (filters off, `@AuthenticationPrincipal`
resolves to `mockUser`).

```java
package dev.busato.FinanceWebApp.backend.controller;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import dev.busato.FinanceWebApp.backend.dto.MfaStatusResponse;
import dev.busato.FinanceWebApp.backend.dto.TotpSetupResponse;
import dev.busato.FinanceWebApp.backend.security.JwtService;
import dev.busato.FinanceWebApp.backend.security.RefreshCookieService;
import dev.busato.FinanceWebApp.backend.service.MfaService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@WebMvcTest(MfaController.class)
class MfaControllerTest extends BaseWebMvcTest {

  @MockitoBean private MfaService mfaService;
  @MockitoBean private JwtService jwtService;
  @MockitoBean private RefreshCookieService refreshCookieService;

  @Test
  void statusReturnsMfaState() throws Exception {
    when(mfaService.getStatus(any())).thenReturn(new MfaStatusResponse(true, false, 7));

    mockMvc
        .perform(get("/api/auth/mfa/status"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totpEnabled").value(true))
        .andExpect(jsonPath("$.emailMfaEnabled").value(false))
        .andExpect(jsonPath("$.recoveryCodesRemaining").value(7));
  }

  @Test
  void totpSetupReturnsQr() throws Exception {
    when(mfaService.startTotpEnrollment(any()))
        .thenReturn(new TotpSetupResponse("SECRET", "otpauth://totp/x", "data:image/png;base64,x"));

    mockMvc
        .perform(post("/api/auth/mfa/totp/setup"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.secret").value("SECRET"))
        .andExpect(jsonPath("$.qrDataUri").value("data:image/png;base64,x"));
  }

  @Test
  void totpConfirmReturnsRecoveryCodesAndFreshToken() throws Exception {
    when(mfaService.confirmTotpEnrollment(any(), eq("123456")))
        .thenReturn(List.of("AAAA-AAAA", "BBBB-BBBB"));
    when(jwtService.generateToken(anyMap(), any())).thenReturn("fresh-access");
    when(jwtService.generateRefreshToken(any())).thenReturn("fresh-refresh");

    mockMvc
        .perform(
            post("/api/auth/mfa/totp/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of("code", "123456", "rememberMe", true))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").value("fresh-access"))
        .andExpect(jsonPath("$.recoveryCodes[0]").value("AAAA-AAAA"));
  }

  @Test
  void blankCodeIsRejected() throws Exception {
    mockMvc
        .perform(
            post("/api/auth/mfa/totp/confirm")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("code", ""))))
        .andExpect(status().isBadRequest());
  }

  @Test
  void regenerateReturnsCodesWithoutToken() throws Exception {
    when(mfaService.regenerateRecoveryCodes(any(), eq("pw"))).thenReturn(List.of("CCCC-CCCC"));

    mockMvc
        .perform(
            post("/api/auth/mfa/recovery-codes/regenerate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("password", "pw"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.recoveryCodes[0]").value("CCCC-CCCC"))
        .andExpect(jsonPath("$.token").doesNotExist());
  }
}
```

- [ ] **Step 4: Run to verify failure**

Run: `./gradlew test --tests "*.MfaControllerTest"` — FAILURE (controller missing).

- [ ] **Step 5: Create `MfaController` (settings half)**

```java
package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.*;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.security.JwtService;
import dev.busato.FinanceWebApp.backend.security.RefreshCookieService;
import dev.busato.FinanceWebApp.backend.service.MfaService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/mfa")
@RequiredArgsConstructor
public class MfaController {

  private final MfaService mfaService;
  private final JwtService jwtService;
  private final RefreshCookieService refreshCookieService;

  // ==================== SETTINGS (authenticated) ====================

  @GetMapping("/status")
  public ResponseEntity<MfaStatusResponse> status(@AuthenticationPrincipal User user) {
    return ResponseEntity.ok(mfaService.getStatus(user));
  }

  @PostMapping("/totp/setup")
  public ResponseEntity<TotpSetupResponse> totpSetup(@AuthenticationPrincipal User user) {
    return ResponseEntity.ok(mfaService.startTotpEnrollment(user));
  }

  @PostMapping("/totp/confirm")
  public ResponseEntity<MfaUpdateResponse> totpConfirm(
      @AuthenticationPrincipal User user,
      @Valid @RequestBody MfaCodeRequest request,
      HttpServletResponse response) {
    List<String> recoveryCodes = mfaService.confirmTotpEnrollment(user, request.getCode());
    return ResponseEntity.ok(
        reissueSession(
            user, "Authenticator app enabled", recoveryCodes, request.isRememberMe(), response));
  }

  @PostMapping("/totp/disable")
  public ResponseEntity<MfaUpdateResponse> totpDisable(
      @AuthenticationPrincipal User user,
      @Valid @RequestBody MfaDisableRequest request,
      HttpServletResponse response) {
    mfaService.disableTotp(user, request.getPassword(), request.getCode());
    return ResponseEntity.ok(
        reissueSession(user, "Authenticator app disabled", null, request.isRememberMe(), response));
  }

  @PostMapping("/email/setup")
  public ResponseEntity<Map<String, String>> emailSetup(@AuthenticationPrincipal User user) {
    mfaService.startEmailMfaEnrollment(user);
    return ResponseEntity.ok(Map.of("message", "Verification code sent"));
  }

  @PostMapping("/email/confirm")
  public ResponseEntity<MfaUpdateResponse> emailConfirm(
      @AuthenticationPrincipal User user,
      @Valid @RequestBody MfaCodeRequest request,
      HttpServletResponse response) {
    List<String> recoveryCodes = mfaService.confirmEmailMfaEnrollment(user, request.getCode());
    return ResponseEntity.ok(
        reissueSession(
            user, "Email codes enabled", recoveryCodes, request.isRememberMe(), response));
  }

  @PostMapping("/email/disable")
  public ResponseEntity<MfaUpdateResponse> emailDisable(
      @AuthenticationPrincipal User user,
      @Valid @RequestBody MfaDisableRequest request,
      HttpServletResponse response) {
    mfaService.disableEmailMfa(user, request.getPassword(), request.getCode());
    return ResponseEntity.ok(
        reissueSession(user, "Email codes disabled", null, request.isRememberMe(), response));
  }

  @PostMapping("/email/send-settings-code")
  public ResponseEntity<Map<String, String>> sendSettingsCode(@AuthenticationPrincipal User user) {
    mfaService.sendSettingsEmailCode(user);
    return ResponseEntity.ok(Map.of("message", "Verification code sent"));
  }

  @PostMapping("/recovery-codes/regenerate")
  public ResponseEntity<MfaUpdateResponse> regenerateRecoveryCodes(
      @AuthenticationPrincipal User user, @Valid @RequestBody MfaRegenerateRequest request) {
    List<String> codes = mfaService.regenerateRecoveryCodes(user, request.getPassword());
    return ResponseEntity.ok(
        MfaUpdateResponse.builder()
            .message("Recovery codes regenerated")
            .recoveryCodes(codes)
            .build());
  }

  // ==================== HELPERS ====================

  /**
   * Enable/disable bumped tokenVersion (every other session is now signed out). Re-issue fresh
   * tokens so THIS session continues seamlessly: new access token in the body, new refresh cookie.
   */
  private MfaUpdateResponse reissueSession(
      User user,
      String message,
      List<String> recoveryCodes,
      boolean rememberMe,
      HttpServletResponse response) {
    Map<String, Object> extraClaims = new HashMap<>();
    extraClaims.put("role", user.getRole());
    extraClaims.put("userId", user.getId());
    String accessToken = jwtService.generateToken(extraClaims, user);
    refreshCookieService.addRefreshTokenCookie(
        response, jwtService.generateRefreshToken(user), rememberMe);
    return MfaUpdateResponse.builder()
        .message(message)
        .token(accessToken)
        .recoveryCodes(recoveryCodes)
        .build();
  }
}
```

- [ ] **Step 6: Update `SecurityConfig`**

Insert **before** the existing `.requestMatchers("/api/auth/**").permitAll()` (order
matters — first match wins):

```java
                    // MFA login-flow endpoints are public (self-authorized by the pending token)
                    .requestMatchers("/api/auth/mfa/verify", "/api/auth/mfa/send-email-code")
                    .permitAll()
                    // Every other MFA endpoint is a settings operation → authenticated
                    .requestMatchers("/api/auth/mfa/**")
                    .authenticated()
```

- [ ] **Step 7: Run the tests and make sure they pass**

Run: `./gradlew test --tests "*.MfaControllerTest"` then the FULL `./gradlew test`
(`AuthControllerTest` guards the cookie-refactor). Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/src/main/java/dev/busato/FinanceWebApp/backend/security/RefreshCookieService.java \
  backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/AuthController.java \
  backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/MfaController.java \
  backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/ \
  backend/src/main/java/dev/busato/FinanceWebApp/backend/config/SecurityConfig.java \
  backend/src/test/java/dev/busato/FinanceWebApp/backend/controller/MfaControllerTest.java
git commit -m "feat(mfa): settings endpoints under /api/auth/mfa + shared refresh-cookie service"
```

## Phase C — Backend login flow + admin reset

### Task 8: Login returns an MFA challenge (`AuthResponse` fields + `AuthController` branch)

**Files:**
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/AuthResponse.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/MfaService.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/AuthController.java:43-68`
- Test: `backend/src/test/java/dev/busato/FinanceWebApp/backend/controller/AuthControllerMfaTest.java`

**Interfaces (Produces):**
- `AuthResponse` gains `Boolean mfaRequired; String mfaPendingToken; List<String> mfaMethods;`
  and is annotated `@JsonInclude(JsonInclude.Include.NON_NULL)` so old clients see no new
  null fields (`MfaUpdateResponse` already carries the annotation from Task 7).
- `MfaService.beginLoginChallenge(User) : String` — creates/replaces the LOGIN challenge
  row (5-min TTL) and returns the `mfa_pending` JWT.
- Contract consumed by the frontend: a login against an MFA-enabled account returns
  `{ mfaRequired: true, mfaPendingToken, mfaMethods: ["TOTP"|"EMAIL", ...] }` with **no**
  `token` and **no** refresh cookie.

- [ ] **Step 1: Write the failing test**

```java
package dev.busato.FinanceWebApp.backend.controller;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.security.JwtService;
import dev.busato.FinanceWebApp.backend.security.RefreshCookieService;
import dev.busato.FinanceWebApp.backend.service.MfaService;
import dev.busato.FinanceWebApp.backend.service.RegisterService;
import dev.busato.FinanceWebApp.backend.service.UserService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@WebMvcTest(AuthController.class)
class AuthControllerMfaTest extends BaseWebMvcTest {

  @MockitoBean private AuthenticationManager authenticationManager;
  @MockitoBean private JwtService jwtService;
  @MockitoBean private UserService userService;
  @MockitoBean private RegisterService registerService;
  @MockitoBean private UserDetailsService userDetailsService;
  @MockitoBean private MfaService mfaService;
  @MockitoBean private RefreshCookieService refreshCookieService;

  private String loginBody() throws Exception {
    return objectMapper.writeValueAsString(
        Map.of("username", "mfa-user", "password", "pw", "rememberMe", true));
  }

  @Test
  void mfaUserGetsChallengeInsteadOfTokens() throws Exception {
    User mfaUser = new User();
    mfaUser.setUsername("mfa-user");
    mfaUser.setTotpSecret("encrypted"); // MFA enabled
    when(authenticationManager.authenticate(any()))
        .thenReturn(new UsernamePasswordAuthenticationToken(mfaUser, null, List.of()));
    when(mfaService.beginLoginChallenge(mfaUser)).thenReturn("pending-jwt");
    when(mfaService.getEnabledMethods(mfaUser)).thenReturn(List.of("TOTP"));

    mockMvc
        .perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(loginBody()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mfaRequired").value(true))
        .andExpect(jsonPath("$.mfaPendingToken").value("pending-jwt"))
        .andExpect(jsonPath("$.mfaMethods[0]").value("TOTP"))
        .andExpect(jsonPath("$.token").doesNotExist());

    verify(jwtService, never()).generateToken(anyMap(), any());
    verify(refreshCookieService, never()).addRefreshTokenCookie(any(), anyString(), anyBoolean());
  }

  @Test
  void nonMfaUserStillGetsTokensDirectly() throws Exception {
    User plainUser = new User();
    plainUser.setUsername("plain-user");
    when(authenticationManager.authenticate(any()))
        .thenReturn(new UsernamePasswordAuthenticationToken(plainUser, null, List.of()));
    when(jwtService.generateToken(anyMap(), eq(plainUser))).thenReturn("access");
    when(jwtService.generateRefreshToken(plainUser)).thenReturn("refresh");

    mockMvc
        .perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(loginBody()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").value("access"))
        .andExpect(jsonPath("$.mfaRequired").doesNotExist());

    verify(refreshCookieService).addRefreshTokenCookie(any(), eq("refresh"), eq(true));
    verify(mfaService, never()).beginLoginChallenge(any());
  }
}
```

- [ ] **Step 2: Run to verify failure**

Run: `./gradlew test --tests "*.AuthControllerMfaTest"` — FAILURE.

- [ ] **Step 3: Extend `AuthResponse` and `MfaUpdateResponse`**

`AuthResponse.java` becomes:

```java
package dev.busato.FinanceWebApp.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL) // conditional MFA fields are omitted when null
public class AuthResponse {
  private String token;
  private String role;
  private boolean passwordMustChange;

  /** Set (true) only when the password step succeeded but a second factor is required. */
  private Boolean mfaRequired;

  /** 5-min token to present to /api/auth/mfa/verify and /send-email-code. */
  private String mfaPendingToken;

  /** Enabled methods, e.g. ["TOTP", "EMAIL"] — drives the second-step UI. */
  private List<String> mfaMethods;
}
```

Add `@JsonInclude(JsonInclude.Include.NON_NULL)` (same import) on `MfaUpdateResponse` too.

- [ ] **Step 4: Add `MfaService.beginLoginChallenge`**

Add `private final JwtService jwtService;` to `MfaService`
(`dev.busato.FinanceWebApp.backend.security.JwtService`) and:

```java
  // ==================== LOGIN CHALLENGE ====================

  /** Called by AuthController after a correct password on an MFA-enabled account. */
  @Transactional
  public String beginLoginChallenge(User user) {
    challengeRepository.deleteByUserIdAndPurpose(user.getId(), MfaChallenge.Purpose.LOGIN);
    challengeRepository.save(
        MfaChallenge.builder()
            .userId(user.getId())
            .purpose(MfaChallenge.Purpose.LOGIN)
            .expiresAt(LocalDateTime.now().plusMinutes(LOGIN_CHALLENGE_MINUTES))
            .build());
    return jwtService.generateMfaPendingToken(user);
  }
```

- [ ] **Step 5: Branch in `AuthController.login`**

Inject `private final MfaService mfaService;` and insert right after
`User user = (User) authentication.getPrincipal();`:

```java
    // MFA-enabled accounts get a challenge instead of tokens; /api/auth/mfa/verify finishes login.
    if (user.isMfaEnabled()) {
      return ResponseEntity.ok(
          AuthResponse.builder()
              .mfaRequired(true)
              .mfaPendingToken(mfaService.beginLoginChallenge(user))
              .mfaMethods(mfaService.getEnabledMethods(user))
              .build());
    }
```

The rest of the method is unchanged.

- [ ] **Step 6: Run the tests and make sure they pass**

Run: `./gradlew test --tests "*.AuthControllerMfaTest"` then FULL `./gradlew test`
(existing `AuthControllerTest` and `MfaControllerTest` must stay green — check any
assertion that relied on null fields being serialized).
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/AuthResponse.java \
  backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/MfaUpdateResponse.java \
  backend/src/main/java/dev/busato/FinanceWebApp/backend/service/MfaService.java \
  backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/AuthController.java \
  backend/src/test/java/dev/busato/FinanceWebApp/backend/controller/AuthControllerMfaTest.java
git commit -m "feat(mfa): login returns an MFA challenge for enrolled accounts"
```

---

### Task 9: `POST /api/auth/mfa/verify` + `POST /api/auth/mfa/send-email-code`

**Files:**
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/MfaVerifyRequest.java`
- Create: `backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/MfaSendEmailRequest.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/MfaService.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/MfaController.java`
- Test: extend `MfaServiceTest` + `MfaControllerTest`

**Interfaces (Produces):**
- `MfaVerifyRequest { @NotBlank String pendingToken; @NotBlank String code; boolean rememberMe; }`
- `MfaSendEmailRequest { @NotBlank String pendingToken; }`
- `MfaService.verifyLoginCode(String pendingToken, String code) : User` — accepts TOTP →
  login email code → recovery code; counts attempts (>5 drops the challenge → user
  re-enters the password); wrong code → 401 `BadCredentialsException`.
- `MfaService.sendLoginEmailCode(String pendingToken)` — on-demand only, 60 s cooldown.
- `POST /verify` responds like a successful `/api/auth/login` (`AuthResponse` + refresh
  cookie honoring `rememberMe`).

- [ ] **Step 1: Write the failing service tests (extend `MfaServiceTest`)**

```java
  @org.junit.jupiter.api.Nested
  class LoginFlow {

    private String secret;
    private List<String> recoveryCodes;

    private String pendingToken;

    @BeforeEach
    void enableTotpAndStartLogin() throws Exception {
      TotpSetupResponse setup = mfaService.startTotpEnrollment(user);
      secret = setup.getSecret();
      recoveryCodes = mfaService.confirmTotpEnrollment(user, validCode(secret));
      pendingToken = mfaService.beginLoginChallenge(user);
    }

    @Test
    void verifyWithTotpCodeSucceedsInAFreshWindow() throws Exception {
      // The enrollment consumed the current 30s window (replay guard) — rewind the marker
      // to simulate a login that happens in a later window.
      user.setLastTotpTimestep(user.getLastTotpTimestep() - 2);
      userRepository.save(user);

      User verified = mfaService.verifyLoginCode(pendingToken, validCode(secret));
      assertEquals(user.getId(), verified.getId());
    }

    @Test
    void verifyWithRecoveryCodeSucceedsAndBurnsIt() {
      User verified = mfaService.verifyLoginCode(pendingToken, recoveryCodes.get(0));
      assertEquals(user.getId(), verified.getId());
      assertEquals(9, recoveryCodeRepository.countByUserId(user.getId()));
      // challenge consumed — a second verify needs a new login
      assertThrows(
          IllegalArgumentException.class,
          () -> mfaService.verifyLoginCode(pendingToken, recoveryCodes.get(1)));
    }

    @Test
    void wrongCodeThrowsAndCountsAttempts() {
      for (int i = 0; i < 5; i++) {
        assertThrows(
            BadCredentialsException.class,
            () -> mfaService.verifyLoginCode(pendingToken, "000000"));
      }
      // 6th attempt drops the challenge entirely
      assertThrows(
          IllegalArgumentException.class,
          () -> mfaService.verifyLoginCode(pendingToken, recoveryCodes.get(0)));
    }

    @Test
    void garbagePendingTokenIsRejected() {
      assertThrows(
          BadCredentialsException.class,
          () -> mfaService.verifyLoginCode("not-a-jwt", "123456"));
    }

    @Test
    void accessTokenIsNotAcceptedAsPendingToken() {
      // A normal access token must not open the MFA verify door
      String accessToken =
          jwtService.generateToken(new java.util.HashMap<>(), user);
      assertThrows(
          BadCredentialsException.class,
          () -> mfaService.verifyLoginCode(accessToken, recoveryCodes.get(0)));
    }

    @Test
    void emailCodePathWorks() throws Exception {
      // Enable email MFA too, then log in and ask for the emailed code
      mfaService.startEmailMfaEnrollment(user);
      org.mockito.ArgumentCaptor<String> captor = org.mockito.ArgumentCaptor.forClass(String.class);
      org.mockito.Mockito.verify(sendEmailService)
          .sendMfaCode(org.mockito.Mockito.eq("mfa@example.com"), captor.capture());
      mfaService.confirmEmailMfaEnrollment(user, captor.getValue());

      String freshPending = mfaService.beginLoginChallenge(user);
      mfaService.sendLoginEmailCode(freshPending);
      org.mockito.Mockito.verify(sendEmailService, org.mockito.Mockito.times(2))
          .sendMfaCode(org.mockito.Mockito.eq("mfa@example.com"), captor.capture());

      User verified = mfaService.verifyLoginCode(freshPending, captor.getValue());
      assertEquals(user.getId(), verified.getId());
    }

    @Test
    void sendLoginEmailCodeRequiresEmailMfa() {
      // Only TOTP is enabled here
      assertThrows(
          IllegalArgumentException.class, () -> mfaService.sendLoginEmailCode(pendingToken));
    }
  }
```

Add `@Autowired private dev.busato.FinanceWebApp.backend.security.JwtService jwtService;`
to the test class fields.

- [ ] **Step 2: Run to verify failure**

Run: `./gradlew test --tests "*.MfaServiceTest"` — FAILURE (methods missing).

- [ ] **Step 3: Implement in `MfaService`**

```java
  /** Sends the login email code — only on user request, never automatically (spec §1). */
  public void sendLoginEmailCode(String pendingToken) {
    User user = resolvePendingUser(pendingToken);
    if (!user.isEmailMfaEnabled())
      throw new IllegalArgumentException("Email codes are not enabled");
    requireActiveChallenge(user, MfaChallenge.Purpose.LOGIN);
    sendChallengeCode(user, MfaChallenge.Purpose.LOGIN, LOGIN_CHALLENGE_MINUTES);
  }

  /** Verifies the second factor and returns the user so the controller can issue real tokens. */
  public User verifyLoginCode(String pendingToken, String code) {
    User user = resolvePendingUser(pendingToken);
    MfaChallenge challenge = requireActiveChallenge(user, MfaChallenge.Purpose.LOGIN);
    registerAttempt(challenge);

    boolean valid =
        isTotpCodeValid(user, code)
            || isEmailChallengeCodeValid(user, MfaChallenge.Purpose.LOGIN, code)
            || consumeRecoveryCode(user, code);
    if (!valid) throw new BadCredentialsException("Invalid verification code");

    challengeRepository.deleteByUserIdAndPurpose(user.getId(), MfaChallenge.Purpose.LOGIN);
    return user;
  }

  /** Validates the mfa_pending JWT (type + signature + expiry + tokenVersion) → its user. */
  private User resolvePendingUser(String pendingToken) {
    if (pendingToken == null || !jwtService.isMfaPendingToken(pendingToken))
      throw new BadCredentialsException("Invalid or expired sign-in session");
    String username;
    try {
      username = jwtService.extractUsername(pendingToken);
    } catch (Exception e) {
      throw new BadCredentialsException("Invalid or expired sign-in session");
    }
    User user =
        userRepository
            .findByUsernameIgnoreCase(username)
            .orElseThrow(() -> new BadCredentialsException("Invalid or expired sign-in session"));
    if (!jwtService.isTokenValid(pendingToken, user))
      throw new BadCredentialsException("Invalid or expired sign-in session");
    return user;
  }
```

- [ ] **Step 4: Create the DTOs and controller endpoints**

`MfaVerifyRequest.java`:

```java
package dev.busato.FinanceWebApp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MfaVerifyRequest {
  @NotBlank private String pendingToken;
  @NotBlank private String code;
  private boolean rememberMe;
}
```

`MfaSendEmailRequest.java`:

```java
package dev.busato.FinanceWebApp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MfaSendEmailRequest {
  @NotBlank private String pendingToken;
}
```

In `MfaController`, add a login-flow section (above the settings one):

```java
  // ==================== LOGIN FLOW (public — self-authorized by the pending token) ====================

  @PostMapping("/verify")
  public ResponseEntity<AuthResponse> verify(
      @Valid @RequestBody MfaVerifyRequest request, HttpServletResponse response) {
    User user = mfaService.verifyLoginCode(request.getPendingToken(), request.getCode());

    Map<String, Object> extraClaims = new HashMap<>();
    extraClaims.put("role", user.getRole());
    extraClaims.put("userId", user.getId());
    String accessToken = jwtService.generateToken(extraClaims, user);
    refreshCookieService.addRefreshTokenCookie(
        response, jwtService.generateRefreshToken(user), request.isRememberMe());

    return ResponseEntity.ok(
        AuthResponse.builder()
            .token(accessToken)
            .role(String.valueOf(user.getRole()))
            .passwordMustChange(user.isPasswordMustChange())
            .build());
  }

  @PostMapping("/send-email-code")
  public ResponseEntity<Map<String, String>> sendEmailCode(
      @Valid @RequestBody MfaSendEmailRequest request) {
    mfaService.sendLoginEmailCode(request.getPendingToken());
    return ResponseEntity.ok(Map.of("message", "Verification code sent"));
  }
```

- [ ] **Step 5: Extend `MfaControllerTest`**

```java
  @Test
  void verifyIssuesTokensAndRefreshCookie() throws Exception {
    dev.busato.FinanceWebApp.backend.model.User verified = BaseWebMvcTest.mockUser;
    when(mfaService.verifyLoginCode(eq("pending"), eq("123456"))).thenReturn(verified);
    when(jwtService.generateToken(anyMap(), eq(verified))).thenReturn("real-access");
    when(jwtService.generateRefreshToken(verified)).thenReturn("real-refresh");

    mockMvc
        .perform(
            post("/api/auth/mfa/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    objectMapper.writeValueAsString(
                        Map.of("pendingToken", "pending", "code", "123456", "rememberMe", true))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").value("real-access"));

    org.mockito.Mockito.verify(refreshCookieService)
        .addRefreshTokenCookie(any(), eq("real-refresh"), eq(true));
  }

  @Test
  void verifyRequiresPendingTokenAndCode() throws Exception {
    mockMvc
        .perform(
            post("/api/auth/mfa/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("code", "123456"))))
        .andExpect(status().isBadRequest());
  }

  @Test
  void sendEmailCodeDelegates() throws Exception {
    mockMvc
        .perform(
            post("/api/auth/mfa/send-email-code")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("pendingToken", "pending"))))
        .andExpect(status().isOk());
    org.mockito.Mockito.verify(mfaService).sendLoginEmailCode("pending");
  }
```

- [ ] **Step 6: Run the tests and make sure they pass**

Run: `./gradlew test --tests "*.MfaServiceTest" --tests "*.MfaControllerTest"` then the
FULL `./gradlew test`. Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/MfaVerifyRequest.java \
  backend/src/main/java/dev/busato/FinanceWebApp/backend/dto/MfaSendEmailRequest.java \
  backend/src/main/java/dev/busato/FinanceWebApp/backend/service/MfaService.java \
  backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/MfaController.java \
  backend/src/test/java/dev/busato/FinanceWebApp/backend/
git commit -m "feat(mfa): verify + send-email-code endpoints complete the two-step login"
```

---

### Task 10: Admin MFA reset

**Files:**
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/service/MfaService.java`
- Modify: `backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/AdminUserController.java`
- Test: extend `MfaServiceTest` + `backend/src/test/java/dev/busato/FinanceWebApp/backend/controller/AdminUserControllerTest.java`

**Interfaces (Produces):**
- `MfaService.adminResetMfa(UUID userId)` — throws the existing `UserNotFoundException(UUID)`
  for unknown ids.
- `DELETE /api/admin/management/{id}/mfa` → 204 (ADMIN-only via the existing
  `/api/admin/**` rule in `SecurityConfig` — no new security config needed).

- [ ] **Step 1: Write the failing tests**

In `MfaServiceTest`:

```java
  @Test
  void adminResetWipesAllMfaState() throws Exception {
    TotpSetupResponse setup = mfaService.startTotpEnrollment(user);
    mfaService.confirmTotpEnrollment(
        user, totpCodeGenerator.generate(setup.getSecret(), Math.floorDiv(totpTimeProvider.getTime(), 30)));
    int versionBefore = user.getTokenVersion();

    mfaService.adminResetMfa(user.getId());

    User reloaded = userRepository.findById(user.getId()).orElseThrow();
    assertNull(reloaded.getTotpSecret());
    assertFalse(reloaded.isEmailMfaEnabled());
    assertEquals(0, recoveryCodeRepository.countByUserId(user.getId()));
    assertTrue(reloaded.getTokenVersion() > versionBefore); // sessions invalidated
  }

  @Test
  void adminResetUnknownUserThrows() {
    assertThrows(
        dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException.class,
        () -> mfaService.adminResetMfa(java.util.UUID.randomUUID()));
  }
```

In `AdminUserControllerTest`, mirror the existing tests' mocking style (the controller
already mocks `AdminUserInviteService`; add `@MockitoBean MfaService mfaService` if the
class doesn't have it) and add:

```java
  @Test
  void resetMfaReturns204() throws Exception {
    java.util.UUID id = java.util.UUID.randomUUID();
    mockMvc
        .perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete(
            "/api/admin/management/" + id + "/mfa"))
        .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.status()
            .isNoContent());
    org.mockito.Mockito.verify(mfaService).adminResetMfa(id);
  }
```

- [ ] **Step 2: Run to verify failure**

Run: `./gradlew test --tests "*.MfaServiceTest" --tests "*.AdminUserControllerTest"` — FAILURE.

- [ ] **Step 3: Implement**

In `MfaService` (import `UserNotFoundException`, `UUID`):

```java
  // ==================== ADMIN ====================

  /** Emergency reset for locked-out users: wipes every MFA factor and signs them out everywhere. */
  @Transactional
  public void adminResetMfa(UUID userId) {
    User user =
        userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));
    user.setTotpSecret(null);
    user.setEmailMfaEnabled(false);
    user.setLastTotpTimestep(null);
    userRepository.save(user);
    recoveryCodeRepository.deleteAllByUserId(userId);
    enrollmentRepository.deleteByUserId(userId);
    challengeRepository.deleteAllByUserId(userId);
    userService.invalidateSessions(user);
  }
```

In `AdminUserController` (inject `private final MfaService mfaService;`):

```java
  /** Emergency MFA reset (support path for users locked out of their second factor). */
  @DeleteMapping("/{id}/mfa")
  public ResponseEntity<Void> resetMfa(@PathVariable UUID id) {
    mfaService.adminResetMfa(id);
    return ResponseEntity.noContent().build();
  }
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run the two test classes, then FULL `./gradlew test`, then the coverage/format gate:
`./gradlew spotlessApply check`. Backend is now feature-complete — fix any coverage gap
**by adding tests, not by exclusions**.
Expected: `check` PASS (≥90 % line coverage).

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/dev/busato/FinanceWebApp/backend/service/MfaService.java \
  backend/src/main/java/dev/busato/FinanceWebApp/backend/controller/AdminUserController.java \
  backend/src/test/java/dev/busato/FinanceWebApp/backend/
git commit -m "feat(mfa): admin MFA reset endpoint"
```

---

## Phase D — Ops / env plumbing

### Task 11: Wire `MFA_ENCRYPTION_KEY` through every deployment path

**Files:**
- Modify: `.env` (repo root — NOT committed; it is the live local env)
- Modify: `docker-compose.yml`
- Modify: `docker-compose.prod.yml`
- Modify: `.github/workflows/deploy.yml` (only if it materializes env vars from secrets)

**Steps (config mirroring — copy exactly how `JWT_SECRET_KEY` flows):**

- [ ] **Step 1:** Generate a real key and append to the root `.env`:

```bash
echo "MFA_ENCRYPTION_KEY=$(openssl rand -base64 32)" >> .env
```

- [ ] **Step 2:** Find how the backend service receives `JWT_SECRET_KEY` in
`docker-compose.yml` and `docker-compose.prod.yml` (`grep -n JWT_SECRET_KEY docker-compose*.yml`).
If the backend service lists env vars explicitly, add `MFA_ENCRYPTION_KEY` the same way;
if it uses `env_file: .env`, nothing to add — verify and note it in the commit message.

- [ ] **Step 3:** Same for CI/CD: `grep -n JWT_SECRET_KEY .github/workflows/deploy.yml`.
If the workflow writes `.env` from GitHub secrets, add the `MFA_ENCRYPTION_KEY` line and
**tell the user** they must create the corresponding GitHub secret (value from
`openssl rand -base64 32` — must differ from the local one). ⚠️ Rotating/losing this key
makes every stored TOTP secret undecryptable (users would re-enroll via admin reset) —
say this in the PR/handoff notes.

- [ ] **Step 4:** Restart the dev stack (`docker-compose up -d backend`) or the local
`bootRun` and confirm the backend boots (the crypto service fails fast on a bad key).

- [ ] **Step 5: Commit** (compose/workflow changes only — never commit `.env`):

```bash
git add docker-compose.yml docker-compose.prod.yml .github/workflows/deploy.yml
git commit -m "chore(mfa): wire MFA_ENCRYPTION_KEY through compose and deploy"
```

## Phase E — Frontend: login second step

### Task 12: `authStorage` helper (extract token persistence)

**Files:**
- Create: `frontend/src/auth/authStorage.ts`
- Modify: `frontend/src/auth/LoginForm.tsx:86-87` (use the helper — behavior-invariant)
- Test: `frontend/src/__tests__/auth/authStorage.test.ts`

**Interfaces (Produces):**
- `storeAuthToken(token: string, remember: boolean): void`
- `replaceStoredToken(token: string): void` — overwrites the JWT wherever it currently lives.
- `isRemembered(): boolean` — true when the JWT sits in `localStorage`.

- [ ] **Step 1: Write the failing test**

```ts
import { beforeEach, describe, expect, it } from "vitest";
import {
  isRemembered,
  replaceStoredToken,
  storeAuthToken,
} from "../../auth/authStorage";

describe("authStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("stores in localStorage when remembered", () => {
    storeAuthToken("tok", true);
    expect(localStorage.getItem("jwtToken")).toBe("tok");
    expect(sessionStorage.getItem("jwtToken")).toBeNull();
    expect(isRemembered()).toBe(true);
  });

  it("stores in sessionStorage otherwise", () => {
    storeAuthToken("tok", false);
    expect(sessionStorage.getItem("jwtToken")).toBe("tok");
    expect(localStorage.getItem("jwtToken")).toBeNull();
    expect(isRemembered()).toBe(false);
  });

  it("replaceStoredToken keeps the current location", () => {
    storeAuthToken("old", true);
    replaceStoredToken("new");
    expect(localStorage.getItem("jwtToken")).toBe("new");

    localStorage.clear();
    storeAuthToken("old", false);
    replaceStoredToken("new2");
    expect(sessionStorage.getItem("jwtToken")).toBe("new2");
    expect(localStorage.getItem("jwtToken")).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npm test` → module not found.

- [ ] **Step 3: Implement `authStorage.ts`**

```ts
const TOKEN_KEY = "jwtToken";

/** Persists the JWT where the "Remember me" choice dictates (local vs session storage). */
export function storeAuthToken(token: string, remember: boolean): void {
  if (remember) localStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.setItem(TOKEN_KEY, token);
}

/**
 * Overwrites the JWT wherever it currently lives. Used when the backend rotates the token
 * (enabling/disabling MFA bumps tokenVersion and returns a fresh one).
 */
export function replaceStoredToken(token: string): void {
  if (localStorage.getItem(TOKEN_KEY) !== null) localStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.setItem(TOKEN_KEY, token);
}

/** True when the JWT sits in localStorage (the user chose "Remember me" at login). */
export function isRemembered(): boolean {
  return localStorage.getItem(TOKEN_KEY) !== null;
}
```

- [ ] **Step 4: Use it in `LoginForm.tsx`** — replace

```tsx
      if (remember) localStorage.setItem("jwtToken", token);
      else sessionStorage.setItem("jwtToken", token);
```

with `storeAuthToken(token, remember);` (add the import
`import { storeAuthToken } from "./authStorage";`).

- [ ] **Step 5: Verify** — `npm run lint && npm test && npm run build`. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/auth/authStorage.ts frontend/src/auth/LoginForm.tsx \
  frontend/src/__tests__/auth/authStorage.test.ts
git commit -m "refactor(auth): extract token persistence into authStorage helper"
```

---

### Task 13: `MfaVerifyStep` + `LoginForm` wiring + axios interceptor guard

**Files:**
- Create: `frontend/src/auth/MfaVerifyStep.tsx`
- Modify: `frontend/src/auth/LoginForm.tsx`
- Modify: `frontend/src/api/axiosConfig.ts` (request public list + response 401 guard)
- Test: `frontend/src/__tests__/auth/MfaVerifyStep.test.tsx`

**Interfaces:**
- Consumes: backend contract from Task 8/9 (`mfaRequired`, `mfaPendingToken`,
  `mfaMethods`; `POST /auth/mfa/verify`, `POST /auth/mfa/send-email-code`);
  `storeAuthToken` from Task 12.
- Produces: `<MfaVerifyStep pendingToken methods rememberMe onSuccess(token, passwordMustChange) onBack />`.

**⚠️ Interceptor guard (required):** a 401 from `/auth/mfa/verify` means "wrong code",
not "expired session". Without a guard the response interceptor fires the refresh flow
(no cookie at the login screen) and kicks the user off the MFA step.

- [ ] **Step 1: Patch `axiosConfig.ts`**

Add the two endpoints to the `publicEndpoints` array in the request interceptor:

```ts
    const publicEndpoints = [
      "/auth/login",
      "/auth/register",
      "/auth/demo",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/mfa/verify",
      "/auth/mfa/send-email-code",
    ];
```

In the response interceptor, extend the auto-refresh condition (around
`if (error.response?.status === 401 && !config._retry)`) so those same two URLs are
excluded:

```ts
    // MFA login-flow endpoints authorize via the pending token in the body: a 401 there
    // means "wrong code", never "expired session" — the refresh flow must not run.
    const isMfaLoginEndpoint =
      config.url?.includes("/auth/mfa/verify") ||
      config.url?.includes("/auth/mfa/send-email-code");

    if (error.response?.status === 401 && !config._retry && !isMfaLoginEndpoint) {
```

(Adapt to the exact existing condition shape; do not change anything else in the flow.)

- [ ] **Step 2: Write the failing test**

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MfaVerifyStep } from "../../auth/MfaVerifyStep";

const post = vi.fn();
vi.mock("../../api/axiosConfig", () => ({
  default: { post: (...args: unknown[]) => post(...args) },
}));

describe("MfaVerifyStep", () => {
  const onSuccess = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    post.mockReset();
    onSuccess.mockReset();
    onBack.mockReset();
  });

  const renderStep = (methods: string[] = ["TOTP", "EMAIL"]) =>
    render(
      <MfaVerifyStep
        pendingToken="pending"
        methods={methods}
        rememberMe={true}
        onSuccess={onSuccess}
        onBack={onBack}
      />,
    );

  it("submits the code and reports success", async () => {
    post.mockResolvedValueOnce({
      data: { token: "real", passwordMustChange: false },
    });
    renderStep();

    fireEvent.change(screen.getByLabelText("Verification code"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /verify/i }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/auth/mfa/verify", {
        pendingToken: "pending",
        code: "123456",
        rememberMe: true,
      }),
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("real", false));
  });

  it("offers the email code only when enabled and applies a cooldown", async () => {
    post.mockResolvedValueOnce({ data: { message: "sent" } });
    renderStep();

    const sendBtn = screen.getByRole("button", { name: /send code by email/i });
    fireEvent.click(sendBtn);
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/auth/mfa/send-email-code", {
        pendingToken: "pending",
      }),
    );
    expect(await screen.findByText(/resend in/i)).toBeTruthy();
  });

  it("hides the email option when the method is not enabled", () => {
    renderStep(["TOTP"]);
    expect(screen.queryByRole("button", { name: /send code by email/i })).toBeNull();
  });

  it("switches to recovery-code mode", () => {
    renderStep();
    fireEvent.click(screen.getByRole("button", { name: /use a recovery code/i }));
    expect(screen.getByPlaceholderText("XXXX-XXXX")).toBeTruthy();
  });

  it("goes back to the credentials step", () => {
    renderStep();
    fireEvent.click(screen.getByRole("button", { name: /back to sign in/i }));
    expect(onBack).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run to verify failure** — `npm test` → module not found.

- [ ] **Step 4: Implement `MfaVerifyStep.tsx`**

Same dark glass card as `LoginForm` (auth screens are always dark — style.md):

```tsx
import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKey, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import api from "../api/axiosConfig";
import { triggerToast } from "../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../utils/apiError";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";

interface MfaVerifyStepProps {
  pendingToken: string;
  /** Enabled methods from the login response, e.g. ["TOTP", "EMAIL"]. */
  methods: string[];
  rememberMe: boolean;
  onSuccess: (token: string, passwordMustChange: boolean) => void;
  /** Return to the credentials step (also used when the challenge dies). */
  onBack: () => void;
}

const RESEND_COOLDOWN_S = 60;

export const MfaVerifyStep: React.FC<MfaVerifyStepProps> = ({
  pendingToken,
  methods,
  rememberMe,
  onSuccess,
  onBack,
}) => {
  const [code, setCode] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const emailAvailable = methods.includes("EMAIL");

  useEffect(() => {
    inputRef.current?.focus();
  }, [recoveryMode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const failFeedback = (err: unknown, fallback: string) => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
    triggerToast(getApiErrorTitle(err, fallback), false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || loading) return;
    setLoading(true);
    try {
      const response = await api.post("/auth/mfa/verify", {
        pendingToken,
        code: code.trim(),
        rememberMe,
      });
      onSuccess(response.data.token, response.data.passwordMustChange);
    } catch (err: unknown) {
      failFeedback(err, "Verification failed.");
      // 400 = flow error (challenge expired / too many attempts) → restart from password
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 400) onBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (sending || cooldown > 0) return;
    setSending(true);
    try {
      await api.post("/auth/mfa/send-email-code", { pendingToken });
      triggerToast("Code sent — check your inbox.", true);
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err: unknown) {
      failFeedback(err, "Could not send the code.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative z-10 flex w-full max-w-[400px] flex-col">
      <form
        className={`flex w-full flex-col rounded-[var(--r-card)] border border-white/10 bg-[rgba(23,18,38,0.55)] p-7 shadow-[0_24px_60px_-26px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:p-9 ${
          shake ? "animate-[shake_0.5s_ease-in-out]" : ""
        }`}
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[var(--r-input)] bg-gradient-to-tr from-[var(--brand-1)] to-[var(--brand-2)]">
          <FontAwesomeIcon icon={faShieldHalved} className="text-xl text-white" />
        </div>

        <h1 className="mb-1 text-2xl font-bold tracking-tight text-app-text">
          Two-factor verification
        </h1>
        <p className="mb-7 text-sm text-app-muted">
          {recoveryMode
            ? "Enter one of your recovery codes."
            : "Enter the 6-digit code from your authenticator app."}
        </p>

        <div className="mb-6">
          <Input
            ref={inputRef}
            type="text"
            inputMode={recoveryMode ? "text" : "numeric"}
            autoComplete="one-time-code"
            placeholder={recoveryMode ? "XXXX-XXXX" : "123456"}
            aria-label="Verification code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            leadingIcon={<FontAwesomeIcon icon={faKey} />}
          />
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth ripple disabled={loading}>
          {loading ? "Verifying…" : "Verify"}
        </Button>

        <div className="mt-5 flex flex-col items-start gap-2 text-sm">
          {emailAvailable && !recoveryMode && (
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={sending || cooldown > 0}
              className="cursor-pointer border-none bg-transparent font-medium text-app-muted transition-colors hover:text-app-text hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Send code by email"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setRecoveryMode((m) => !m);
              setCode("");
            }}
            className="cursor-pointer border-none bg-transparent font-medium text-app-muted transition-colors hover:text-app-text hover:underline"
          >
            {recoveryMode ? "Use an authenticator code" : "Use a recovery code"}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer border-none bg-transparent font-medium text-app-muted transition-colors hover:text-app-text hover:underline"
          >
            Back to sign in
          </button>
        </div>
      </form>
    </div>
  );
};
```

Check the actual `Input` component API before finishing: if it exposes
`onChange(value: string)` instead of a DOM event (compare with its use in
`SecuritySection`/`LoginForm`), adapt the handler accordingly.

- [ ] **Step 5: Wire `LoginForm.tsx`**

Add state + branch (imports: `MfaVerifyStep`, `storeAuthToken` already there):

```tsx
  const [mfa, setMfa] = useState<{ pendingToken: string; methods: string[] } | null>(null);

  const finishLogin = (token: string, passwordMustChange: boolean) => {
    localStorage.setItem("mustChangePWD", JSON.stringify(passwordMustChange));
    storeAuthToken(token, remember);
    navigate(returnTo);
  };
```

In `handleSubmit`'s success path, replace the token-storage + navigate block with:

```tsx
      const { token, passwordMustChange, mfaRequired, mfaPendingToken, mfaMethods } =
        response.data;

      if (mfaRequired) {
        setMfa({ pendingToken: mfaPendingToken, methods: mfaMethods ?? [] });
        return;
      }

      finishLogin(token, passwordMustChange);
```

And at the top of the returned JSX:

```tsx
  if (mfa) {
    return (
      <MfaVerifyStep
        pendingToken={mfa.pendingToken}
        methods={mfa.methods}
        rememberMe={remember}
        onSuccess={finishLogin}
        onBack={() => setMfa(null)}
      />
    );
  }
```

- [ ] **Step 6: Verify** — `npm run lint && npm test && npm run build`, then manually:
`npm run dev` should already be running — log in with a non-MFA user and confirm nothing
changed. Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/auth/MfaVerifyStep.tsx frontend/src/auth/LoginForm.tsx \
  frontend/src/api/axiosConfig.ts frontend/src/__tests__/auth/MfaVerifyStep.test.tsx
git commit -m "feat(mfa): two-step login UI with email fallback and recovery codes"
```

---

## Phase F — Frontend: settings (enroll / disable / recovery)

### Task 14: `mfaLogic` pure helpers + `useMfaStatus` hook

**Files:**
- Create: `frontend/src/settings/sections/mfa/mfaLogic.ts`
- Create: `frontend/src/settings/sections/mfa/useMfaStatus.ts`
- Test: `frontend/src/__tests__/settings/sections/mfa/mfaLogic.test.ts`

**Interfaces (Produces):**
- `isTotpCode(v: string): boolean` (6 digits, spaces tolerated),
  `isRecoveryCode(v: string): boolean` (`XXXX-XXXX`),
  `formatRecoveryCodesFile(codes: string[]): string`.
- `useMfaStatus(): { status: MfaStatus | null; loading: boolean; refresh: () => Promise<void> }`
  with `MfaStatus = { totpEnabled: boolean; emailMfaEnabled: boolean; recoveryCodesRemaining: number }`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import {
  formatRecoveryCodesFile,
  isRecoveryCode,
  isTotpCode,
} from "../../../../settings/sections/mfa/mfaLogic";

describe("mfaLogic", () => {
  it("recognizes TOTP codes", () => {
    expect(isTotpCode("123456")).toBe(true);
    expect(isTotpCode("123 456")).toBe(true);
    expect(isTotpCode("12345")).toBe(false);
    expect(isTotpCode("ABCDEF")).toBe(false);
  });

  it("recognizes recovery codes", () => {
    expect(isRecoveryCode("ABCD-2345")).toBe(true);
    expect(isRecoveryCode("abcd-2345")).toBe(true); // normalized to uppercase
    expect(isRecoveryCode("ABCD2345")).toBe(false);
    expect(isRecoveryCode("AB-CD")).toBe(false);
  });

  it("formats the download file with one code per line", () => {
    const file = formatRecoveryCodesFile(["AAAA-AAAA", "BBBB-BBBB"]);
    expect(file).toContain("AAAA-AAAA\nBBBB-BBBB");
    expect(file).toContain("recovery codes");
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npm test` → module not found.

- [ ] **Step 3: Implement `mfaLogic.ts`**

```ts
/** True for a 6-digit authenticator code ("123 456" tolerated). */
export function isTotpCode(value: string): boolean {
  return /^\d{6}$/.test(value.replace(/\s/g, ""));
}

/** True for a recovery code in XXXX-XXXX format (case-insensitive). */
export function isRecoveryCode(value: string): boolean {
  return /^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(value.trim().toUpperCase());
}

/** Plain-text payload for the "Download codes" action. */
export function formatRecoveryCodesFile(codes: string[]): string {
  return [
    "FinanceWebApp — MFA recovery codes",
    "Each code can be used exactly once. Keep them somewhere safe.",
    "",
    ...codes,
    "",
  ].join("\n");
}
```

- [ ] **Step 4: Implement `useMfaStatus.ts`**

```ts
import { useCallback, useEffect, useState } from "react";
import api from "../../../api/axiosConfig";

export interface MfaStatus {
  totpEnabled: boolean;
  emailMfaEnabled: boolean;
  recoveryCodesRemaining: number;
}

/** Loads (and re-loads) the account's MFA state for the Security section. */
export function useMfaStatus() {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get("/auth/mfa/status");
      setStatus(res.data);
    } catch {
      setStatus(null); // section falls back to "unavailable" rendering
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, loading, refresh };
}
```

- [ ] **Step 5: Verify** — `npm run lint && npm test && npm run build`. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/settings/sections/mfa/ \
  frontend/src/__tests__/settings/sections/mfa/mfaLogic.test.ts
git commit -m "feat(mfa): settings MFA logic helpers and status hook"
```

---

### Task 15: `RecoveryCodesView` + `TotpEnrollWizard`

**Files:**
- Create: `frontend/src/settings/sections/mfa/RecoveryCodesView.tsx`
- Create: `frontend/src/settings/sections/mfa/TotpEnrollWizard.tsx`
- Test: `frontend/src/__tests__/settings/sections/mfa/TotpEnrollWizard.test.tsx`

**Interfaces:**
- Consumes: `WizardShell` + `Wizard` from `components/ui/` (read both files first —
  `Wizard` takes `steps: WizardStep[]`, `onComplete: () => Promise<T>`,
  `renderCompletion: (state) => ReactNode`), `isTotpCode`/`formatRecoveryCodesFile`
  (Task 14), `replaceStoredToken`/`isRemembered` (Task 12).
- Produces:
  `<RecoveryCodesView codes={string[]} onDone={() => void} />` (also reused by Task 16),
  `<TotpEnrollWizard open onClose onEnrolled />`.

- [ ] **Step 1: Implement `RecoveryCodesView.tsx`**

```tsx
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faDownload } from "@fortawesome/free-solid-svg-icons";
import Button from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";
import { triggerToast } from "../../../components/ui/ToastNotification";
import { formatRecoveryCodesFile } from "./mfaLogic";

interface RecoveryCodesViewProps {
  codes: string[];
  onDone: () => void;
}

/** One-time display of freshly generated recovery codes (they are never shown again). */
export function RecoveryCodesView({ codes, onDone }: RecoveryCodesViewProps) {
  const [saved, setSaved] = useState(false);

  const copyAll = async () => {
    await navigator.clipboard.writeText(codes.join("\n"));
    triggerToast("Recovery codes copied to clipboard.", true);
  };

  const download = () => {
    const blob = new Blob([formatRecoveryCodesFile(codes)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finance-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-lg font-bold text-app-text">Save your recovery codes</h3>
        <p className="mt-1 text-sm text-app-muted">
          Each code signs you in once if you lose access to your other methods. They are
          shown only now — store them somewhere safe.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 rounded-[var(--r-input)] border border-app-border bg-app-input p-4 font-app-mono text-sm text-app-text sm:grid-cols-2">
        {codes.map((code) => (
          <span key={code}>{code}</span>
        ))}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" size="sm" onClick={copyAll}>
          <FontAwesomeIcon icon={faCopy} /> Copy all
        </Button>
        <Button variant="secondary" size="sm" onClick={download}>
          <FontAwesomeIcon icon={faDownload} /> Download .txt
        </Button>
      </div>

      <Checkbox
        state={saved}
        onChange={() => setSaved(!saved)}
        size="sm"
        label="I saved these codes somewhere safe"
        aria-label="I saved these codes somewhere safe"
      />

      <Button variant="primary" disabled={!saved} onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Implement `TotpEnrollWizard.tsx`**

```tsx
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCopy,
  faQrcode,
  faShieldHalved,
  faSpinner,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../../api/axiosConfig";
import Button from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Wizard, type WizardStep } from "../../../components/ui/Wizard";
import WizardShell from "../../../components/ui/WizardShell";
import { triggerToast } from "../../../components/ui/ToastNotification";
import { getApiErrorDetail } from "../../../utils/apiError";
import { isRemembered, replaceStoredToken } from "../../../auth/authStorage";
import { isTotpCode } from "./mfaLogic";
import { RecoveryCodesView } from "./RecoveryCodesView";

interface TotpSetup {
  secret: string;
  otpauthUri: string;
  qrDataUri: string;
}

interface TotpEnrollWizardProps {
  open: boolean;
  onClose: () => void;
  /** Fired after a successful enrollment so the section refreshes its status. */
  onEnrolled: () => void;
}

export function TotpEnrollWizard({ open, onClose, onEnrolled }: TotpEnrollWizardProps) {
  const [setup, setSetup] = useState<TotpSetup | null>(null);
  const [code, setCode] = useState("");

  // Each open starts a fresh enrollment (the backend replaces any pending one).
  useEffect(() => {
    if (!open) return;
    setSetup(null);
    setCode("");
    api
      .post("/auth/mfa/totp/setup")
      .then((res) => setSetup(res.data))
      .catch((err: unknown) => {
        triggerToast(getApiErrorDetail(err, "Could not start the setup"), false);
        onClose();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when opened
  }, [open]);

  const steps: WizardStep[] = [
    {
      name: "Scan",
      icon: faQrcode,
      mandatory: true,
      isComplete: setup !== null,
      nextLabel: "Continue",
      content: setup ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <img
            src={setup.qrDataUri}
            alt="TOTP QR code"
            className="h-48 w-48 rounded-[var(--r-input)] bg-white p-2"
          />
          <p className="max-w-sm text-center text-sm text-app-muted">
            Scan with Google Authenticator, Authy or any TOTP app — or enter the key
            manually:
          </p>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(setup.secret);
              triggerToast("Secret copied.", true);
            }}
            className="flex items-center gap-2 rounded-[var(--r-input)] border border-app-border bg-app-input px-3 py-2 font-app-mono text-sm text-app-text transition-colors hover:bg-app-hover"
          >
            {setup.secret} <FontAwesomeIcon icon={faCopy} className="text-app-muted" />
          </button>
        </div>
      ) : (
        <div className="flex justify-center py-10 text-app-muted">
          <FontAwesomeIcon icon={faSpinner} spin size="lg" />
        </div>
      ),
    },
    {
      name: "Verify",
      icon: faShieldHalved,
      mandatory: true,
      isComplete: isTotpCode(code),
      nextLabel: "Enable",
      content: (
        <div className="flex flex-col items-center gap-4 py-6">
          <p className="max-w-sm text-center text-sm text-app-muted">
            Enter the 6-digit code your app shows right now to confirm the pairing.
          </p>
          <div className="w-48">
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              aria-label="Authenticator code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
        </div>
      ),
    },
  ];

  const handleComplete = async (): Promise<string[] | undefined> => {
    const res = await api.post("/auth/mfa/totp/confirm", {
      code: code.trim(),
      rememberMe: isRemembered(),
    });
    replaceStoredToken(res.data.token); // tokenVersion was bumped — swap in the fresh JWT
    onEnrolled();
    return res.data.recoveryCodes;
  };

  if (!open) return null;

  return (
    <WizardShell
      open={open}
      title="Set up authenticator app"
      subtitle="Add a rotating 6-digit code as a second sign-in step"
      onClose={onClose}
    >
      <Wizard<string[] | undefined>
        steps={steps}
        onComplete={handleComplete}
        renderCompletion={({ status, result, error, goToStep }) => {
          if (status === "processing")
            return (
              <div className="flex justify-center py-12 text-app-muted">
                <FontAwesomeIcon icon={faSpinner} spin size="lg" />
              </div>
            );
          if (status === "error")
            return (
              <div className="flex flex-col items-center gap-4 py-8">
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  className="text-2xl text-app-yellow"
                />
                <p className="text-sm text-app-muted">
                  {getApiErrorDetail(error, "That code didn't work — try again.")}
                </p>
                <Button variant="secondary" onClick={() => goToStep(1)}>
                  Try again
                </Button>
              </div>
            );
          return result && result.length > 0 ? (
            <RecoveryCodesView codes={result} onDone={onClose} />
          ) : (
            <div className="flex flex-col items-center gap-4 py-8">
              <FontAwesomeIcon icon={faCircleCheck} className="text-2xl text-app-green" />
              <p className="text-sm text-app-text">Authenticator app enabled.</p>
              <Button variant="primary" onClick={onClose}>
                Done
              </Button>
            </div>
          );
        }}
      />
    </WizardShell>
  );
}
```

Before finishing, open `components/ui/Wizard.tsx` and `WizardShell.tsx` and align exact
prop names/typing (e.g. `WizardStep.nextLabelIncomplete` requirements, generic
signature) and the `Input` `onChange` contract, mirroring how the wallet-creation wizard
consumes them.

- [ ] **Step 3: Write the test**

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TotpEnrollWizard } from "../../../../settings/sections/mfa/TotpEnrollWizard";

const post = vi.fn();
vi.mock("../../../../api/axiosConfig", () => ({
  default: { post: (...args: unknown[]) => post(...args) },
}));

describe("TotpEnrollWizard", () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue({
      data: {
        secret: "SECRET123",
        otpauthUri: "otpauth://totp/x",
        qrDataUri: "data:image/png;base64,abc",
      },
    });
    // WizardShell portals into #modal-root when present
    document.body.innerHTML = '<div id="modal-root"></div>';
  });

  it("starts the enrollment and shows the QR", async () => {
    render(<TotpEnrollWizard open onClose={vi.fn()} onEnrolled={vi.fn()} />);

    await waitFor(() => expect(post).toHaveBeenCalledWith("/auth/mfa/totp/setup"));
    const qr = (await screen.findByAltText("TOTP QR code")) as HTMLImageElement;
    expect(qr.src).toContain("data:image/png;base64,abc");
    expect(screen.getByText("SECRET123")).toBeTruthy();
  });

  it("does not fetch when closed", () => {
    render(<TotpEnrollWizard open={false} onClose={vi.fn()} onEnrolled={vi.fn()} />);
    expect(post).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Verify** — `npm run lint && npm test && npm run build`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/settings/sections/mfa/ \
  frontend/src/__tests__/settings/sections/mfa/TotpEnrollWizard.test.tsx
git commit -m "feat(mfa): TOTP enrollment wizard with recovery-codes completion screen"
```

### Task 16: `EmailMfaEnableModal`, `MfaDisableModal`, `RegenerateCodesModal`

**Files:**
- Create: `frontend/src/settings/sections/mfa/EmailMfaEnableModal.tsx`
- Create: `frontend/src/settings/sections/mfa/MfaDisableModal.tsx`
- Create: `frontend/src/settings/sections/mfa/RegenerateCodesModal.tsx`
- Test: `frontend/src/__tests__/settings/sections/mfa/EmailMfaEnableModal.test.tsx`

**Interfaces:**
- Consumes: `modals/common/ModalDialog` (house shell — before coding, read it plus one
  existing consumer to copy the exact open/close mechanics of the native `<dialog>`),
  `RecoveryCodesView` (Task 15), `replaceStoredToken`/`isRemembered` (Task 12).
- Produces:
  `<EmailMfaEnableModal open onClose onEnrolled />`,
  `<MfaDisableModal open method={"totp"|"email"} emailCodeAvailable onClose onDisabled />`,
  `<RegenerateCodesModal open onClose onRegenerated />`.

- [ ] **Step 1: Implement `EmailMfaEnableModal.tsx`**

Three phases in one `ModalDialog`: *intro* (explain + Send code) → *verify* (code input,
resend with 60 s cooldown) → *recovery* (only when the backend returned fresh codes).

```tsx
import { useEffect, useState } from "react";
import api from "../../../api/axiosConfig";
import Button from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { ModalDialog } from "../../../modals/common/ModalDialog";
import { triggerToast } from "../../../components/ui/ToastNotification";
import { getApiErrorDetail } from "../../../utils/apiError";
import { isRemembered, replaceStoredToken } from "../../../auth/authStorage";
import { isTotpCode } from "./mfaLogic";
import { RecoveryCodesView } from "./RecoveryCodesView";

interface EmailMfaEnableModalProps {
  open: boolean;
  onClose: () => void;
  onEnrolled: () => void;
}

export function EmailMfaEnableModal({ open, onClose, onEnrolled }: EmailMfaEnableModalProps) {
  const [phase, setPhase] = useState<"intro" | "verify" | "recovery">("intro");
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (open) {
      setPhase("intro");
      setCode("");
      setCodes([]);
      setCooldown(0);
    }
  }, [open]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const sendCode = async () => {
    if (busy || cooldown > 0) return;
    setBusy(true);
    try {
      await api.post("/auth/mfa/email/setup");
      setPhase("verify");
      setCooldown(60);
      triggerToast("Code sent — check your inbox.", true);
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Could not send the code"), false);
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (busy || !isTotpCode(code)) return;
    setBusy(true);
    try {
      const res = await api.post("/auth/mfa/email/confirm", {
        code: code.trim(),
        rememberMe: isRemembered(),
      });
      replaceStoredToken(res.data.token); // tokenVersion bumped — swap in the fresh JWT
      onEnrolled();
      if (res.data.recoveryCodes?.length) {
        setCodes(res.data.recoveryCodes);
        setPhase("recovery");
      } else {
        triggerToast("Email codes enabled.", true);
        onClose();
      }
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Invalid code"), false);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <ModalDialog
      title="Enable email codes"
      subtitle="Receive a one-time code by email when signing in"
      onCloseClick={onClose}
      onClose={onClose}
      footer={
        phase === "intro" ? (
          <Button variant="primary" disabled={busy} onClick={sendCode}>
            Send verification code
          </Button>
        ) : phase === "verify" ? (
          <Button variant="primary" disabled={busy || !isTotpCode(code)} onClick={confirm}>
            Enable email codes
          </Button>
        ) : undefined
      }
    >
      {phase === "intro" && (
        <p className="text-sm text-app-muted">
          We'll send a 6-digit code to your account email to make sure delivery works
          before enabling this method.
        </p>
      )}
      {phase === "verify" && (
        <div className="flex flex-col gap-3">
          <Input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            aria-label="Email verification code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            type="button"
            onClick={sendCode}
            disabled={busy || cooldown > 0}
            className="self-start border-none bg-transparent text-sm font-medium text-app-muted transition-colors hover:text-app-text hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </div>
      )}
      {phase === "recovery" && <RecoveryCodesView codes={codes} onDone={onClose} />}
    </ModalDialog>
  );
}
```

- [ ] **Step 2: Implement `MfaDisableModal.tsx`**

```tsx
import { useEffect, useState } from "react";
import api from "../../../api/axiosConfig";
import Button from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { ModalDialog } from "../../../modals/common/ModalDialog";
import { PasswordInput } from "../../../modals/auth/PasswordInput";
import { faKey } from "@fortawesome/free-solid-svg-icons";
import { triggerToast } from "../../../components/ui/ToastNotification";
import { getApiErrorDetail } from "../../../utils/apiError";
import { isRemembered, replaceStoredToken } from "../../../auth/authStorage";

interface MfaDisableModalProps {
  open: boolean;
  /** Which method is being disabled — picks the endpoint and the copy. */
  method: "totp" | "email";
  /** Show the "Email me a code" shortcut (email MFA currently enabled). */
  emailCodeAvailable: boolean;
  onClose: () => void;
  onDisabled: () => void;
}

const LABELS = {
  totp: "authenticator app",
  email: "email codes",
} as const;

export function MfaDisableModal({
  open,
  method,
  emailCodeAvailable,
  onClose,
  onDisabled,
}: MfaDisableModalProps) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (open) {
      setPassword("");
      setCode("");
      setCooldown(0);
    }
  }, [open]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const sendCode = async () => {
    if (busy || cooldown > 0) return;
    try {
      await api.post("/auth/mfa/email/send-settings-code");
      setCooldown(60);
      triggerToast("Code sent — check your inbox.", true);
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Could not send the code"), false);
    }
  };

  const submit = async () => {
    if (busy || !password || !code.trim()) return;
    setBusy(true);
    try {
      const res = await api.post(`/auth/mfa/${method}/disable`, {
        password,
        code: code.trim(),
        rememberMe: isRemembered(),
      });
      replaceStoredToken(res.data.token);
      triggerToast(res.data.message ?? "Disabled.", true);
      onDisabled();
      onClose();
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Could not disable"), false);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <ModalDialog
      title={`Disable ${LABELS[method]}?`}
      subtitle="Confirm with your password and a valid code"
      onCloseClick={onClose}
      onClose={onClose}
      footer={
        <Button variant="danger" disabled={busy || !password || !code.trim()} onClick={submit}>
          Disable
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <PasswordInput
          label="Current password"
          placeholder="Enter current password"
          value={password}
          icon={faKey}
          onChange={setPassword}
        />
        <Input
          type="text"
          autoComplete="one-time-code"
          placeholder="Authenticator, email or recovery code"
          aria-label="Verification code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        {emailCodeAvailable && (
          <button
            type="button"
            onClick={sendCode}
            disabled={cooldown > 0}
            className="self-start border-none bg-transparent text-sm font-medium text-app-muted transition-colors hover:text-app-text hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Email me a code"}
          </button>
        )}
      </div>
    </ModalDialog>
  );
}
```

- [ ] **Step 3: Implement `RegenerateCodesModal.tsx`**

```tsx
import { useEffect, useState } from "react";
import api from "../../../api/axiosConfig";
import Button from "../../../components/ui/Button";
import { ModalDialog } from "../../../modals/common/ModalDialog";
import { PasswordInput } from "../../../modals/auth/PasswordInput";
import { faKey } from "@fortawesome/free-solid-svg-icons";
import { triggerToast } from "../../../components/ui/ToastNotification";
import { getApiErrorDetail } from "../../../utils/apiError";
import { RecoveryCodesView } from "./RecoveryCodesView";

interface RegenerateCodesModalProps {
  open: boolean;
  onClose: () => void;
  onRegenerated: () => void;
}

export function RegenerateCodesModal({ open, onClose, onRegenerated }: RegenerateCodesModalProps) {
  const [password, setPassword] = useState("");
  const [codes, setCodes] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword("");
      setCodes(null);
    }
  }, [open]);

  const submit = async () => {
    if (busy || !password) return;
    setBusy(true);
    try {
      const res = await api.post("/auth/mfa/recovery-codes/regenerate", { password });
      setCodes(res.data.recoveryCodes);
      onRegenerated();
    } catch (err: unknown) {
      triggerToast(getApiErrorDetail(err, "Could not regenerate codes"), false);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <ModalDialog
      title="Regenerate recovery codes"
      subtitle="Your previous codes stop working immediately"
      onCloseClick={onClose}
      onClose={onClose}
      footer={
        codes === null ? (
          <Button variant="primary" disabled={busy || !password} onClick={submit}>
            Regenerate
          </Button>
        ) : undefined
      }
    >
      {codes === null ? (
        <PasswordInput
          label="Current password"
          placeholder="Enter current password"
          value={password}
          icon={faKey}
          onChange={setPassword}
        />
      ) : (
        <RecoveryCodesView codes={codes} onDone={onClose} />
      )}
    </ModalDialog>
  );
}
```

- [ ] **Step 4: Write the test**

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmailMfaEnableModal } from "../../../../settings/sections/mfa/EmailMfaEnableModal";

const post = vi.fn();
vi.mock("../../../../api/axiosConfig", () => ({
  default: { post: (...args: unknown[]) => post(...args) },
}));

describe("EmailMfaEnableModal", () => {
  beforeEach(() => {
    post.mockReset();
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem("jwtToken", "old");
  });

  it("walks intro → verify → recovery for the first method", async () => {
    post.mockResolvedValueOnce({ data: { message: "sent" } }); // email/setup
    post.mockResolvedValueOnce({
      data: { token: "fresh", recoveryCodes: ["AAAA-AAAA"] },
    }); // email/confirm

    const onEnrolled = vi.fn();
    render(<EmailMfaEnableModal open onClose={vi.fn()} onEnrolled={onEnrolled} />);

    fireEvent.click(screen.getByRole("button", { name: /send verification code/i }));
    await screen.findByLabelText("Email verification code");

    fireEvent.change(screen.getByLabelText("Email verification code"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /enable email codes/i }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/auth/mfa/email/confirm", {
        code: "123456",
        rememberMe: false,
      }),
    );
    expect(onEnrolled).toHaveBeenCalled();
    expect(sessionStorage.getItem("jwtToken")).toBe("fresh"); // rotated token stored
    expect(await screen.findByText("AAAA-AAAA")).toBeTruthy();
  });
});
```

If `ModalDialog` needs `#modal-root` or `HTMLDialogElement.showModal` (jsdom lacks it),
copy the setup/stubs used by the existing modal tests under `src/__tests__/`.

- [ ] **Step 5: Verify** — `npm run lint && npm test && npm run build`. Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/settings/sections/mfa/ frontend/src/__tests__/settings/sections/mfa/
git commit -m "feat(mfa): email enrollment, disable and recovery-code modals"
```

---

### Task 17: Wire `SecuritySection` — live MFA cards

**Files:**
- Modify: `frontend/src/settings/sections/SecuritySection.tsx` (replace the static
  `MfaMethod` + "Two-factor authentication" card, lines 34-83 and 214-238)
- Test: `frontend/src/__tests__/settings/sections/SecuritySection.test.tsx`

**Interfaces:**
- Consumes: `useMfaStatus` (14), `TotpEnrollWizard` (15), `EmailMfaEnableModal` /
  `MfaDisableModal` / `RegenerateCodesModal` (16). Passkey card stays `ComingSoonBadge`.

- [ ] **Step 1: Replace the `MfaMethod` subcomponent**

```tsx
interface MfaMethodProps {
  icon: IconDefinition;
  title: string;
  description: string;
  recommended?: boolean;
  comingSoon?: boolean;
  enabled?: boolean;
  onEnable?: () => void;
  onDisable?: () => void;
}

const MfaMethod: React.FC<MfaMethodProps> = ({
  icon,
  title,
  description,
  recommended,
  comingSoon,
  enabled,
  onEnable,
  onDisable,
}) => (
  <div
    className={`flex flex-col gap-3 rounded-[var(--r-input)] border bg-app-input p-4 ${
      recommended ? "border-[var(--brand-1)]/40" : "border-app-border"
    }`}
  >
    <div className="flex items-center gap-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-sm)] ${
          recommended
            ? "bg-[var(--brand-1)]/15 text-[var(--brand-1)]"
            : "bg-app-surface text-app-muted"
        }`}
      >
        <FontAwesomeIcon icon={icon} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-app-text">{title}</p>
          {recommended && (
            <Badge variant="subtle" tone="brand" uppercase>
              Recommended
            </Badge>
          )}
          {enabled && (
            <Badge variant="subtle" tone="green" uppercase>
              Enabled
            </Badge>
          )}
        </div>
      </div>
    </div>
    <p className="text-xs text-app-muted">{description}</p>
    <div className="mt-auto flex items-center justify-between pt-1">
      {comingSoon ? (
        <>
          <ComingSoonBadge />
          <Button variant="secondary" size="sm" disabled>
            Enable
          </Button>
        </>
      ) : enabled ? (
        <Button variant="secondary" size="sm" className="ml-auto" onClick={onDisable}>
          Disable
        </Button>
      ) : (
        <Button variant="primary" size="sm" className="ml-auto" onClick={onEnable}>
          Enable
        </Button>
      )}
    </div>
  </div>
);
```

Check `Badge`'s real `tone` values in `components/ui/Badge.tsx` and use the closest
green/success tone.

- [ ] **Step 2: Wire the section**

Inside `SecuritySection` add (new imports:
`useMfaStatus`, `TotpEnrollWizard`, `EmailMfaEnableModal`, `MfaDisableModal`,
`RegenerateCodesModal` from `./mfa/...`):

```tsx
  const { status: mfaStatus, refresh: refreshMfa } = useMfaStatus();
  const [totpWizardOpen, setTotpWizardOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [disableTarget, setDisableTarget] = useState<"totp" | "email" | null>(null);
  const [regenOpen, setRegenOpen] = useState(false);
```

Replace the "Two-factor authentication" card's content with:

```tsx
        <div className="grid gap-4 sm:grid-cols-3">
          <MfaMethod
            icon={faFingerprint}
            title="Passkey"
            description="Sign in with a device passkey or biometrics (WebAuthn). The most phishing-resistant option."
            recommended
            comingSoon
          />
          <MfaMethod
            icon={faQrcode}
            title="Authenticator app"
            description="Scan a QR code and enter a rotating 6-digit code from an app like Authy or Google Authenticator (TOTP)."
            enabled={mfaStatus?.totpEnabled}
            onEnable={() => setTotpWizardOpen(true)}
            onDisable={() => setDisableTarget("totp")}
          />
          <MfaMethod
            icon={faEnvelope}
            title="Email code"
            description="Receive a one-time code by email at each sign-in. The simplest, but the weakest factor."
            enabled={mfaStatus?.emailMfaEnabled}
            onEnable={() => setEmailModalOpen(true)}
            onDisable={() => setDisableTarget("email")}
          />
        </div>

        {mfaStatus && (mfaStatus.totpEnabled || mfaStatus.emailMfaEnabled) && (
          <div className="mt-4 flex items-center justify-between rounded-[var(--r-input)] border border-app-border bg-app-input p-4">
            <div>
              <p className="text-sm font-bold text-app-text">Recovery codes</p>
              <p className="text-xs text-app-muted">
                {mfaStatus.recoveryCodesRemaining} of 10 remaining
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setRegenOpen(true)}>
              Regenerate
            </Button>
          </div>
        )}
```

And mount the flows after the existing `ConfirmModal`:

```tsx
      <TotpEnrollWizard
        open={totpWizardOpen}
        onClose={() => setTotpWizardOpen(false)}
        onEnrolled={refreshMfa}
      />
      <EmailMfaEnableModal
        open={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onEnrolled={refreshMfa}
      />
      <MfaDisableModal
        open={disableTarget !== null}
        method={disableTarget ?? "totp"}
        emailCodeAvailable={mfaStatus?.emailMfaEnabled ?? false}
        onClose={() => setDisableTarget(null)}
        onDisabled={refreshMfa}
      />
      <RegenerateCodesModal
        open={regenOpen}
        onClose={() => setRegenOpen(false)}
        onRegenerated={refreshMfa}
      />
```

Demo accounts: no special UI — the backend answers 403 and the toast explains it.

- [ ] **Step 3: Write the test**

```tsx
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SecuritySection } from "../../../settings/sections/SecuritySection";

const get = vi.fn();
const post = vi.fn();
vi.mock("../../../api/axiosConfig", () => ({
  default: {
    get: (...args: unknown[]) => get(...args),
    post: (...args: unknown[]) => post(...args),
  },
}));

describe("SecuritySection — MFA cards", () => {
  beforeEach(() => {
    get.mockReset();
  });

  it("renders live method states from /auth/mfa/status", async () => {
    get.mockResolvedValue({
      data: { totpEnabled: true, emailMfaEnabled: false, recoveryCodesRemaining: 7 },
    });

    render(<SecuritySection />);

    expect(await screen.findByText("Enabled")).toBeTruthy(); // TOTP badge
    expect(screen.getByText("7 of 10 remaining")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Enable" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Disable" })).toBeTruthy();
  });

  it("hides the recovery row when nothing is enabled", async () => {
    get.mockResolvedValue({
      data: { totpEnabled: false, emailMfaEnabled: false, recoveryCodesRemaining: 0 },
    });

    render(<SecuritySection />);

    await screen.findAllByRole("button", { name: "Enable" });
    expect(screen.queryByText(/of 10 remaining/)).toBeNull();
  });
});
```

- [ ] **Step 4: Verify** — `npm run lint && npm test && npm run build`, then in the dev
server: enable TOTP with a real authenticator app, sign out, sign back in through the
two-step flow. Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/settings/sections/SecuritySection.tsx \
  frontend/src/__tests__/settings/sections/SecuritySection.test.tsx
git commit -m "feat(mfa): live two-factor cards in the Security section"
```

---

## Phase G — Admin UI + finish

### Task 18: Admin "Reset MFA" action

**Files:**
- Modify: `frontend/src/admin/UserRow.tsx`
- Modify: `frontend/src/admin/UserDirectory.tsx`
- Test: `frontend/src/__tests__/admin/UserRow.test.tsx`

- [ ] **Step 1: Add the action to `UserRow.tsx`**

Extend the props and add a shield button next to delete (same icon-button style):

```tsx
import { faShieldHalved, faTrash } from "@fortawesome/free-solid-svg-icons";

interface UserRowProps {
  user: User;
  onDelete: (user: User) => void;
  onResetMfa: (user: User) => void;
}
```

In the actions `<td>`, before the delete button:

```tsx
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg text-app-muted transition-all duration-200 hover:bg-app-yellow/10 hover:text-app-yellow"
          onClick={() => onResetMfa(user)}
          title="Reset MFA"
        >
          <FontAwesomeIcon icon={faShieldHalved} />
        </button>
```

- [ ] **Step 2: Wire `UserDirectory.tsx`**

Mirror the existing delete-user confirm flow exactly (state + `ConfirmModal` +
API call + refresh): add a `resetMfaTarget` state, pass
`onResetMfa={setResetMfaTarget}` to `UserRow`, and confirm with:

```tsx
  const handleResetMfa = async () => {
    if (!resetMfaTarget) return;
    try {
      await api.delete(`/admin/management/${resetMfaTarget.id}/mfa`);
      triggerToast("MFA reset — the user can sign in with password only.", true);
    } catch (err: unknown) {
      triggerToast(getApiErrorTitle(err, "Could not reset MFA"), false);
    } finally {
      setResetMfaTarget(null);
    }
  };
```

(Check that the admin `User` type in `utils/types.ts` exposes `id`; if the existing
delete flow addresses users differently, address MFA reset the same way.)
`ConfirmModal` copy: title "Reset MFA?", message
"This removes every second factor and recovery code for {username}. They will sign in
with password only until they re-enroll.", danger tone.

- [ ] **Step 3: Test**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UserRow from "../../admin/UserRow";
import type { User } from "../../utils/types";

describe("UserRow", () => {
  it("fires onResetMfa", () => {
    const user = { name: "nic", wallets: 1, transactions: 2 } as unknown as User;
    const onResetMfa = vi.fn();
    render(
      <table>
        <tbody>
          <UserRow user={user} onDelete={vi.fn()} onResetMfa={onResetMfa} />
        </tbody>
      </table>,
    );
    fireEvent.click(screen.getByTitle("Reset MFA"));
    expect(onResetMfa).toHaveBeenCalledWith(user);
  });
});
```

- [ ] **Step 4: Verify** — `npm run lint && npm test && npm run build`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/admin/ frontend/src/__tests__/admin/UserRow.test.tsx
git commit -m "feat(mfa): admin reset-MFA action in the user directory"
```

---

### Task 19: Final gates, docs, knowledge graph, manual QA

- [ ] **Step 1: Full gates**

```bash
cd backend && ./gradlew spotlessApply check      # Spotless + tests + ≥90% coverage
cd ../frontend && npx prettier --write src/ && npm run lint && npm test && npm run build
```

Expected: everything green. Fix regressions before proceeding.

- [ ] **Step 2: Update `CLAUDE.md`** — in the "Auth (three mechanisms)" bullet of
*Backend architecture*, extend the JWT sub-bullet with one sentence:

```markdown
    Accounts with **MFA enabled** (TOTP and/or email codes, opt-in — see
    `service/MfaService`, endpoints `/api/auth/mfa/*`) get a 5-min `mfa_pending` token
    from login and finish via `POST /api/auth/mfa/verify`; TOTP secrets are AES-GCM
    encrypted with the `MFA_ENCRYPTION_KEY` env var.
```

- [ ] **Step 3: Manual QA checklist** (dev stack; needs a real authenticator app and a
reachable SMTP inbox):

1. Enable TOTP from Settings → Security (scan QR, verify, save codes) — other logged-in
   sessions (e.g. a second browser) get kicked; the current one keeps working.
2. Sign out → sign in: password → code step → success. Wrong code shakes; 6 wrong codes
   → back to password step.
3. "Send code by email" appears only after enabling email codes too; the email arrives;
   its code works; resend respects the 60 s cooldown.
4. Recovery code signs in and decrements the "N of 10" counter; the same code fails a
   second time.
5. Disable both methods (password + code); login is single-step again.
6. Demo login (if `VITE_DEMO_ENABLED`): MFA Enable buttons answer with the 403 toast.
7. Admin → user directory → Reset MFA on a test user → that user logs in password-only.
8. `POST /api/auth/refresh` with a valid cookie never asks for MFA; a `mfa_pending`
   token in `Authorization: Bearer` gets 401 on any API route.

- [ ] **Step 4: Refresh the knowledge graph**

```bash
graphify update .
```

- [ ] **Step 5: Wrap up** — move this file to `.claude/TODO/DONE/mfa.md` (house
convention for completed plans), commit, and hand back to the user for the manual merge
(house rule: the user merges branches).

```bash
git mv .claude/TODO/mfa.md .claude/TODO/DONE/mfa.md
git commit -m "chore(mfa): mark MFA plan as done"
```

---

## Explicitly out of scope (do not build)

- **Passkeys/WebAuthn** — Phase 2, separate spec; the card stays "Coming soon".
- MFA enforcement (admin-forced enrollment), trusted-device cookies, device management UI.
- MCP/PAT changes — PATs bypass MFA by design; the OAuth consent page is covered because
  it rides the frontend login.
- IP-based rate limiting (attempt caps + cooldowns only, per spec §6).


