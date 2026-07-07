package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.OAuthAuthCodeStore;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Minimal OAuth 2.0 Authorization Server endpoints for MCP client integration.
 *
 * <p>Implements only the endpoints required by the MCP spec. Ordinati in ordine di esecuzione reale
 * del flusso OAuth:
 *
 * <p>FLUSSO COMPLETO:
 *
 * <pre>
 *  [Client MCP - es. Claude.ai]
 *
 *  1. Client si connette al MCP server senza token
 *     → MCP server risponde 401 + WWW-Authenticate con resource_metadata URL
 *     → Client chiama /.well-known/oauth-protected-resource sul MCP server
 *     → Scopre che l'auth server è questo backend
 *
 *  2. Client chiama GET /.well-known/oauth-authorization-server (questo controller)
 *     → Scopre dove sono register, authorize, token
 *
 *  3. Client chiama POST /oauth/register
 *     → Ottiene un client_id
 *
 *  4. Client apre il browser su GET /oauth/authorize?client_id=...&code_challenge=...
 *     → Backend redirige al frontend React (pagina di consenso)
 *     → Utente fa login (JWT) e sceglie quale token associare
 *     → React chiama POST /oauth/authorize
 *     → Backend genera un auth code temporaneo e redirige il browser su redirect_uri?code=...
 *
 *  5. Client chiama POST /oauth/token con code + code_verifier (PKCE)
 *     → Backend verifica PKCE, consuma il code (monouso) e restituisce il PAT come access_token
 *
 *  6. Client usa il token in ogni richiesta MCP:
 *     Authorization: Bearer <access_token>
 * </pre>
 *
 * <p>OAuth è solo il trasporto per ottenere il token — l'access_token finale è un PAT standard,
 * identico a quello del flusso copia-incolla. I due flussi coesistono senza conflitti.
 */
@RestController
@RequiredArgsConstructor
public class OAuthController {

  private final OAuthAuthCodeStore authCodeStore;

  @Value("${application.backend.url}")
  private String backendUrl;

  @Value("${application.frontend.url}")
  private String frontendUrl;

  /**
   * Comma-separated allowlist of hosts permitted as OAuth {@code redirect_uri} targets. Loopback
   * addresses (localhost / 127.0.0.1 / ::1) are always allowed for local MCP clients; every other
   * host must be https and appear in this list. Override via {@code OAUTH_ALLOWED_REDIRECT_HOSTS}.
   */
  @Value("${application.oauth.allowed-redirect-hosts:claude.ai,claude.com}")
  private String allowedRedirectHosts;

