package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.PatCreateRequest;
import dev.busato.FinanceWebApp.backend.dto.PatCreateResponse;
import dev.busato.FinanceWebApp.backend.dto.PatResponse;
import dev.busato.FinanceWebApp.backend.dto.PatUpdateRequest;
import dev.busato.FinanceWebApp.backend.exceptions.InvalidTokenException;
import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.mappers.PatMapper;
import dev.busato.FinanceWebApp.backend.model.PersonalAccessToken;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.repository.PersonalAccessTokenRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import jakarta.transaction.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Service for creating, validating, listing, and revoking Personal Access Tokens.
 *
 * <p>Security invariants:
 *
 * <ul>
 *   <li>Plain tokens are generated using {@link SecureRandom} (CSPRNG)
 *   <li>Only SHA-256 hashes are persisted — plain tokens are NEVER stored
 *   <li>Validation uses Caffeine cache ({@code @Cacheable}) to avoid DB hits on every API call
 * </ul>
 */
@Service
@RequiredArgsConstructor
public class PatService {

  private static final String TOKEN_PREFIX = "fin_pat_";
  private static final int TOKEN_BYTE_LENGTH = 32; // 256 bits of entropy
  private static final SecureRandom SECURE_RANDOM = new SecureRandom();

  private final PersonalAccessTokenRepository tokenRepository;
  private final UserRepository userRepository;
  private final WalletAccessRepository walletAccessRepository;
  private final PatMapper patMapper;

