package dev.busato.FinanceWebApp.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.busato.FinanceWebApp.backend.service.OAuthAuthCodeStore;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MvcResult;

@WebMvcTest(
    controllers = OAuthController.class,
    excludeAutoConfiguration = {
      org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class
    })
@Import(OAuthAuthCodeStore.class)
@TestPropertySource(
    properties = {
      "application.backend.url=http://localhost:8080",
      "application.frontend.url=http://localhost:5173"
    })
class OAuthControllerTest extends BaseWebMvcTest {

  @Autowired private OAuthAuthCodeStore authCodeStore;

  private static final String BACKEND_URL = "http://localhost:8080";
  private static final String FRONTEND_URL = "http://localhost:5173";

  // ──────────────────────────────────────────────────────────────────────
  // Discovery metadata
  // ──────────────────────────────────────────────────────────────────────

  @Test
  void discoveryMetadata_ShouldReturn200WithAllFields() throws Exception {
    mockMvc
        .perform(get("/.well-known/oauth-authorization-server"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.issuer").value(BACKEND_URL))
        .andExpect(jsonPath("$.authorization_endpoint").value(BACKEND_URL + "/oauth/authorize"))
        .andExpect(jsonPath("$.token_endpoint").value(BACKEND_URL + "/oauth/token"))
        .andExpect(jsonPath("$.registration_endpoint").value(BACKEND_URL + "/oauth/register"))
        .andExpect(jsonPath("$.response_types_supported[0]").value("code"))
        .andExpect(jsonPath("$.grant_types_supported[0]").value("authorization_code"))
        .andExpect(jsonPath("$.code_challenge_methods_supported[0]").value("S256"))
        .andExpect(jsonPath("$.token_endpoint_auth_methods_supported[0]").value("none"));
  }

  // ──────────────────────────────────────────────────────────────────────
  // Dynamic Client Registration
  // ──────────────────────────────────────────────────────────────────────

  @Test
  void register_WithClientNameAndRedirectUris_ShouldEchoBackFields() throws Exception {
    Map<String, Object> body =
        Map.of(
            "client_name",
            "My MCP Client",
            "redirect_uris",
            java.util.List.of("http://localhost:1234/callback"));

    mockMvc
        .perform(
            post("/oauth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.client_id").value("My MCP Client"))
        .andExpect(jsonPath("$.client_name").value("My MCP Client"))
        .andExpect(jsonPath("$.redirect_uris[0]").value("http://localhost:1234/callback"))
        .andExpect(jsonPath("$.grant_types[0]").value("authorization_code"))
        .andExpect(jsonPath("$.response_types[0]").value("code"))
        .andExpect(jsonPath("$.token_endpoint_auth_method").value("none"));
  }

  @Test
  void register_WithoutClientNameOrRedirectUris_ShouldUseDefaults() throws Exception {
    mockMvc
        .perform(post("/oauth/register").contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.client_id", org.hamcrest.Matchers.startsWith("mcp-client-")))
        .andExpect(jsonPath("$.client_name").value("MCP Client"))
        .andExpect(jsonPath("$.redirect_uris").isArray())
        .andExpect(jsonPath("$.redirect_uris").isEmpty());
  }

  // ──────────────────────────────────────────────────────────────────────
  // GET /oauth/authorize
  // ──────────────────────────────────────────────────────────────────────

  @Test
  void authorizeRedirect_WithValidParams_ShouldRedirectToFrontendWithEncodedParams()
      throws Exception {
    String redirectUri = "http://localhost:9999/callback?foo=bar baz";
    String state = "state with space & special=chars";

    MvcResult result =
        mockMvc
            .perform(
                get("/oauth/authorize")
                    .param("client_id", "client-abc")
                    .param("redirect_uri", redirectUri)
                    .param("scope", "read write")
                    .param("code_challenge", "challenge123")
                    .param("state", state))
            .andExpect(status().isFound())
            .andReturn();

    String location = result.getResponse().getHeader("Location");
    assertThat(location).isNotNull();
    assertThat(location).startsWith(FRONTEND_URL + "/oauth/authorize?");
    assertThat(location).contains("client_id=client-abc");
    assertThat(location)
        .contains(
            "redirect_uri=" + java.net.URLEncoder.encode(redirectUri, StandardCharsets.UTF_8));
    assertThat(location).contains("scope=read+write");
    assertThat(location).contains("code_challenge=challenge123");
    assertThat(location)
        .contains("state=" + java.net.URLEncoder.encode(state, StandardCharsets.UTF_8));
    assertThat(location).contains("response_type=code");
  }

  @Test
  void authorizeRedirect_WithPlainCodeChallengeMethod_ShouldReturn400() throws Exception {
    mockMvc
        .perform(
            get("/oauth/authorize")
                .param("client_id", "client-abc")
                .param("redirect_uri", "http://localhost:9999/callback")
                .param("code_challenge", "challenge123")
                .param("code_challenge_method", "plain")
                .param("state", "xyz"))
        .andExpect(status().isBadRequest());
  }

  // ──────────────────────────────────────────────────────────────────────
  // POST /oauth/authorize
  // ──────────────────────────────────────────────────────────────────────

  @Test
  void authorizeConfirm_WithRedirectUriWithoutQuery_ShouldReturn200WithQuestionMark()
      throws Exception {
    OAuthController.OAuthAuthorizeRequest request = new OAuthController.OAuthAuthorizeRequest();
    request.setPlainToken("fin_pat_abc123");
    request.setClientId("client-1");
    request.setRedirectUri("http://localhost:9999/callback");
    request.setCodeChallenge("challenge-no-query");
    request.setState("state1");
    request.setScope("read");

    mockMvc
        .perform(
            post("/oauth/authorize")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.redirectUrl").value(org.hamcrest.Matchers.containsString("code=")))
        .andExpect(jsonPath("$.redirectUrl").value(org.hamcrest.Matchers.containsString("state=")))
        .andExpect(
            jsonPath("$.redirectUrl")
                .value(org.hamcrest.Matchers.startsWith("http://localhost:9999/callback?code=")));
  }

  @Test
  void authorizeConfirm_WithRedirectUriWithQuery_ShouldReturn200WithAmpersand() throws Exception {
    OAuthController.OAuthAuthorizeRequest request = new OAuthController.OAuthAuthorizeRequest();
    request.setPlainToken("fin_pat_abc123");
    request.setClientId("client-1");
    request.setRedirectUri("http://localhost:9999/callback?foo=bar");
    request.setCodeChallenge("challenge-with-query");
    request.setState("state2");
    request.setScope("read");

    mockMvc
        .perform(
            post("/oauth/authorize")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(
            jsonPath("$.redirectUrl")
                .value(
                    org.hamcrest.Matchers.startsWith(
                        "http://localhost:9999/callback?foo=bar&code=")))
        .andExpect(jsonPath("$.redirectUrl").value(org.hamcrest.Matchers.containsString("state=")));
  }

  @Test
  void authorizeConfirm_WithReplayedCodeChallenge_ShouldReturn400ReplayDetected() throws Exception {
    OAuthController.OAuthAuthorizeRequest request = new OAuthController.OAuthAuthorizeRequest();
    request.setPlainToken("fin_pat_abc123");
    request.setClientId("client-1");
    request.setRedirectUri("http://localhost:9999/callback");
    request.setCodeChallenge("replayed-challenge");
    request.setState("state3");
    request.setScope("read");

    // First call succeeds and stores the challenge.
    mockMvc
        .perform(
            post("/oauth/authorize")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk());

    // Second call with same code_challenge triggers replay detection.
    mockMvc
        .perform(
            post("/oauth/authorize")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("replay_detected"));
  }

  @Test
  void authorizeConfirm_WithNullUser_ShouldReturn401() {
    // The MockMvc argument resolver in BaseWebMvcTest always injects mockUser for
    // @AuthenticationPrincipal User params, so the null-user branch cannot be exercised
    // through MockMvc here. We invoke the controller method directly instead.
    OAuthController controller = new OAuthController(authCodeStore);
    OAuthController.OAuthAuthorizeRequest request = new OAuthController.OAuthAuthorizeRequest();
    request.setPlainToken("fin_pat_abc123");
    request.setClientId("client-1");
    request.setRedirectUri("http://localhost:9999/callback");
    request.setCodeChallenge("challenge-null-user");
    request.setState("state4");
    request.setScope("read");

    var response = controller.authorizeConfirm(request, null);

    assertThat(response.getStatusCode().value()).isEqualTo(401);
    @SuppressWarnings("unchecked")
    Map<String, Object> body = (Map<String, Object>) response.getBody();
    assertThat(body).containsEntry("error", "User must be logged in");
  }

  // ──────────────────────────────────────────────────────────────────────
  // POST /oauth/token
  // ──────────────────────────────────────────────────────────────────────

  @Test
  void tokenExchange_WithUnsupportedGrantType_ShouldReturn400() throws Exception {
    mockMvc
        .perform(
            post("/oauth/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("grant_type", "client_credentials")
                .param("code", "some-code")
                .param("redirect_uri", "http://localhost:9999/callback")
                .param("code_verifier", "verifier")
                .param("client_id", "client-1"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("unsupported_grant_type"));
  }

  @Test
  void tokenExchange_WithInvalidCode_ShouldReturn400InvalidGrant() throws Exception {
    mockMvc
        .perform(
            post("/oauth/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("grant_type", "authorization_code")
                .param("code", "unknown-code")
                .param("redirect_uri", "http://localhost:9999/callback")
                .param("code_verifier", "verifier")
                .param("client_id", "client-1"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("invalid_grant"))
        .andExpect(
            jsonPath("$.error_description")
                .value("Authorization code is invalid, expired, or already used"));
  }

  @Test
  void tokenExchange_WithClientIdMismatch_ShouldReturn400InvalidGrant() throws Exception {
    String code =
        authCodeStore.generateAndStore(
            "challenge-client-mismatch",
            "fin_pat_token",
            "correct-client",
            "http://localhost:9999/callback",
            "read");

    mockMvc
        .perform(
            post("/oauth/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("grant_type", "authorization_code")
                .param("code", code)
                .param("redirect_uri", "http://localhost:9999/callback")
                .param("code_verifier", "verifier")
                .param("client_id", "wrong-client"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("invalid_grant"))
        .andExpect(jsonPath("$.error_description").value("client_id mismatch"));
  }

  @Test
  void tokenExchange_WithRedirectUriMismatch_ShouldReturn400InvalidGrant() throws Exception {
    String code =
        authCodeStore.generateAndStore(
            "challenge-redirect-mismatch",
            "fin_pat_token",
            "client-1",
            "http://localhost:9999/callback",
            "read");

    mockMvc
        .perform(
            post("/oauth/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("grant_type", "authorization_code")
                .param("code", code)
                .param("redirect_uri", "http://localhost:9999/wrong-callback")
                .param("code_verifier", "verifier")
                .param("client_id", "client-1"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("invalid_grant"))
        .andExpect(jsonPath("$.error_description").value("redirect_uri mismatch"));
  }

  @Test
  void tokenExchange_WithWrongCodeVerifier_ShouldReturn400PkceFailure() throws Exception {
    String codeChallenge = computeCodeChallenge("correct-verifier");
    String code =
        authCodeStore.generateAndStore(
            codeChallenge, "fin_pat_token", "client-1", "http://localhost:9999/callback", "read");

    mockMvc
        .perform(
            post("/oauth/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("grant_type", "authorization_code")
                .param("code", code)
                .param("redirect_uri", "http://localhost:9999/callback")
                .param("code_verifier", "wrong-verifier")
                .param("client_id", "client-1"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("invalid_grant"))
        .andExpect(jsonPath("$.error_description").value("PKCE verification failed"));
  }

  @Test
  void fullFlow_AuthorizeThenTokenExchange_ShouldReturn200WithAccessToken() throws Exception {
    String codeVerifier = "my-super-secret-code-verifier-1234567890";
    String codeChallenge = computeCodeChallenge(codeVerifier);
    String redirectUri = "http://localhost:9999/callback";

    // Step 1: GET /oauth/authorize — just validates & redirects, doesn't store anything.
    mockMvc
        .perform(
            get("/oauth/authorize")
                .param("client_id", "client-full-flow")
                .param("redirect_uri", redirectUri)
                .param("code_challenge", codeChallenge)
                .param("state", "state-full-flow"))
        .andExpect(status().isFound());

    // Step 2: POST /oauth/authorize — stores the auth code entry.
    OAuthController.OAuthAuthorizeRequest request = new OAuthController.OAuthAuthorizeRequest();
    request.setPlainToken("fin_pat_full_flow_token");
    request.setClientId("client-full-flow");
    request.setRedirectUri(redirectUri);
    request.setCodeChallenge(codeChallenge);
    request.setState("state-full-flow");
    request.setScope("read write");

    MvcResult authorizeResult =
        mockMvc
            .perform(
                post("/oauth/authorize")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andReturn();

    ObjectMapper mapper = objectMapper;
    Map<?, ?> body =
        mapper.readValue(authorizeResult.getResponse().getContentAsString(), Map.class);
    String redirectUrl = (String) body.get("redirectUrl");
    String code = extractQueryParam(redirectUrl, "code");
    assertThat(code).isNotBlank();

    // Step 3: POST /oauth/token — exchanges the code for the access token.
    mockMvc
        .perform(
            post("/oauth/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("grant_type", "authorization_code")
                .param("code", code)
                .param("redirect_uri", redirectUri)
                .param("code_verifier", codeVerifier)
                .param("client_id", "client-full-flow"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.access_token").value("fin_pat_full_flow_token"))
        .andExpect(jsonPath("$.token_type").value("Bearer"))
        .andExpect(jsonPath("$.scope").value("read write"));
  }

  // ──────────────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────────────

  private static String computeCodeChallenge(String verifier) throws Exception {
    MessageDigest digest = MessageDigest.getInstance("SHA-256");
    byte[] hash = digest.digest(verifier.getBytes(StandardCharsets.US_ASCII));
    return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
  }

  private static String extractQueryParam(String url, String paramName) {
    String marker = paramName + "=";
    int idx = url.indexOf(marker);
    if (idx < 0) {
      return null;
    }
    int start = idx + marker.length();
    int end = url.indexOf('&', start);
    String raw = end < 0 ? url.substring(start) : url.substring(start, end);
    return java.net.URLDecoder.decode(raw, StandardCharsets.UTF_8);
  }
}