  // ──────────────────────────────────────────────────────────────────────
  // STEP 1 — Discovery metadata
  // Il client chiama questo endpoint per scoprire tutti gli altri.
  // È il punto di ingresso del flusso OAuth lato auth server.
  // Chiamato dopo che il client ha letto /.well-known/oauth-protected-resource
  // sul MCP server e ha scoperto che l'auth server è questo backend.
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Returns OAuth 2.0 Authorization Server Metadata (RFC 8414). Required by the MCP spec so clients
   * can discover endpoints automatically.
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
    // "none" significa che il client non manda un client_secret — si fida solo del PKCE
    metadata.put("token_endpoint_auth_methods_supported", List.of("none"));
    return ResponseEntity.ok(metadata);
  }

  // ──────────────────────────────────────────────────────────────────────
  // STEP 2 — Dynamic Client Registration
  // Il client si registra per ottenere un client_id prima di fare authorize.
  // Nel nostro caso è uno stub — accettiamo qualsiasi registrazione senza
  // salvarla, perché la sicurezza vera è sul token scelto dall'utente
  // nella pagina di consenso, non sul client_id.
  // Il PKCE garantisce comunque che il code non possa essere usato da altri.
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Dynamic Client Registration endpoint (RFC 7591). Required by the MCP spec for clients like
   * Claude.ai that register themselves dynamically. We accept any registration and echo back the
   * client metadata — no actual validation or storage is needed since we trust any client_id on the
   * consent screen.
   */
  @PostMapping("/oauth/register")
  public ResponseEntity<?> dynamicClientRegistration(@RequestBody Map<String, Object> request) {
    Map<String, Object> response = new LinkedHashMap<>();
    response.put(
        "client_id",
        request.getOrDefault("client_name", "mcp-client-" + System.currentTimeMillis()));
    response.put("client_name", request.getOrDefault("client_name", "MCP Client"));
    // redirect_uris: indirizzi del client dove mandare il browser con il code dopo l'approvazione.
    // Non li salviamo, quindi non facciamo la verifica nell'authorize — il PKCE copre il rischio.
    response.put("redirect_uris", request.getOrDefault("redirect_uris", List.of()));
    response.put("grant_types", List.of("authorization_code"));
    response.put("response_types", List.of("code"));
    response.put("token_endpoint_auth_method", "none");
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  // ──────────────────────────────────────────────────────────────────────
  // STEP 3a — GET /oauth/authorize
  // Il client apre il browser su questo endpoint con i parametri OAuth.
  // Non fa nulla di logico — redirige semplicemente al frontend React
  // passando tutti i parametri, così la SPA può mostare la pagina di consenso.
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Receives the initial OAuth authorization request and redirects the user's browser to the React
   * consent page.
   *
   * <p>This endpoint is public — it simply forwards all query params to the frontend.
   * Authentication happens on the consent page.
   */
  @GetMapping("/oauth/authorize")
  public ResponseEntity<Void> authorizeRedirect(
      @RequestParam("client_id") String clientId,
      @RequestParam("redirect_uri") String redirectUri,
      @RequestParam(value = "scope", required = false, defaultValue = "") String scope,
      @RequestParam("code_challenge") String codeChallenge,
      @RequestParam(value = "code_challenge_method", required = false, defaultValue = "S256")
          String codeChallengeMethod,
      @RequestParam("state") String state,
      @RequestParam(value = "response_type", required = false, defaultValue = "code")
          String responseType) {
    // Validate code_challenge_method is S256 — we don't support "plain"
    if (!"S256".equals(codeChallengeMethod)) {
      return ResponseEntity.badRequest().build();
    }

    // Reject unknown redirect targets before sending the user to the consent page. Without this an
    // attacker could point redirect_uri at their own server and, because they chose the PKCE
    // code_challenge themselves, exchange the resulting code for the victim's freshly-issued PAT.
    if (!isAllowedRedirectUri(redirectUri)) {
      return ResponseEntity.badRequest().build();
    }

    // Build the frontend consent URL with all OAuth params forwarded
    String consentUrl =
        frontendUrl
            + "/oauth/authorize"
            + "?client_id="
            + encode(clientId)
            + "&redirect_uri="
            + encode(redirectUri)
            + "&scope="
            + encode(scope)
            + "&code_challenge="
            + encode(codeChallenge)
            + "&state="
            + encode(state)
            + "&response_type="
            + encode(responseType);

    return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(consentUrl)).build();
  }

  // ──────────────────────────────────────────────────────────────────────
  // STEP 3b — POST /oauth/authorize
  // Chiamato da React dopo che l'utente ha scelto il token e cliccato
  // "Autorizza". L'utente deve essere loggato (JWT nell'header).
  // Genera un auth code temporaneo e monouso, lo salva con il PKCE challenge
  // e il token scelto, poi restituisce il redirect URL al frontend.
  // Il frontend naviga su quell'URL → il client MCP riceve il code.
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Called by the React consent page after the user selects/creates a token and clicks "Authorize".
   * Requires JWT authentication.
   *
   * <p>Generates a one-time authorization code linked to the user's PAT plain token and the PKCE
   * code_challenge. Returns the redirect URL for the frontend to navigate to.
   */
  @PostMapping("/oauth/authorize")
  public ResponseEntity<?> authorizeConfirm(
      @RequestBody OAuthAuthorizeRequest request,
      @AuthenticationPrincipal User user // -> extracts the user from Authorization: Bearer <JWT>
      ) {
    if (user == null) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
          .body(Map.of("error", "User must be logged in"));
    }

    // Re-validate the redirect target here — this is the security-critical point where the token is
    // bound to a redirect and the code is issued. The GET check can be bypassed by posting
    // directly.
    if (!isAllowedRedirectUri(request.getRedirectUri())) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST)
          .body(Map.of("error", "invalid_redirect_uri", "message", "redirect_uri is not allowed"));
    }

    // Generate auth code and store it with the PKCE challenge + token
    String authCode;
    try {
      authCode =
          authCodeStore.generateAndStore(
              request.getCodeChallenge(),
              request.getPlainToken(),
              request.getClientId(),
              request.getRedirectUri(),
              request.getScope());
    } catch (IllegalStateException e) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST)
          .body(Map.of("error", "replay_detected", "message", e.getMessage()));
    }

    // Build the redirect URL with the code and state.
    // Il browser verrà mandato qui → il client MCP legge il code dall'URL.
    // Il code nell'URL è sicuro perché da solo è inutile senza il code_verifier (PKCE).
    String redirectUrl =
        request.getRedirectUri()
            + (request.getRedirectUri().contains("?") ? "&" : "?")
            + "code="
            + encode(authCode)
            + "&state="
            + encode(request.getState());

    return ResponseEntity.ok(Map.of("redirectUrl", redirectUrl));
  }

  // ──────────────────────────────────────────────────────────────────────
  // STEP 4 — POST /oauth/token
  // Il client scambia il code con il token vero.
  // Questa chiamata va direttamente dal client a questo endpoint,
  // non passa per il browser — il token non finisce mai in un URL.
  // Verifica PKCE: SHA256(code_verifier) deve corrispondere al code_challenge
  // salvato nello step 3b. Poi consuma il code (monouso) e restituisce il PAT.
  // Da questo momento il client usa il PAT come Bearer token in ogni richiesta MCP.
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Token endpoint: exchanges an authorization code for an access token. Validates PKCE (S256) by
   * computing SHA-256 of the code_verifier and comparing with the stored code_challenge.
   *
   * <p>This endpoint is public — the auth code itself serves as authentication. Accepts
   * application/x-www-form-urlencoded (OAuth 2.0 standard).
   */
  @PostMapping(value = "/oauth/token", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
  public ResponseEntity<?> tokenExchange(
      @RequestParam("grant_type") String grantType,
      @RequestParam("code") String code,
      @RequestParam("redirect_uri") String redirectUri,
      @RequestParam("code_verifier") String codeVerifier,
      @RequestParam("client_id") String clientId) {
    // Validate grant_type
    if (!"authorization_code".equals(grantType)) {
      return ResponseEntity.badRequest()
          .body(
              Map.of(
                  "error",
                  "unsupported_grant_type",
                  "error_description",
                  "Only authorization_code is supported"));
    }

    // Consume the auth code (single use — removed from store)
    var entryOpt = authCodeStore.consume(code);
    if (entryOpt.isEmpty()) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST)
          .body(
              Map.of(
                  "error",
                  "invalid_grant",
                  "error_description",
                  "Authorization code is invalid, expired, or already used"));
    }

    var entry = entryOpt.get();

    // Validate client_id matches
    if (!entry.getClientId().equals(clientId)) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST)
          .body(Map.of("error", "invalid_grant", "error_description", "client_id mismatch"));
    }

    // Validate redirect_uri matches
    if (!entry.getRedirectUri().equals(redirectUri)) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST)
          .body(Map.of("error", "invalid_grant", "error_description", "redirect_uri mismatch"));
    }

    // PKCE validation: SHA256(code_verifier) → base64url must match code_challenge
    // code_verifier è il segreto che il client ha generato prima dell'authorize.
    // code_challenge è SHA256(code_verifier) mandato durante l'authorize.
    // Se corrispondono, siamo sicuri che chi sta scambiando il code è lo stesso
    // che ha fatto la richiesta authorize — nessun attaccante può usare il code intercettato.
    String computedChallenge = computeCodeChallenge(codeVerifier);
    if (!computedChallenge.equals(entry.getCodeChallenge())) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST)
          .body(Map.of("error", "invalid_grant", "error_description", "PKCE verification failed"));
    }

    // Success — return the PAT as the access token.
    // Da qui il client usa questo token come Authorization: Bearer <access_token>
    // in ogni richiesta al MCP server — identico al flusso copia-incolla.
    Map<String, Object> tokenResponse = new LinkedHashMap<>();
    tokenResponse.put("access_token", entry.getPlainToken());
    tokenResponse.put("token_type", "Bearer");
    tokenResponse.put("scope", entry.getScope() != null ? entry.getScope() : "");

    return ResponseEntity.ok(tokenResponse);
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
   * Computes the PKCE S256 code challenge from a code verifier. code_challenge =
   * BASE64URL(SHA256(code_verifier))
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

  /** URL-encodes a string for safe inclusion in query parameters. */
  private static String encode(String value) {
    if (value == null) return "";
    return java.net.URLEncoder.encode(value, StandardCharsets.UTF_8);
  }

  // Extracts scheme + authority ("[^/?#]*") from a URI without choking on illegal characters
  // (e.g. spaces) that may appear in the path/query — we only need the host to make a trust
  // decision.
  private static final java.util.regex.Pattern SCHEME_AUTHORITY =
      java.util.regex.Pattern.compile("^([a-zA-Z][a-zA-Z0-9+.-]*)://([^/?#]*)");

  /**
   * Validates a {@code redirect_uri} against the trust policy: loopback hosts are always allowed
   * (over http or https) for local MCP clients, while every other host must use https and match a
   * configured allowed host (exact match or a subdomain of one). This prevents auth-code
   * interception via an attacker-controlled redirect target.
   */
  private boolean isAllowedRedirectUri(String redirectUri) {
    if (redirectUri == null || redirectUri.isBlank()) {
      return false;
    }
    java.util.regex.Matcher matcher = SCHEME_AUTHORITY.matcher(redirectUri.trim());
    if (!matcher.find()) {
      return false; // not an absolute http(s)-style URI
    }
    String scheme = matcher.group(1).toLowerCase();
    String host = extractHost(matcher.group(2));
    if (host.isEmpty()) {
      return false;
    }

    boolean loopback =
        host.equals("localhost")
            || host.equals("127.0.0.1")
            || host.equals("::1")
            || host.equals("[::1]");
    if (loopback) {
      return scheme.equals("http") || scheme.equals("https");
    }

    if (!scheme.equals("https")) {
      return false; // non-loopback redirects must be https
    }
    for (String allowed : allowedRedirectHosts.split(",")) {
      String candidate = allowed.trim().toLowerCase();
      if (!candidate.isEmpty() && (host.equals(candidate) || host.endsWith("." + candidate))) {
        return true;
      }
    }
    return false;
  }

  /** Strips optional userinfo and port from a URI authority, returning the lowercase host. */
  private static String extractHost(String authority) {
    String hostPort = authority;
    int at = hostPort.lastIndexOf('@');
    if (at >= 0) {
      hostPort = hostPort.substring(at + 1);
    }
    String host;
    if (hostPort.startsWith("[")) { // IPv6 literal, e.g. [::1]:8080
      int close = hostPort.indexOf(']');
      host = close >= 0 ? hostPort.substring(0, close + 1) : hostPort;
    } else {
      int colon = hostPort.indexOf(':');
      host = colon >= 0 ? hostPort.substring(0, colon) : hostPort;
    }
    return host.toLowerCase();
  }
}
