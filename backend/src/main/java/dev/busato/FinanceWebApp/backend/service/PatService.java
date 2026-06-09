package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.PatCreateRequest;
import dev.busato.FinanceWebApp.backend.dto.PatCreateResponse;
import dev.busato.FinanceWebApp.backend.dto.PatResponse;
import dev.busato.FinanceWebApp.backend.exceptions.InvalidTokenException;
import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.mappers.PatMapper;
import dev.busato.FinanceWebApp.backend.model.PersonalAccessToken;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.repository.PersonalAccessTokenRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

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

/**
 * Service for creating, validating, listing, and revoking Personal Access Tokens.
 * <p>
 * Security invariants:
 * <ul>
 *   <li>Plain tokens are generated using {@link SecureRandom} (CSPRNG)</li>
 *   <li>Only SHA-256 hashes are persisted — plain tokens are NEVER stored</li>
 *   <li>Validation uses Caffeine cache ({@code @Cacheable}) to avoid DB hits on every API call</li>
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
    private final PatMapper patMapper;

    /**
     * Generates a new PAT, computes its SHA-256 hash, persists the entity,
     * and returns the plain token ONCE in the response.
     */
    @Transactional
    public PatCreateResponse createToken(UUID userId, PatCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        if (request.getName() == null || request.getName().isBlank())
            throw new IllegalArgumentException("Token name is required");

        if (request.getName().length() > 50)
            throw new IllegalArgumentException("Token name must be 50 characters or less");

        // 1. Generate a cryptographically secure random token
        String plainToken = generateSecureToken();

        // 2. Compute SHA-256 hash (this is what gets stored)
        String tokenHash = hashToken(plainToken);

        // 3. Extract a prefix for UI identification
        String tokenPrefix = plainToken.substring(0, Math.min(plainToken.length(), 16));

        // 4. Build and persist the entity
        PersonalAccessToken entity = PersonalAccessToken.builder()
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
     * <p>
     * Cache key is the SHA-256 hash computed via SpEL. On cache miss, the DB is queried
     * and the result is cached for subsequent requests (10 min TTL).
     *
     * @param plainToken The raw token from the Authorization header
     * @return The validated token entity
     * @throws InvalidTokenException if the token is invalid or expired
     */
    @Cacheable(value = "patTokens", key = "T(dev.busato.FinanceWebApp.backend.service.PatService).hashToken(#plainToken)", unless = "#result == null")
    public PersonalAccessToken validateToken(String plainToken) {
        String tokenHash = hashToken(plainToken);
        PersonalAccessToken token = tokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new InvalidTokenException("Invalid or unknown API token"));

        // Check expiration
        if (token.getExpiresAt() != null && token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("API token has expired");
        }

        // Update lastUsedAt asynchronously (fire-and-forget, don't block the request)
        updateLastUsedAsync(token.getId());

        return token;
    }

    /**
     * Lists all tokens for a given user (without exposing plain tokens).
     */
    public List<PatResponse> listTokens(UUID userId) {
        return tokenRepository.findAllByUserId(userId).stream()
                .map(patMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Revokes (deletes) a token and evicts it from the cache.
     */
    @Transactional
    @CacheEvict(value = "patTokens", allEntries = true)
    public void revokeToken(UUID tokenId, UUID userId) {
        tokenRepository.deleteByIdAndUserId(tokenId, userId);
    }

    // ──────────────────────────────────── Private helpers ────────────────────────────────────

    /**
     * Generates a cryptographically secure random token with the {@code fin_pat_} prefix.
     * Uses Base64 URL-safe encoding (no padding) for clean, URL-safe tokens.
     */
    private String generateSecureToken() {
        byte[] randomBytes = new byte[TOKEN_BYTE_LENGTH];
        SECURE_RANDOM.nextBytes(randomBytes);
        String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        return TOKEN_PREFIX + encoded;
    }

    /**
     * Computes the SHA-256 hash of a string, returned as a lowercase hex string.
     */
    public static String hashToken(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Updates the lastUsedAt timestamp without blocking the authentication flow.
     */
    @Async
    public void updateLastUsedAsync(UUID tokenId) {
        tokenRepository.findById(tokenId).ifPresent(token -> {
            token.setLastUsedAt(LocalDateTime.now());
            tokenRepository.save(token);
        });
    }
}
