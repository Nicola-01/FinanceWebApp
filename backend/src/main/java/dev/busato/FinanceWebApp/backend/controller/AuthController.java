package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.*;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.security.JwtService;
import dev.busato.FinanceWebApp.backend.service.RegisterService;
import dev.busato.FinanceWebApp.backend.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthenticationManager authenticationManager;
  private final JwtService jwtService;
  private final UserService userService;
  private final RegisterService registerService;
  private final UserDetailsService userDetailsService;

  @Value("${application.frontend.url}")
  private String frontendUrl;

  private static final String REFRESH_TOKEN_COOKIE = "refresh_token";

  // ==================== LOGIN ====================

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(
      @RequestBody LoginRequest request, HttpServletResponse response) {
    Authentication authentication =
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

    User user = (User) authentication.getPrincipal();

    Map<String, Object> extraClaims = new HashMap<>();
    extraClaims.put("role", user.getRole());
    extraClaims.put("userId", user.getId());
    // tokenVersion viene aggiunto automaticamente da JwtService

    String accessToken = jwtService.generateToken(extraClaims, user);
    String refreshToken = jwtService.generateRefreshToken(user);

    addRefreshTokenCookie(response, refreshToken, request.isRememberMe());

    return ResponseEntity.ok(
        AuthResponse.builder()
            .token(accessToken)
            .role(String.valueOf(user.getRole()))
            .passwordMustChange(user.isPasswordMustChange())
            .build());
  }

  // ==================== REFRESH ====================

  @PostMapping("/refresh")
  public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {
    // 1. Legge il refresh token dal cookie
    String refreshToken = extractRefreshTokenFromCookie(request);
    if (refreshToken == null) {
      return ResponseEntity.status(401).body(Map.of("message", "Refresh token not found"));
    }

    // 2. Verifica che sia effettivamente un refresh token
    if (!jwtService.isRefreshToken(refreshToken)) {
      return ResponseEntity.status(401).body(Map.of("message", "Invalid token type"));
    }

    // 3. Estrae lo username e carica l'utente
    String username;
    try {
      username = jwtService.extractUsername(refreshToken);
    } catch (Exception e) {
      clearRefreshTokenCookie(response);
      return ResponseEntity.status(401).body(Map.of("message", "Invalid refresh token"));
    }

    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

    // 4. Valida il refresh token (include controllo tokenVersion)
    if (!jwtService.isTokenValid(refreshToken, userDetails)) {
      clearRefreshTokenCookie(response);
      return ResponseEntity.status(401).body(Map.of("message", "Refresh token expired or revoked"));
    }

    // 5. Genera nuovo access token
    User user = (User) userDetails;
    Map<String, Object> extraClaims = new HashMap<>();
    extraClaims.put("role", user.getRole());
    extraClaims.put("userId", user.getId());

    String newAccessToken = jwtService.generateToken(extraClaims, user);

    // 6. Refresh Token Rotation: ruota solo se siamo nella finestra di rinnovo (ultimi 7 giorni)
    //    - Prima dei 7 giorni finali: emette solo un nuovo access token, il refresh token resta
    // invariato
    //    - Negli ultimi 7 giorni: emette anche un nuovo refresh token (30 giorni freschi)
    //    Questo permette all'utente di restare loggato indefinitamente finché usa l'app
    if (jwtService.isInRenewalWindow(refreshToken)) {
      String newRefreshToken = jwtService.generateRefreshToken(user);
      addRefreshTokenCookie(response, newRefreshToken, true);
    }

    return ResponseEntity.ok(
        AuthResponse.builder()
            .token(newAccessToken)
            .role(String.valueOf(user.getRole()))
            .passwordMustChange(user.isPasswordMustChange())
            .build());
  }

  // ==================== LOGOUT ====================

  /**
   * Logout singolo dispositivo: cancella il cookie refresh_token. L'access token scadrà
   * naturalmente (15 min).
   */
  @PostMapping("/logout")
  public ResponseEntity<?> logout(HttpServletResponse response) {
    clearRefreshTokenCookie(response);
    return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
  }

  /**
   * Logout da TUTTI i dispositivi: incrementa tokenVersion. Tutti i JWT esistenti (access +
   * refresh) diventano invalidi immediatamente.
   */
  @PostMapping("/logout-all")
  public ResponseEntity<?> logoutAll(
      @AuthenticationPrincipal User user, HttpServletResponse response) {
    userService.incrementTokenVersion(user);
    clearRefreshTokenCookie(response);
    return ResponseEntity.ok(Map.of("message", "Logged out from all devices"));
  }

  // ==================== PASSWORD ====================

  @PostMapping("/change-password")
  public ResponseEntity<?> changePassword(
      @AuthenticationPrincipal User user,
      @RequestBody ChangePasswordRequest request,
      HttpServletResponse response) {
    // changePassword incrementa automaticamente tokenVersion
    userService.changePassword(user, request);
    clearRefreshTokenCookie(response);
    return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
  }

  // ==================== FORGOT / RESET PASSWORD ====================

  @PostMapping("/forgot-password")
  public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
    registerService.requestPasswordReset(request.getEmail());
    return ResponseEntity.ok(Map.of("message", "Password reset email sent successfully."));
  }

  @GetMapping("/reset-password/{token}")
  public ResponseEntity<RegisterInviteResponse> verifyResetToken(@PathVariable String token) {
    return ResponseEntity.ok(registerService.getResetPasswordInvite(token));
  }

  @PostMapping("/reset-password/{token}")
  public ResponseEntity<?> resetPassword(
      @PathVariable String token, @RequestBody ResetPasswordRequest request) {
    registerService.resetPassword(token, request);
    return ResponseEntity.ok(Map.of("message", "Password reset successfully. You can now log in."));
  }

  // ==================== REGISTRATION ====================

  @GetMapping("/register/{token}")
  public ResponseEntity<RegisterInviteResponse> registerViaInvite(@PathVariable String token) {
    return ResponseEntity.ok(registerService.getRegisterInvite(token));
  }

  @PostMapping("/register/{token}")
  public ResponseEntity<?> registerViaInvite(
      @PathVariable String token, @RequestBody RegisterInviteRequest request) {
    registerService.registerViaInvite(token, request);
    return ResponseEntity.ok(Map.of("message", "Registration successful"));
  }

  // ==================== HELPER METHODS ====================

  private boolean isSecureCookie() {
    return frontendUrl != null && frontendUrl.startsWith("https");
  }

  private void addRefreshTokenCookie(
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

  private void clearRefreshTokenCookie(HttpServletResponse response) {
    Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, "");
    cookie.setHttpOnly(true);
    cookie.setSecure(isSecureCookie());
    cookie.setPath("/api/auth");
    cookie.setAttribute("SameSite", isSecureCookie() ? "Strict" : "Lax");
    cookie.setMaxAge(0);
    response.addCookie(cookie);
  }

  private String extractRefreshTokenFromCookie(HttpServletRequest request) {
    if (request.getCookies() == null) return null;
    return Arrays.stream(request.getCookies())
        .filter(c -> REFRESH_TOKEN_COOKIE.equals(c.getName()))
        .map(Cookie::getValue)
        .findFirst()
        .orElse(null);
  }
}
