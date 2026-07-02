package dev.busato.FinanceWebApp.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.dto.AuthResponse;
import dev.busato.FinanceWebApp.backend.dto.ChangePasswordRequest;
import dev.busato.FinanceWebApp.backend.dto.ForgotPasswordRequest;
import dev.busato.FinanceWebApp.backend.dto.LoginRequest;
import dev.busato.FinanceWebApp.backend.dto.RegisterInviteRequest;
import dev.busato.FinanceWebApp.backend.dto.RegisterInviteResponse;
import dev.busato.FinanceWebApp.backend.dto.ResetPasswordRequest;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.security.JwtService;
import dev.busato.FinanceWebApp.backend.service.RegisterService;
import dev.busato.FinanceWebApp.backend.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

  @Mock private AuthenticationManager authenticationManager;
  @Mock private JwtService jwtService;
  @Mock private UserService userService;
  @Mock private RegisterService registerService;
  @Mock private UserDetailsService userDetailsService;

  @InjectMocks private AuthController authController;

  private User user;

  @BeforeEach
  void setUp() {
    user = new User();
    user.setId(UUID.randomUUID());
    user.setUsername("testuser");
    user.setRole(User.Role.USER);
  }

  @Test
  void login_ValidCredentials_ReturnsTokens() {
    LoginRequest request = new LoginRequest();
    request.setUsername("testuser");
    request.setPassword("password");

    Authentication authentication = mock(Authentication.class);
    when(authentication.getPrincipal()).thenReturn(user);
    when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
        .thenReturn(authentication);

    when(jwtService.generateToken(any(), eq(user))).thenReturn("accessToken");
    when(jwtService.generateRefreshToken(user)).thenReturn("refreshToken");

    HttpServletResponse response = mock(HttpServletResponse.class);

    ResponseEntity<AuthResponse> res = authController.login(request, response);

    assertEquals(HttpStatus.OK, res.getStatusCode());
    assertEquals("accessToken", res.getBody().getToken());

    verify(response).addCookie(any(Cookie.class));
  }

  @Test
  void logoutAll_IncrementsVersionAndClearsCookie() {
    HttpServletResponse response = mock(HttpServletResponse.class);

    ResponseEntity<?> res = authController.logoutAll(user, response);

    assertEquals(HttpStatus.OK, res.getStatusCode());
    verify(userService).incrementTokenVersion(user);
    verify(response).addCookie(any(Cookie.class)); // clears cookie
  }

  @Test
  void changePassword_CallsService() {
    ChangePasswordRequest request = new ChangePasswordRequest();
    HttpServletResponse response = mock(HttpServletResponse.class);

    ResponseEntity<?> res = authController.changePassword(user, request, response);

    assertEquals(HttpStatus.OK, res.getStatusCode());
    verify(userService).changePassword(user, request);
  }

  // ==================== LOGIN (cookie branches) ====================

  @Test
  void login_RememberMeFalse_SetsSessionCookie() {
    LoginRequest request = new LoginRequest();
    request.setUsername("testuser");
    request.setPassword("password");
    request.setRememberMe(false);

    Authentication authentication = mock(Authentication.class);
    when(authentication.getPrincipal()).thenReturn(user);
    when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
        .thenReturn(authentication);

    when(jwtService.generateToken(any(), eq(user))).thenReturn("accessToken");
    when(jwtService.generateRefreshToken(user)).thenReturn("refreshToken");

    HttpServletResponse response = mock(HttpServletResponse.class);

    ResponseEntity<AuthResponse> res = authController.login(request, response);

    assertEquals(HttpStatus.OK, res.getStatusCode());

    ArgumentCaptor<Cookie> captor = ArgumentCaptor.forClass(Cookie.class);
    verify(response).addCookie(captor.capture());
    assertEquals(-1, captor.getValue().getMaxAge());
  }

  @Test
  void login_RememberMeTrue_SetsPersistentCookie() {
    LoginRequest request = new LoginRequest();
    request.setUsername("testuser");
    request.setPassword("password");
    request.setRememberMe(true);

    Authentication authentication = mock(Authentication.class);
    when(authentication.getPrincipal()).thenReturn(user);
    when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
        .thenReturn(authentication);

    when(jwtService.generateToken(any(), eq(user))).thenReturn("accessToken");
    when(jwtService.generateRefreshToken(user)).thenReturn("refreshToken");
    when(jwtService.getRefreshExpiration()).thenReturn(2592000000L);

    HttpServletResponse response = mock(HttpServletResponse.class);

    ResponseEntity<AuthResponse> res = authController.login(request, response);

    assertEquals(HttpStatus.OK, res.getStatusCode());

    ArgumentCaptor<Cookie> captor = ArgumentCaptor.forClass(Cookie.class);
    verify(response).addCookie(captor.capture());
    assertEquals(2592000, captor.getValue().getMaxAge());
  }

  // ==================== REFRESH ====================

  @Test
  void refreshToken_NoCookies_Returns401() {
    HttpServletRequest request = mock(HttpServletRequest.class);
    HttpServletResponse response = mock(HttpServletResponse.class);
    when(request.getCookies()).thenReturn(null);

    ResponseEntity<?> res = authController.refreshToken(request, response);

    assertEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode());
    assertEquals(java.util.Map.of("message", "Refresh token not found"), res.getBody());
  }

  @Test
  void refreshToken_NoMatchingCookie_Returns401() {
    HttpServletRequest request = mock(HttpServletRequest.class);
    HttpServletResponse response = mock(HttpServletResponse.class);
    Cookie[] cookies = {new Cookie("other_cookie", "value")};
    when(request.getCookies()).thenReturn(cookies);

    ResponseEntity<?> res = authController.refreshToken(request, response);

    assertEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode());
    assertEquals(java.util.Map.of("message", "Refresh token not found"), res.getBody());
  }

  @Test
  void refreshToken_NotARefreshToken_Returns401() {
    HttpServletRequest request = mock(HttpServletRequest.class);
    HttpServletResponse response = mock(HttpServletResponse.class);
    Cookie[] cookies = {new Cookie("refresh_token", "sometoken")};
    when(request.getCookies()).thenReturn(cookies);
    when(jwtService.isRefreshToken("sometoken")).thenReturn(false);

    ResponseEntity<?> res = authController.refreshToken(request, response);

    assertEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode());
    assertEquals(java.util.Map.of("message", "Invalid token type"), res.getBody());
  }

  @Test
  void refreshToken_ExtractUsernameThrows_Returns401AndClearsCookie() {
    HttpServletRequest request = mock(HttpServletRequest.class);
    HttpServletResponse response = mock(HttpServletResponse.class);
    Cookie[] cookies = {new Cookie("refresh_token", "sometoken")};
    when(request.getCookies()).thenReturn(cookies);
    when(jwtService.isRefreshToken("sometoken")).thenReturn(true);
    when(jwtService.extractUsername("sometoken")).thenThrow(new RuntimeException("bad token"));

    ResponseEntity<?> res = authController.refreshToken(request, response);

    assertEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode());
    assertEquals(java.util.Map.of("message", "Invalid refresh token"), res.getBody());
    verify(response).addCookie(any(Cookie.class));
  }

  @Test
  void refreshToken_InvalidToken_Returns401AndClearsCookie() {
    HttpServletRequest request = mock(HttpServletRequest.class);
    HttpServletResponse response = mock(HttpServletResponse.class);
    Cookie[] cookies = {new Cookie("refresh_token", "sometoken")};
    when(request.getCookies()).thenReturn(cookies);
    when(jwtService.isRefreshToken("sometoken")).thenReturn(true);
    when(jwtService.extractUsername("sometoken")).thenReturn("testuser");
    when(userDetailsService.loadUserByUsername("testuser")).thenReturn(user);
    when(jwtService.isTokenValid("sometoken", user)).thenReturn(false);

    ResponseEntity<?> res = authController.refreshToken(request, response);

    assertEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode());
    assertEquals(java.util.Map.of("message", "Refresh token expired or revoked"), res.getBody());
    verify(response).addCookie(any(Cookie.class));
  }

  @Test
  void refreshToken_ValidNotInRenewalWindow_ReturnsNewAccessTokenOnly() {
    HttpServletRequest request = mock(HttpServletRequest.class);
    HttpServletResponse response = mock(HttpServletResponse.class);
    Cookie[] cookies = {new Cookie("refresh_token", "sometoken")};
    when(request.getCookies()).thenReturn(cookies);
    when(jwtService.isRefreshToken("sometoken")).thenReturn(true);
    when(jwtService.extractUsername("sometoken")).thenReturn("testuser");
    when(userDetailsService.loadUserByUsername("testuser")).thenReturn(user);
    when(jwtService.isTokenValid("sometoken", user)).thenReturn(true);
    when(jwtService.generateToken(any(), eq(user))).thenReturn("newAccessToken");
    when(jwtService.isInRenewalWindow("sometoken")).thenReturn(false);

    ResponseEntity<?> res = authController.refreshToken(request, response);

    assertEquals(HttpStatus.OK, res.getStatusCode());
    AuthResponse body = (AuthResponse) res.getBody();
    assertEquals("newAccessToken", body.getToken());

    verify(jwtService, never()).generateRefreshToken(any());
    verify(response, never()).addCookie(any(Cookie.class));
  }

  @Test
  void refreshToken_ValidInRenewalWindow_RotatesRefreshToken() {
    HttpServletRequest request = mock(HttpServletRequest.class);
    HttpServletResponse response = mock(HttpServletResponse.class);
    Cookie[] cookies = {new Cookie("refresh_token", "sometoken")};
    when(request.getCookies()).thenReturn(cookies);
    when(jwtService.isRefreshToken("sometoken")).thenReturn(true);
    when(jwtService.extractUsername("sometoken")).thenReturn("testuser");
    when(userDetailsService.loadUserByUsername("testuser")).thenReturn(user);
    when(jwtService.isTokenValid("sometoken", user)).thenReturn(true);
    when(jwtService.generateToken(any(), eq(user))).thenReturn("newAccessToken");
    when(jwtService.isInRenewalWindow("sometoken")).thenReturn(true);
    when(jwtService.generateRefreshToken(user)).thenReturn("rotatedRefreshToken");

    ResponseEntity<?> res = authController.refreshToken(request, response);

    assertEquals(HttpStatus.OK, res.getStatusCode());
    AuthResponse body = (AuthResponse) res.getBody();
    assertEquals("newAccessToken", body.getToken());

    verify(jwtService).generateRefreshToken(user);
    verify(response).addCookie(any(Cookie.class));
  }

  // ==================== LOGOUT ====================

  @Test
  void logout_ClearsCookieAndReturnsMessage() {
    HttpServletResponse response = mock(HttpServletResponse.class);

    ResponseEntity<?> res = authController.logout(response);

    assertEquals(HttpStatus.OK, res.getStatusCode());
    assertEquals(java.util.Map.of("message", "Logged out successfully"), res.getBody());
    verify(response).addCookie(any(Cookie.class));
  }

  // ==================== FORGOT / RESET PASSWORD ====================

  @Test
  void forgotPassword_CallsService() {
    ForgotPasswordRequest request = new ForgotPasswordRequest();
    request.setEmail("test@example.com");

    ResponseEntity<?> res = authController.forgotPassword(request);

    assertEquals(HttpStatus.OK, res.getStatusCode());
    verify(registerService).requestPasswordReset("test@example.com");
  }

  @Test
  void verifyResetToken_ReturnsInviteResponse() {
    RegisterInviteResponse invite =
        RegisterInviteResponse.builder().email("test@example.com").status("PENDING").build();
    when(registerService.getResetPasswordInvite("token123")).thenReturn(invite);

    ResponseEntity<RegisterInviteResponse> res = authController.verifyResetToken("token123");

    assertEquals(HttpStatus.OK, res.getStatusCode());
    assertEquals(invite, res.getBody());
    verify(registerService).getResetPasswordInvite("token123");
  }

  @Test
  void resetPassword_CallsService() {
    ResetPasswordRequest request = new ResetPasswordRequest();
    request.setNewPassword("newPass123");
    request.setConfirmPassword("newPass123");

    ResponseEntity<?> res = authController.resetPassword("token123", request);

    assertEquals(HttpStatus.OK, res.getStatusCode());
    verify(registerService).resetPassword("token123", request);
  }

  // ==================== REGISTRATION ====================

  @Test
  void registerViaInvite_Get_ReturnsInvite() {
    RegisterInviteResponse invite =
        RegisterInviteResponse.builder().email("invitee@example.com").status("PENDING").build();
    when(registerService.getRegisterInvite("token123")).thenReturn(invite);

    ResponseEntity<RegisterInviteResponse> res = authController.registerViaInvite("token123");

    assertEquals(HttpStatus.OK, res.getStatusCode());
    assertEquals(invite, res.getBody());
    verify(registerService).getRegisterInvite("token123");
  }

  @Test
  void registerViaInvite_Post_CallsService() {
    RegisterInviteRequest request = new RegisterInviteRequest();
    request.setUsername("newuser");
    request.setPassword("password123");

    ResponseEntity<?> res = authController.registerViaInvite("token123", request);

    assertEquals(HttpStatus.OK, res.getStatusCode());
    verify(registerService).registerViaInvite("token123", request);
  }

  // ==================== SECURE COOKIE BRANCH ====================

  @Test
  void login_HttpsFrontendUrl_UsesSecureCookie() {
    ReflectionTestUtils.setField(authController, "frontendUrl", "https://example.com");

    LoginRequest request = new LoginRequest();
    request.setUsername("testuser");
    request.setPassword("password");

    Authentication authentication = mock(Authentication.class);
    when(authentication.getPrincipal()).thenReturn(user);
    when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
        .thenReturn(authentication);

    when(jwtService.generateToken(any(), eq(user))).thenReturn("accessToken");
    when(jwtService.generateRefreshToken(user)).thenReturn("refreshToken");

    HttpServletResponse response = mock(HttpServletResponse.class);

    ResponseEntity<AuthResponse> res = authController.login(request, response);

    assertEquals(HttpStatus.OK, res.getStatusCode());

    ArgumentCaptor<Cookie> captor = ArgumentCaptor.forClass(Cookie.class);
    verify(response).addCookie(captor.capture());
    assertEquals(true, captor.getValue().getSecure());
  }
}
