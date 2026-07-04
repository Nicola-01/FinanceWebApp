package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.AuthResponse;
import dev.busato.FinanceWebApp.backend.dto.DeleteAccountRequest;
import dev.busato.FinanceWebApp.backend.dto.EmailChangeConfirmDto;
import dev.busato.FinanceWebApp.backend.dto.EmailChangeRequestDto;
import dev.busato.FinanceWebApp.backend.dto.UpdateUsernameRequest;
import dev.busato.FinanceWebApp.backend.dto.UserProfileResponse;
import dev.busato.FinanceWebApp.backend.mappers.UserMapper;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.security.JwtService;
import dev.busato.FinanceWebApp.backend.service.AccountDeletionService;
import dev.busato.FinanceWebApp.backend.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Current-user (self-service) account endpoints: profile read + username / email change. */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;
  private final AccountDeletionService accountDeletionService;
  private final UserMapper userMapper;
  private final JwtService jwtService;

  @Value("${application.frontend.url}")
  private String frontendUrl;

  private static final String REFRESH_TOKEN_COOKIE = "refresh_token";

  /** Returns the authenticated user's profile (email masked server-side). */
  @GetMapping("/me")
  public ResponseEntity<UserProfileResponse> me(@AuthenticationPrincipal User user) {
    return ResponseEntity.ok(userMapper.toProfileResponse(user));
  }

  /**
   * Changes the username. Because the username is the JWT subject, the existing tokens would stop
   * resolving the user after the rename — so we re-issue a fresh access token and rotate the
   * refresh cookie, keeping the session alive. The new access token is returned for the client to
   * store.
   */
  @PutMapping("/me/username")
  public ResponseEntity<AuthResponse> updateUsername(
      @AuthenticationPrincipal User user,
      @Valid @RequestBody UpdateUsernameRequest request,
      HttpServletResponse response) {
    User updated = userService.updateUsername(user, request.getUsername());

    Map<String, Object> extraClaims = new HashMap<>();
    extraClaims.put("role", updated.getRole());
    extraClaims.put("userId", updated.getId());
    String accessToken = jwtService.generateToken(extraClaims, updated);
    String refreshToken = jwtService.generateRefreshToken(updated);
    addRefreshTokenCookie(response, refreshToken);

    return ResponseEntity.ok(
        AuthResponse.builder()
            .token(accessToken)
            .role(String.valueOf(updated.getRole()))
            .passwordMustChange(updated.isPasswordMustChange())
            .build());
  }

  /**
   * Step 1 of the double-verification email change: emails a 6-digit code to BOTH the current and
   * the requested new address. Never returns the codes.
   */
  @PostMapping("/me/email/change-request")
  public ResponseEntity<Map<String, String>> requestEmailChange(
      @AuthenticationPrincipal User user, @Valid @RequestBody EmailChangeRequestDto request) {
    userService.requestEmailChange(user, request.getNewEmail());
    return ResponseEntity.ok(Map.of("message", "Verification codes sent"));
  }

  /**
   * Step 2 of the double-verification email change: both codes are checked and, if valid, the email
   * is switched. Returns the updated, masked profile. The email is not in the JWT, so the session
   * stays valid and no token reissue is needed.
   */
  @PostMapping("/me/email/change-confirm")
  public ResponseEntity<UserProfileResponse> confirmEmailChange(
      @AuthenticationPrincipal User user, @Valid @RequestBody EmailChangeConfirmDto request) {
    User updated =
        userService.confirmEmailChange(
            user, request.getCurrentEmailCode(), request.getNewEmailCode());
    return ResponseEntity.ok(userMapper.toProfileResponse(updated));
  }

  /** Cancels a pending email change, if any. */
  @DeleteMapping("/me/email/change")
  public ResponseEntity<Map<String, String>> cancelEmailChange(@AuthenticationPrincipal User user) {
    userService.cancelEmailChange(user);
    return ResponseEntity.ok(Map.of("message", "Email change cancelled"));
  }

  /**
   * Permanently deletes the authenticated user's own account (GDPR erasure). Requires the current
   * password for confirmation; on success the refresh cookie is cleared. Owned wallets are
   * transferred to another member when possible, otherwise deleted with all their data.
   */
  @DeleteMapping("/me")
  public ResponseEntity<Map<String, String>> deleteAccount(
      @AuthenticationPrincipal User user,
      @RequestBody DeleteAccountRequest request,
      HttpServletResponse response) {
    accountDeletionService.deleteAccount(user, request.getPassword());
    clearRefreshTokenCookie(response);
    return ResponseEntity.ok(Map.of("message", "Account deleted"));
  }

  // Mirrors AuthController's refresh-cookie shape (persistent, path=/api/auth).
  private void addRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
    boolean secure = frontendUrl != null && frontendUrl.startsWith("https");
    Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, refreshToken);
    cookie.setHttpOnly(true);
    cookie.setSecure(secure);
    cookie.setPath("/api/auth");
    cookie.setAttribute("SameSite", secure ? "Strict" : "Lax");
    cookie.setMaxAge((int) (jwtService.getRefreshExpiration() / 1000));
    response.addCookie(cookie);
  }

  // Mirrors AuthController's refresh-cookie clear (maxAge=0, same path=/api/auth).
  private void clearRefreshTokenCookie(HttpServletResponse response) {
    boolean secure = frontendUrl != null && frontendUrl.startsWith("https");
    Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, "");
    cookie.setHttpOnly(true);
    cookie.setSecure(secure);
    cookie.setPath("/api/auth");
    cookie.setAttribute("SameSite", secure ? "Strict" : "Lax");
    cookie.setMaxAge(0);
    response.addCookie(cookie);
  }
}
