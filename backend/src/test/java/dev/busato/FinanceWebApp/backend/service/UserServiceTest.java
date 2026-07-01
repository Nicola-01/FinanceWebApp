package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dev.busato.FinanceWebApp.backend.dto.ChangePasswordRequest;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.repository.PersonalAccessTokenRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

  @Mock private PasswordEncoder passwordEncoder;
  @Mock private UserRepository userRepository;
  @Mock private PersonalAccessTokenRepository patRepository;

  @InjectMocks private UserService userService;

  private User user;
  private UUID userId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    user = new User();
    user.setId(userId);
    user.setUsername("testuser");
    user.setPassword("hashedOldPassword");
    user.setTokenVersion(1);
  }

  @Test
  void getTokenVersion_UserExists_ReturnsVersion() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    int version = userService.getTokenVersion(userId);
    assertEquals(1, version);
  }

  @Test
  void getTokenVersion_UserDoesNotExist_ReturnsMinusOne() {
    when(userRepository.findById(userId)).thenReturn(Optional.empty());
    int version = userService.getTokenVersion(userId);
    assertEquals(-1, version);
  }

  @Test
  void incrementTokenVersion_IncrementsAndClearsTokens() {
    userService.incrementTokenVersion(user);

    assertEquals(2, user.getTokenVersion());
    verify(userRepository).save(user);
    verify(patRepository).deleteAllByUserId(userId);
  }

  @Test
  void changePassword_ValidRequest_UpdatesPasswordAndVersion() {
    ChangePasswordRequest request = new ChangePasswordRequest();
    request.setCurrentPassword("oldPassword");
    request.setNewPassword("NewSecureP@ss1");
    request.setConfirmPassword("NewSecureP@ss1");

    when(passwordEncoder.matches("oldPassword", "hashedOldPassword")).thenReturn(true);
    when(passwordEncoder.encode("NewSecureP@ss1")).thenReturn("newHashedPassword");

    userService.changePassword(user, request);

    assertEquals("newHashedPassword", user.getPassword());
    assertFalse(user.isPasswordMustChange());
    assertEquals(2, user.getTokenVersion());
    verify(userRepository).save(user);
    verify(patRepository).deleteAllByUserId(userId);
  }

  @Test
  void changePassword_WrongCurrentPassword_ThrowsBadCredentialsException() {
    ChangePasswordRequest request = new ChangePasswordRequest();
    request.setCurrentPassword("wrong");

    when(passwordEncoder.matches("wrong", "hashedOldPassword")).thenReturn(false);

    assertThrows(BadCredentialsException.class, () -> userService.changePassword(user, request));
  }

  @Test
  void changePassword_PasswordsDoNotMatch_ThrowsIllegalArgumentException() {
    ChangePasswordRequest request = new ChangePasswordRequest();
    request.setCurrentPassword("oldPassword");
    request.setNewPassword("NewSecureP@ss1");
    request.setConfirmPassword("Different1!");

    when(passwordEncoder.matches("oldPassword", "hashedOldPassword")).thenReturn(true);

    assertThrows(IllegalArgumentException.class, () -> userService.changePassword(user, request));
  }

  @Test
  void changePassword_SamePassword_ThrowsIllegalArgumentException() {
    ChangePasswordRequest request = new ChangePasswordRequest();
    request.setCurrentPassword("oldPassword");
    request.setNewPassword("oldPassword");
    request.setConfirmPassword("oldPassword");

    when(passwordEncoder.matches("oldPassword", "hashedOldPassword")).thenReturn(true);

    assertThrows(IllegalArgumentException.class, () -> userService.changePassword(user, request));
  }

  @Test
  void changePassword_WeakPassword_ThrowsIllegalArgumentException() {
    ChangePasswordRequest request = new ChangePasswordRequest();
    request.setCurrentPassword("oldPassword");
    request.setNewPassword("weak");
    request.setConfirmPassword("weak");

    when(passwordEncoder.matches("oldPassword", "hashedOldPassword")).thenReturn(true);

    assertThrows(IllegalArgumentException.class, () -> userService.changePassword(user, request));
  }
}
