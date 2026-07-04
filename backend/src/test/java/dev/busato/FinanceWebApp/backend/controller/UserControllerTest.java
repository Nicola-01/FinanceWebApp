package dev.busato.FinanceWebApp.backend.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

  @Mock private UserService userService;
  @Mock private AccountDeletionService accountDeletionService;
  @Mock private UserMapper userMapper;
  @Mock private JwtService jwtService;

  @InjectMocks private UserController userController;

  private User user;

  @BeforeEach
  void setUp() {
    user = new User();
    user.setId(UUID.randomUUID());
    user.setUsername("testuser");
    user.setRole(User.Role.USER);
  }

  @Test
  void me_ReturnsMappedProfile() {
    UserProfileResponse profile =
        UserProfileResponse.builder().username("testuser").email("t***r@example.com").build();
    when(userMapper.toProfileResponse(user)).thenReturn(profile);

    ResponseEntity<UserProfileResponse> res = userController.me(user);

    assertEquals(HttpStatus.OK, res.getStatusCode());
    assertSame(profile, res.getBody());
  }

  @Test
  void updateUsername_ReIssuesTokensAndRotatesCookie() {
    UpdateUsernameRequest request = new UpdateUsernameRequest();
    request.setUsername("newname");

    User updated = new User();
    updated.setId(user.getId());
    updated.setUsername("newname");
    updated.setRole(User.Role.USER);

    when(userService.updateUsername(user, "newname")).thenReturn(updated);
    when(jwtService.generateToken(any(), eq(updated))).thenReturn("newAccessToken");
    when(jwtService.generateRefreshToken(updated)).thenReturn("newRefreshToken");
    when(jwtService.getRefreshExpiration()).thenReturn(2592000000L);

    HttpServletResponse response = org.mockito.Mockito.mock(HttpServletResponse.class);

    ResponseEntity<AuthResponse> res = userController.updateUsername(user, request, response);

    assertEquals(HttpStatus.OK, res.getStatusCode());
    assertEquals("newAccessToken", res.getBody().getToken());
    verify(userService).updateUsername(user, "newname");
    verify(response).addCookie(any(Cookie.class));
  }

  @Test
  void requestEmailChange_ReturnsMessageAndDelegates() {
    EmailChangeRequestDto request = new EmailChangeRequestDto();
    request.setNewEmail("new@example.com");

    ResponseEntity<java.util.Map<String, String>> res =
        userController.requestEmailChange(user, request);

    assertEquals(HttpStatus.OK, res.getStatusCode());
    assertEquals("Verification codes sent", res.getBody().get("message"));
    verify(userService).requestEmailChange(user, "new@example.com");
  }

  @Test
  void confirmEmailChange_ReturnsMappedProfile() {
    EmailChangeConfirmDto request = new EmailChangeConfirmDto();
    request.setCurrentEmailCode("111111");
    request.setNewEmailCode("222222");

    User updated = new User();
    updated.setId(user.getId());
    updated.setEmail("new@example.com");

    UserProfileResponse profile = UserProfileResponse.builder().email("n***w@example.com").build();

    when(userService.confirmEmailChange(user, "111111", "222222")).thenReturn(updated);
    when(userMapper.toProfileResponse(updated)).thenReturn(profile);

    ResponseEntity<UserProfileResponse> res = userController.confirmEmailChange(user, request);

    assertEquals(HttpStatus.OK, res.getStatusCode());
    assertSame(profile, res.getBody());
  }

  @Test
  void cancelEmailChange_ReturnsMessageAndDelegates() {
    ResponseEntity<java.util.Map<String, String>> res = userController.cancelEmailChange(user);

    assertEquals(HttpStatus.OK, res.getStatusCode());
    assertEquals("Email change cancelled", res.getBody().get("message"));
    verify(userService).cancelEmailChange(user);
  }

  // ==================== DELETE ACCOUNT ====================

  @Test
  void deleteAccount_Success_ClearsCookieAndReturnsOk() {
    DeleteAccountRequest request = new DeleteAccountRequest();
    request.setPassword("MyPassw0rd!");

    HttpServletResponse response = org.mockito.Mockito.mock(HttpServletResponse.class);

    ResponseEntity<java.util.Map<String, String>> res =
        userController.deleteAccount(user, request, response);

    assertEquals(HttpStatus.OK, res.getStatusCode());
    assertEquals("Account deleted", res.getBody().get("message"));
    verify(accountDeletionService).deleteAccount(user, "MyPassw0rd!");
    verify(response).addCookie(any(Cookie.class));
  }

  @Test
  void deleteAccount_WrongPassword_PropagatesAndDoesNotClearCookie() {
    DeleteAccountRequest request = new DeleteAccountRequest();
    request.setPassword("wrong");

    HttpServletResponse response = org.mockito.Mockito.mock(HttpServletResponse.class);

    doThrow(new BadCredentialsException("Password is incorrect"))
        .when(accountDeletionService)
        .deleteAccount(user, "wrong");

    assertThrows(
        BadCredentialsException.class, () -> userController.deleteAccount(user, request, response));

    verify(response, never()).addCookie(any(Cookie.class));
  }
}
