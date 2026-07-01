package dev.busato.FinanceWebApp.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.dto.AuthResponse;
import dev.busato.FinanceWebApp.backend.dto.ChangePasswordRequest;
import dev.busato.FinanceWebApp.backend.dto.LoginRequest;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.security.JwtService;
import dev.busato.FinanceWebApp.backend.service.RegisterService;
import dev.busato.FinanceWebApp.backend.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

  @Mock private AuthenticationManager authenticationManager;
  @Mock private JwtService jwtService;
  @Mock private UserService userService;
  @Mock private RegisterService registerService;

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
}
