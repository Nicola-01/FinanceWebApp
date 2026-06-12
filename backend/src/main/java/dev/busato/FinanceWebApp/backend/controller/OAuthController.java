package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.OAuthAuthCodeStore;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Minimal OAuth 2.0 Authorization Server endpoints for MCP client integration.
 * <p>
 * Implements only the endpoints required by the MCP spec:
 * <ul>
 *   <li>{@code GET /.well-known/oauth-authorization-server} — discovery metadata</li>
 *   <li>{@code GET /oauth/authorize} — redirects to React consent page</li>
 *   <li>{@code POST /oauth/authorize} — user confirms consent, generates auth code</li>
 *   <li>{@code POST /oauth/token} — exchanges auth code for access token (PKCE validated)</li>
 * </ul>
 * <p>
 * This does NOT replace or conflict with the existing PAT copy-paste flow.
 * OAuth is just a transport layer — the final access_token IS a standard PAT.
 */
@RestController
@RequiredArgsConstructor
public class OAuthController {

    private final OAuthAuthCodeStore authCodeStore;

    @Value("${application.backend.url}")
    private String backendUrl;

    @Value("${application.frontend.url}")
    private String frontendUrl;

    // ──────────────────────────────────────────────────────────────────────
    // 1. Discovery metadata
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Returns OAuth 2.0 Authorization Server Metadata (RFC 8414).
     * Required by the MCP spec so clients can discover endpoints automatically.
     */
    @GetMapping("/.well-known/oauth-authorization-server")
    public ResponseEntity<Map<String, Object>> discoveryMetadata() {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("issuer", backendUrl);
        metadata.put("authorization_endpoint", backendUrl + "/oauth/authorize");
        metadata.put("token_endpoint", backendUrl + "/oauth/token");
        metadata.put("registration_endpoint", backendUrl + "/oauth/register");
        metadata.put("response_types_supported", List.of("code"));
        metadata.put("grant_types_supported", List.of("authorization_code"));
        metadata.put("code_challenge_methods_supported", List.of("S256"));
        metadata.put("token_endpoint_auth_methods_supported", List.of("none"));
        return ResponseEntity.ok(metadata);
    }

