package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dev.busato.FinanceWebApp.backend.dto.ChangePasswordRequest;
import dev.busato.FinanceWebApp.backend.exceptions.UserAlreadyExistsException;
import dev.busato.FinanceWebApp.backend.model.EmailChangeRequest;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.repository.EmailChangeRequestRepository;
import dev.busato.FinanceWebApp.backend.repository.PersonalAccessTokenRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
  @Mock private EmailChangeRequestRepository emailChangeRepository;
  @Mock private SendEmailService sendEmailService;

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

  // ==================== UPDATE USERNAME ====================

  @Test
  void updateUsername_Valid_TrimsUpdatesAndSaves() {
    when(userRepository.existsByUsernameIgnoreCase("newname")).thenReturn(false);
    when(userRepository.save(user)).thenReturn(user);

    User result = userService.updateUsername(user, "  newname  ");

    assertEquals("newname", result.getUsername());
    assertEquals("newname", user.getUsername());
    verify(userRepository).save(user);
  }

  @Test
  void updateUsername_Blank_ThrowsIllegalArgumentException() {
    assertThrows(IllegalArgumentException.class, () -> userService.updateUsername(user, "   "));
  }

  @Test
  void updateUsername_Duplicate_ThrowsUserAlreadyExistsException() {
    when(userRepository.existsByUsernameIgnoreCase("taken")).thenReturn(true);
    assertThrows(UserAlreadyExistsException.class, () -> userService.updateUsername(user, "taken"));
  }

  @Test
  void updateUsername_SameIgnoreCase_UpdatesCasingWithoutDuplicateCheck() {
    when(userRepository.save(user)).thenReturn(user);

    User result = userService.updateUsername(user, "TestUser");

    assertEquals("TestUser", result.getUsername());
    verify(userRepository, never()).existsByUsernameIgnoreCase(anyString());
  }

  // ==================== REQUEST EMAIL CHANGE ====================

  @Test
  void requestEmailChange_SameEmailIgnoreCase_Throws() {
    user.setEmail("me@example.com");

    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () -> userService.requestEmailChange(user, "ME@example.com"));
    assertEquals("New email must be different from the current one", ex.getMessage());
    verify(emailChangeRepository, never()).save(org.mockito.ArgumentMatchers.any());
  }

  @Test
  void requestEmailChange_DuplicateEmail_Throws() {
    user.setEmail("old@example.com");
    when(userRepository.existsByEmailIgnoreCase("taken@example.com")).thenReturn(true);

    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () -> userService.requestEmailChange(user, "taken@example.com"));
    assertEquals("This email is already in use", ex.getMessage());
    verify(emailChangeRepository, never()).save(org.mockito.ArgumentMatchers.any());
  }

  @Test
  void requestEmailChange_Valid_PersistsHashedCodesReplacesPreviousAndSendsBoth() throws Exception {
    user.setEmail("old@example.com");
    when(userRepository.existsByEmailIgnoreCase("new@example.com")).thenReturn(false);

    userService.requestEmailChange(user, "  new@example.com  ");

    // Any previous pending request is dropped first.
    verify(emailChangeRepository).deleteByUserId(userId);

    ArgumentCaptor<EmailChangeRequest> captor = ArgumentCaptor.forClass(EmailChangeRequest.class);
    verify(emailChangeRepository).save(captor.capture());
    EmailChangeRequest saved = captor.getValue();
    assertEquals(userId, saved.getUserId());
    assertEquals("new@example.com", saved.getNewEmail());
    assertEquals(0, saved.getAttempts());
    // Codes are stored hashed (SHA-256 hex = 64 chars), never in plaintext.
    assertNotNull(saved.getCurrentCodeHash());
    assertEquals(64, saved.getCurrentCodeHash().length());
    assertNotNull(saved.getNewCodeHash());
    assertEquals(64, saved.getNewCodeHash().length());
    assertNotEquals(saved.getCurrentCodeHash(), saved.getNewCodeHash());
    assertTrue(saved.getExpiresAt().isAfter(LocalDateTime.now()));

    // One code to the current address, another to the new address.
    verify(sendEmailService).sendEmailChangeCode(eq("old@example.com"), anyString(), eq(false));
    verify(sendEmailService).sendEmailChangeCode(eq("new@example.com"), anyString(), eq(true));
  }

  @Test
  void requestEmailChange_EmailSendFails_ThrowsRuntimeException() throws Exception {
    user.setEmail("old@example.com");
    when(userRepository.existsByEmailIgnoreCase("new@example.com")).thenReturn(false);
    doThrow(new jakarta.mail.MessagingException("smtp down"))
        .when(sendEmailService)
        .sendEmailChangeCode(anyString(), anyString(), anyBoolean());

    assertThrows(
        RuntimeException.class, () -> userService.requestEmailChange(user, "new@example.com"));
  }

  // ==================== CONFIRM EMAIL CHANGE ====================

  private EmailChangeRequest pendingRequest() {
    return EmailChangeRequest.builder()
        .id(UUID.randomUUID())
        .userId(userId)
        .newEmail("new@example.com")
        .currentCodeHash(PatService.hashToken("111111"))
        .newCodeHash(PatService.hashToken("222222"))
        .expiresAt(LocalDateTime.now().plusMinutes(10))
        .attempts(0)
        .build();
  }

  @Test
  void confirmEmailChange_NoPending_Throws() {
    when(emailChangeRepository.findByUserId(userId)).thenReturn(Optional.empty());

    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () -> userService.confirmEmailChange(user, "111111", "222222"));
    assertEquals("No pending email change", ex.getMessage());
  }

  @Test
  void confirmEmailChange_Expired_DeletesAndThrows() {
    EmailChangeRequest request = pendingRequest();
    request.setExpiresAt(LocalDateTime.now().minusMinutes(1));
    when(emailChangeRepository.findByUserId(userId)).thenReturn(Optional.of(request));

    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () -> userService.confirmEmailChange(user, "111111", "222222"));
    assertEquals("Verification codes have expired", ex.getMessage());
    verify(emailChangeRepository).deleteByUserId(userId);
  }

  @Test
  void confirmEmailChange_TooManyAttempts_DeletesAndThrows() {
    EmailChangeRequest request = pendingRequest();
    request.setAttempts(5); // increment → 6 → over the limit
    when(emailChangeRepository.findByUserId(userId)).thenReturn(Optional.of(request));

    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () -> userService.confirmEmailChange(user, "111111", "222222"));
    assertEquals("Too many attempts", ex.getMessage());
    verify(emailChangeRepository).deleteByUserId(userId);
    verify(emailChangeRepository, never()).save(org.mockito.ArgumentMatchers.any());
  }

  @Test
  void confirmEmailChange_EmailTakenOnRecheck_ThrowsAndPersistsAttempt() {
    EmailChangeRequest request = pendingRequest();
    when(emailChangeRepository.findByUserId(userId)).thenReturn(Optional.of(request));
    when(userRepository.existsByEmailIgnoreCase("new@example.com")).thenReturn(true);

    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () -> userService.confirmEmailChange(user, "111111", "222222"));
    assertEquals("This email is already in use", ex.getMessage());
    assertEquals(1, request.getAttempts());
    verify(emailChangeRepository).save(request);
  }

  @Test
  void confirmEmailChange_WrongCode_ThrowsAndIncrementsAttempts() {
    EmailChangeRequest request = pendingRequest();
    when(emailChangeRepository.findByUserId(userId)).thenReturn(Optional.of(request));
    when(userRepository.existsByEmailIgnoreCase("new@example.com")).thenReturn(false);

    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () -> userService.confirmEmailChange(user, "000000", "222222"));
    assertEquals("Invalid verification code", ex.getMessage());
    assertEquals(1, request.getAttempts());
    verify(emailChangeRepository).save(request);
    verify(userRepository, never()).save(user);
  }

  @Test
  void confirmEmailChange_BothCodesValid_UpdatesEmailAndDeletesPending() {
    user.setEmail("old@example.com");
    EmailChangeRequest request = pendingRequest();
    when(emailChangeRepository.findByUserId(userId)).thenReturn(Optional.of(request));
    when(userRepository.existsByEmailIgnoreCase("new@example.com")).thenReturn(false);
    when(userRepository.save(user)).thenReturn(user);

    User result = userService.confirmEmailChange(user, "111111", "222222");

    assertEquals("new@example.com", result.getEmail());
    assertEquals("new@example.com", user.getEmail());
    verify(userRepository).save(user);
    verify(emailChangeRepository).deleteByUserId(userId);
  }

  // ==================== CANCEL EMAIL CHANGE ====================

  @Test
  void cancelEmailChange_DeletesPending() {
    userService.cancelEmailChange(user);
    verify(emailChangeRepository).deleteByUserId(userId);
  }
}
