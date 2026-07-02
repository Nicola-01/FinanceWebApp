package dev.busato.FinanceWebApp.backend.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import lombok.Builder;
import lombok.Getter;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * In-memory store for OAuth 2.0 authorization codes.
 *
 * <p>Auth codes are short-lived (5 minutes), single-use, and link to a user's PAT plain token value
 * for the token exchange step.
 *
 * <p>This implementation is suitable for single-instance deployments. For multi-instance setups
 * behind a load balancer, replace with a database-backed or Redis-backed implementation.
 */
@Component
public class OAuthAuthCodeStore {

  private static final int CODE_BYTE_LENGTH = 32;
  private static final long CODE_TTL_SECONDS = 300; // 5 minutes
  private static final SecureRandom SECURE_RANDOM = new SecureRandom();

  private final ConcurrentHashMap<String, AuthCodeEntry> store = new ConcurrentHashMap<>();
  private final ConcurrentHashMap<String, Instant> usedChallenges = new ConcurrentHashMap<>();

  /** Represents a stored authorization code entry. */
  @Getter
  @Builder
  public static class AuthCodeEntry {
    private final String codeChallenge;
    private final String plainToken;
    private final String clientId;
    private final String redirectUri;
    private final String scope;
    private final Instant createdAt;
  }

  /**
   * Generates a cryptographically secure random authorization code, stores the entry, and returns
   * the code.
   */
  public String generateAndStore(
      String codeChallenge, String plainToken, String clientId, String redirectUri, String scope) {
    if (usedChallenges.containsKey(codeChallenge)) {
      throw new IllegalStateException("code_challenge has already been used");
    }

    String code = generateCode();

    AuthCodeEntry entry =
        AuthCodeEntry.builder()
            .codeChallenge(codeChallenge)
            .plainToken(plainToken)
            .clientId(clientId)
            .redirectUri(redirectUri)
            .scope(scope)
            .createdAt(Instant.now())
            .build();

    store.put(code, entry);
    usedChallenges.put(codeChallenge, entry.getCreatedAt());
    return code;
  }

  /**
   * Consumes (retrieves and deletes) an authorization code. Returns empty if the code doesn't exist
   * or has expired. This ensures single-use: the code is deleted atomically.
   */
  public Optional<AuthCodeEntry> consume(String code) {
    AuthCodeEntry entry = store.remove(code);
    if (entry == null) {
      return Optional.empty();
    }

    // Check expiration
    if (entry.getCreatedAt().plusSeconds(CODE_TTL_SECONDS).isBefore(Instant.now())) {
      return Optional.empty(); // Expired — already removed from map
    }

    return Optional.of(entry);
  }

  /**
   * Scheduled cleanup: removes expired entries every 60 seconds. Prevents memory leaks from
   * unclaimed authorization codes.
   */
  @Scheduled(fixedRate = 60_000)
  public void cleanup() {
    Instant cutoff = Instant.now().minusSeconds(CODE_TTL_SECONDS);
    store.entrySet().removeIf(e -> e.getValue().getCreatedAt().isBefore(cutoff));
    usedChallenges.entrySet().removeIf(e -> e.getValue().isBefore(cutoff));
  }

  /** Generates a random 32-byte hex string for use as an authorization code. */
  private String generateCode() {
    byte[] bytes = new byte[CODE_BYTE_LENGTH];
    SECURE_RANDOM.nextBytes(bytes);
    return HexFormat.of().formatHex(bytes);
  }
}