    // ──────────────────────────────────────────────────────────────────────
    // 2. GET /oauth/authorize — redirect to React consent page
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Receives the initial OAuth authorization request and redirects
     * the user's browser to the React consent page.
     * <p>
     * This endpoint is public — it simply forwards all query params
     * to the frontend. Authentication happens on the consent page.
     */
    @GetMapping("/oauth/authorize")
    public ResponseEntity<Void> authorizeRedirect(
            @RequestParam("client_id") String clientId,
            @RequestParam("redirect_uri") String redirectUri,
            @RequestParam(value = "scope", required = false, defaultValue = "") String scope,
            @RequestParam("code_challenge") String codeChallenge,
            @RequestParam(value = "code_challenge_method", required = false, defaultValue = "S256") String codeChallengeMethod,
            @RequestParam("state") String state,
            @RequestParam(value = "response_type", required = false, defaultValue = "code") String responseType
    ) {
        // Validate code_challenge_method is S256 — we don't support "plain"
        if (!"S256".equals(codeChallengeMethod)) {
            return ResponseEntity.badRequest().build();
        }

        // Build the frontend consent URL with all OAuth params forwarded
        String consentUrl = frontendUrl + "/oauth/authorize"
                + "?client_id=" + encode(clientId)
                + "&redirect_uri=" + encode(redirectUri)
                + "&scope=" + encode(scope)
                + "&code_challenge=" + encode(codeChallenge)
                + "&state=" + encode(state)
                + "&response_type=" + encode(responseType);

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(consentUrl))
                .build();
    }

    // ──────────────────────────────────────────────────────────────────────
    // 3. POST /oauth/authorize — user confirms, generate auth code
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Called by the React consent page after the user selects/creates a token
     * and clicks "Authorize". Requires JWT authentication.
     * <p>
     * Generates a one-time authorization code linked to the user's PAT
     * plain token and the PKCE code_challenge. Returns the redirect URL
     * for the frontend to navigate to.
     */
    @PostMapping("/oauth/authorize")
    public ResponseEntity<?> authorizeConfirm(
            @RequestBody OAuthAuthorizeRequest request,
            @AuthenticationPrincipal User user
    ) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User must be logged in"));
        }

        // Generate auth code and store it with the PKCE challenge + token
        String authCode = authCodeStore.generateAndStore(
                request.getCodeChallenge(),
                request.getPlainToken(),
                request.getClientId(),
                request.getRedirectUri(),
                request.getScope()
        );

        // Build the redirect URL with the code and state
        String redirectUrl = request.getRedirectUri()
                + (request.getRedirectUri().contains("?") ? "&" : "?")
                + "code=" + encode(authCode)
                + "&state=" + encode(request.getState());

        return ResponseEntity.ok(Map.of("redirectUrl", redirectUrl));
    }

    // ──────────────────────────────────────────────────────────────────────
    // 4. POST /oauth/token — exchange auth code for access token
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Token endpoint: exchanges an authorization code for an access token.
     * Validates PKCE (S256) by computing SHA-256 of the code_verifier
     * and comparing with the stored code_challenge.
     * <p>
     * This endpoint is public — the auth code itself serves as authentication.
     * Accepts application/x-www-form-urlencoded (OAuth 2.0 standard).
     */
    @PostMapping(value = "/oauth/token", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<?> tokenExchange(
            @RequestParam("grant_type") String grantType,
            @RequestParam("code") String code,
            @RequestParam("redirect_uri") String redirectUri,
            @RequestParam("code_verifier") String codeVerifier,
            @RequestParam("client_id") String clientId
    ) {
        // Validate grant_type
        if (!"authorization_code".equals(grantType)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "unsupported_grant_type",
                            "error_description", "Only authorization_code is supported"));
        }

        // Consume the auth code (single use — removed from store)
        var entryOpt = authCodeStore.consume(code);
        if (entryOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "invalid_grant",
                            "error_description", "Authorization code is invalid, expired, or already used"));
        }

        var entry = entryOpt.get();

        // Validate client_id matches
        if (!entry.getClientId().equals(clientId)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "invalid_grant",
                            "error_description", "client_id mismatch"));
        }

        // Validate redirect_uri matches
        if (!entry.getRedirectUri().equals(redirectUri)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "invalid_grant",
                            "error_description", "redirect_uri mismatch"));
        }

        // PKCE validation: SHA256(code_verifier) → base64url must match code_challenge
        String computedChallenge = computeCodeChallenge(codeVerifier);
        if (!computedChallenge.equals(entry.getCodeChallenge())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "invalid_grant",
                            "error_description", "PKCE verification failed"));
        }

        // Success — return the PAT as the access token
        Map<String, Object> tokenResponse = new LinkedHashMap<>();
        tokenResponse.put("access_token", entry.getPlainToken());
        tokenResponse.put("token_type", "Bearer");
        tokenResponse.put("scope", entry.getScope() != null ? entry.getScope() : "");

        return ResponseEntity.ok(tokenResponse);
    }

    // ──────────────────────────────────────────────────────────────────────
    // 5. POST /oauth/register — Dynamic Client Registration (stub)
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Dynamic Client Registration endpoint (RFC 7591).
     * Required by the MCP spec for clients like Claude.ai that register
     * themselves dynamically. We accept any registration and echo back
     * the client metadata — no actual validation or storage is needed
     * since we trust any client_id on the consent screen.
     */
    @PostMapping("/oauth/register")
    public ResponseEntity<?> dynamicClientRegistration(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("client_id", request.getOrDefault("client_name",
                "mcp-client-" + System.currentTimeMillis()));
        response.put("client_name", request.getOrDefault("client_name", "MCP Client"));
        response.put("redirect_uris", request.getOrDefault("redirect_uris", List.of()));
        response.put("grant_types", List.of("authorization_code"));
        response.put("response_types", List.of("code"));
        response.put("token_endpoint_auth_method", "none");
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ──────────────────────────────────────────────────────────────────────
    // DTOs
    // ──────────────────────────────────────────────────────────────────────

    @Data
    public static class OAuthAuthorizeRequest {
        private String plainToken;
        private String clientId;
        private String redirectUri;
        private String codeChallenge;
        private String state;
        private String scope;
    }

    // ──────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────

    /**
     * Computes the PKCE S256 code challenge from a code verifier.
     * code_challenge = BASE64URL(SHA256(code_verifier))
     */
    private String computeCodeChallenge(String codeVerifier) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(codeVerifier.getBytes(StandardCharsets.US_ASCII));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * URL-encodes a string for safe inclusion in query parameters.
     */
    private static String encode(String value) {
        if (value == null) return "";
        return java.net.URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