  /**
   * Generates a new PAT, computes its SHA-256 hash, persists the entity, and returns the plain
   * token ONCE in the response.
   */
  @Transactional
  public PatCreateResponse createToken(UUID userId, PatCreateRequest request) {
    User user =
        userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));

    if (request.getName() == null || request.getName().isBlank())
      throw new IllegalArgumentException("Token name is required");

    if (request.getName().length() > 50)
      throw new IllegalArgumentException("Token name must be 50 characters or less");

    validateTokenPermissions(userId, request.getWalletPermissions());

    // 1. Generate a cryptographically secure random token
    String plainToken = generateSecureToken();

    // 2. Compute SHA-256 hash (this is what gets stored)
    String tokenHash = hashToken(plainToken);

    // 3. Extract a prefix for UI identification
    String tokenPrefix = plainToken.substring(0, Math.min(plainToken.length(), 16));

    // 4. Build and persist the entity
    PersonalAccessToken entity =
        PersonalAccessToken.builder()
            .name(request.getName())
            .tokenHash(tokenHash)
            .tokenPrefix(tokenPrefix)
            .user(user)
            .walletPermissions(patMapper.serializeWalletPermissions(request.getWalletPermissions()))
            .expiresAt(request.getExpiresAt())
            .build();

    entity = tokenRepository.save(entity);

    // 5. Return the plain token ONCE — it is never retrievable again
    return patMapper.toCreateResponse(entity, plainToken);
  }

  /**
   * Validates a plain PAT token by hashing it and checking the cache/DB.
   *
   * <p>Cache key is the SHA-256 hash computed via SpEL. On cache miss, the DB is queried and the
   * result is cached for subsequent requests (10 min TTL).
   *
   * @param plainToken The raw token from the Authorization header
   * @return The validated token entity
   * @throws InvalidTokenException if the token is invalid or expired
   */
  @Cacheable(
      value = "patTokens",
      key = "T(dev.busato.FinanceWebApp.backend.service.PatService).hashToken(#plainToken)",
      unless = "#result == null")
  public PersonalAccessToken validateToken(String plainToken) {
    String tokenHash = hashToken(plainToken);
    PersonalAccessToken token =
        tokenRepository
            .findByTokenHash(tokenHash)
            .orElseThrow(() -> new InvalidTokenException("Invalid or unknown API token"));

    // Check expiration
    if (token.getExpiresAt() != null && token.getExpiresAt().isBefore(LocalDateTime.now())) {
      throw new InvalidTokenException("API token has expired");
    }

    // Reject paused tokens without bumping lastUsedAt
    if (token.isPaused()) {
      throw new InvalidTokenException("API token is paused");
    }

    // Update lastUsedAt asynchronously (fire-and-forget, don't block the request)
    updateLastUsedAsync(token.getId());

    return token;
  }

  /** Lists all tokens for a given user (without exposing plain tokens). */
  public List<PatResponse> listTokens(UUID userId) {
    return tokenRepository.findAllByUserId(userId).stream()
        .map(patMapper::toResponse)
        .collect(Collectors.toList());
  }

  /** Revokes (deletes) a token and evicts it from the cache. */
  @Transactional
  @CacheEvict(value = "patTokens", allEntries = true)
  public void revokeToken(UUID tokenId, UUID userId) {
    tokenRepository.deleteByIdAndUserId(tokenId, userId);
  }

  /**
   * Updates the wallet permissions for a token. Evicts all patTokens cache entries to ensure the
   * new permissions are enforced immediately.
   */
  @Transactional
  @CacheEvict(value = "patTokens", allEntries = true)
  public PatResponse updateToken(UUID tokenId, UUID userId, PatUpdateRequest request) {
    PersonalAccessToken token =
        tokenRepository
            .findByIdAndUserId(tokenId, userId)
            .orElseThrow(
                () -> new InvalidTokenException("Token not found or does not belong to user"));

    validateTokenPermissions(userId, request.getWalletPermissions());

    token.setWalletPermissions(
        patMapper.serializeWalletPermissions(request.getWalletPermissions()));
    token = tokenRepository.save(token);

    return patMapper.toResponse(token);
  }

  /**
   * Pauses or resumes a token owned by the given user. A paused token is rejected during API
   * authentication but not deleted. Evicts all patTokens cache entries so the new state takes
   * effect immediately.
   */
  @Transactional
  @CacheEvict(value = "patTokens", allEntries = true)
  public PatResponse setPaused(UUID tokenId, UUID userId, boolean paused) {
    PersonalAccessToken token =
        tokenRepository
            .findByIdAndUserId(tokenId, userId)
            .orElseThrow(
                () -> new InvalidTokenException("Token not found or does not belong to user"));

    token.setPaused(paused);
    token = tokenRepository.save(token);

    return patMapper.toResponse(token);
  }

  /**
   * Bulk-deletes tokens by ID, affecting ONLY tokens owned by the given user. IDs not owned by the
   * user are silently ignored. Evicts all patTokens cache entries.
   */
  @Transactional
  @CacheEvict(value = "patTokens", allEntries = true)
  public void bulkDeleteTokens(java.util.Collection<UUID> ids, UUID userId) {
    if (ids == null || ids.isEmpty()) return;
    tokenRepository.deleteAllByIdInAndUserId(ids, userId);
  }

  /**
   * Bulk pauses or resumes tokens by ID, affecting ONLY tokens owned by the given user. IDs not
   * owned by the user are silently ignored. Evicts all patTokens cache entries so the new state
   * takes effect immediately (a just-paused token stops authenticating from the Caffeine cache).
   *
   * @return the updated tokens (only those actually owned by the caller), mapped to responses
   */
  @Transactional
  @CacheEvict(value = "patTokens", allEntries = true)
  public List<PatResponse> bulkSetPaused(List<UUID> ids, UUID userId, boolean paused) {
    if (ids == null || ids.isEmpty()) return List.of();

    List<PersonalAccessToken> tokens = tokenRepository.findAllByIdInAndUserId(ids, userId);
    tokens.forEach(token -> token.setPaused(paused));
    tokens = tokenRepository.saveAll(tokens);

    return tokens.stream().map(patMapper::toResponse).collect(Collectors.toList());
  }

  // ──────────────────────────────────── Private helpers ────────────────────────────────────

  /**
   * Generates a cryptographically secure random token with the {@code fin_pat_} prefix. Uses Base64
   * URL-safe encoding (no padding) for clean, URL-safe tokens.
   */
  private String generateSecureToken() {
    byte[] randomBytes = new byte[TOKEN_BYTE_LENGTH];
    SECURE_RANDOM.nextBytes(randomBytes);
    String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    return TOKEN_PREFIX + encoded;
  }

  /** Computes the SHA-256 hash of a string, returned as a lowercase hex string. */
  public static String hashToken(String input) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(hash);
    } catch (NoSuchAlgorithmException e) {
      throw new RuntimeException("SHA-256 algorithm not available", e);
    }
  }

  /** Updates the lastUsedAt timestamp without blocking the authentication flow. */
  @Async
  public void updateLastUsedAsync(UUID tokenId) {
    tokenRepository
        .findById(tokenId)
        .ifPresent(
            token -> {
              token.setLastUsedAt(LocalDateTime.now());
              tokenRepository.save(token);
            });
  }

  /** Validates that the user has sufficient permissions on the requested wallets. */
  private void validateTokenPermissions(
      UUID userId, List<dev.busato.FinanceWebApp.backend.dto.WalletPermission> permissions) {
    if (permissions == null) return;
    for (dev.busato.FinanceWebApp.backend.dto.WalletPermission wp : permissions) {
      if (wp.permissions() != null && wp.permissions().contains("WRITE")) {
        dev.busato.FinanceWebApp.backend.model.WalletAccess access =
            walletAccessRepository
                .findByUserIdAndWalletId(userId, wp.walletId())
                .orElseThrow(
                    () ->
                        new IllegalArgumentException(
                            "User does not have access to wallet " + wp.walletId()));
        if (access.getRole()
            == dev.busato.FinanceWebApp.backend.model.WalletAccess.WalletRole.VIEWER) {
          throw new IllegalArgumentException(
              "Cannot grant WRITE permission for a wallet where you are only a VIEWER.");
        }
      }
    }
  }

  /**
   * Automatically grants READ and WRITE permissions to a specific token for a newly created wallet.
   */
  @Transactional
  @CacheEvict(value = "patTokens", allEntries = true)
  public void addWalletToToken(UUID tokenId, UUID walletId) {
    PersonalAccessToken token = tokenRepository.findById(tokenId).orElse(null);
    if (token == null) return;

    java.util.List<dev.busato.FinanceWebApp.backend.dto.WalletPermission> perms =
        new java.util.ArrayList<>(patMapper.parseWalletPermissions(token.getWalletPermissions()));

    // Remove existing permission for this wallet if any
    perms.removeIf(p -> p.walletId().equals(walletId));

    // Add new permission with READ and WRITE
    perms.add(
        new dev.busato.FinanceWebApp.backend.dto.WalletPermission(
            walletId, java.util.List.of("READ", "WRITE")));

    token.setWalletPermissions(patMapper.serializeWalletPermissions(perms));
    tokenRepository.save(token);
  }
}
