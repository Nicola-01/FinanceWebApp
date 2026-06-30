package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.RegisterInviteRequest;
import dev.busato.FinanceWebApp.backend.dto.RegisterInviteResponse;
import dev.busato.FinanceWebApp.backend.dto.ResetPasswordRequest;
import dev.busato.FinanceWebApp.backend.model.Registrations;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.repository.PersonalAccessTokenRepository;
import dev.busato.FinanceWebApp.backend.repository.RegistrationsRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RegisterServiceTest {

    @Mock
    private RegistrationsRepository userInvitationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private DemoService demoService;
    @Mock
    private SendEmailService sendEmailService;
    @Mock
    private CacheManager cacheManager;
    @Mock
    private PersonalAccessTokenRepository patRepository;

    @InjectMocks
    private RegisterService registerService;

    private Registrations validRegistration;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(registerService, "frontendUrl", "http://localhost:3000");

        validRegistration = new Registrations();
        validRegistration.setToken("validToken");
        validRegistration.setEmail("test@example.com");
        validRegistration.setStatus(Registrations.InvitationStatus.PENDING);
        validRegistration.setCreatedAt(LocalDateTime.now().minusMinutes(5));
        validRegistration.setExpiresAt(LocalDateTime.now().plusDays(1));
    }

    @Test
    void getRegisterInvite_ValidToken_ReturnsResponse() {
        when(userInvitationRepository.findByToken("validToken")).thenReturn(Optional.of(validRegistration));

        RegisterInviteResponse response = registerService.getRegisterInvite("validToken");

        assertNotNull(response);
        assertEquals("te***@example.com", response.getEmail());
        assertEquals("PENDING", response.getStatus());
    }

    @Test
    void registerViaInvite_ValidRequest_RegistersUser() {
        when(userInvitationRepository.findByToken("validToken")).thenReturn(Optional.of(validRegistration));
        when(userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase("newuser", "newuser")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("ValidP@ss1")).thenReturn("hashedPassword");

        RegisterInviteRequest request = new RegisterInviteRequest();
        request.setUsername("newuser");
        request.setPassword("ValidP@ss1");

        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        registerService.registerViaInvite("validToken", request);

        verify(userRepository).save(any(User.class));
        verify(demoService).generateDemoWallet(any(UUID.class));
        assertEquals(Registrations.InvitationStatus.ACCEPTED, validRegistration.getStatus());
    }

    @Test
    void registerViaInvite_ExpiredToken_ThrowsException() {
        validRegistration.setExpiresAt(LocalDateTime.now().minusDays(1));
        when(userInvitationRepository.findByToken("validToken")).thenReturn(Optional.of(validRegistration));

        RegisterInviteRequest request = new RegisterInviteRequest();

        assertThrows(IllegalArgumentException.class, () -> registerService.registerViaInvite("validToken", request));
    }

    @Test
    void requestPasswordReset_ValidEmail_SendsEmail() throws Exception {
        User user = new User();
        user.setEmail("test@example.com");

        when(userRepository.findByEmailIgnoreCase("test@example.com")).thenReturn(Optional.of(user));
        when(userInvitationRepository.findByEmailIgnoreCaseAndStatus("test@example.com", Registrations.InvitationStatus.FORGOTPASSWORD))
                .thenReturn(Optional.empty());

        registerService.requestPasswordReset("test@example.com");

        verify(userInvitationRepository).save(any(Registrations.class));
        verify(sendEmailService).sendForgotPasswordEmail(eq("test@example.com"), anyString(), any());
    }

    @Test
    void requestPasswordReset_CooldownActive_ThrowsException() {
        User user = new User();
        user.setEmail("test@example.com");

        Registrations existing = new Registrations();
        existing.setCreatedAt(LocalDateTime.now().minusSeconds(30)); // 30 seconds ago

        when(userRepository.findByEmailIgnoreCase("test@example.com")).thenReturn(Optional.of(user));
        when(userInvitationRepository.findByEmailIgnoreCaseAndStatus("test@example.com", Registrations.InvitationStatus.FORGOTPASSWORD))
                .thenReturn(Optional.of(existing));

        assertThrows(IllegalArgumentException.class, () -> registerService.requestPasswordReset("test@example.com"));
    }

    @Test
    void resetPassword_ValidRequest_UpdatesPassword() {
        validRegistration.setStatus(Registrations.InvitationStatus.FORGOTPASSWORD);
        when(userInvitationRepository.findByToken("validToken")).thenReturn(Optional.of(validRegistration));

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("test@example.com");
        user.setTokenVersion(1);

        when(userRepository.findByEmailIgnoreCase("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("NewSecureP@ss1")).thenReturn("hashedPassword");

        Cache mockCache = mock(Cache.class);
        when(cacheManager.getCache("tokenVersions")).thenReturn(mockCache);

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setNewPassword("NewSecureP@ss1");
        request.setConfirmPassword("NewSecureP@ss1");

        registerService.resetPassword("validToken", request);

        assertEquals("hashedPassword", user.getPassword());
        assertEquals(2, user.getTokenVersion());
        verify(userRepository).save(user);
        verify(patRepository).deleteAllByUserId(user.getId());
        verify(mockCache).evict(user.getId());
        assertEquals(Registrations.InvitationStatus.ACCEPTED, validRegistration.getStatus());
    }

    // ==================== getRegisterInvite — edge cases ====================

    @Test
    void getRegisterInvite_InvalidToken_ThrowsException() {
        when(userInvitationRepository.findByToken("badToken")).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> registerService.getRegisterInvite("badToken"));
    }

    // ==================== registerViaInvite — edge cases ====================

    @Test
    void registerViaInvite_StatusRevoked_ThrowsException() {
        validRegistration.setStatus(Registrations.InvitationStatus.REVOKED);
        when(userInvitationRepository.findByToken("validToken")).thenReturn(Optional.of(validRegistration));

        RegisterInviteRequest request = new RegisterInviteRequest();
        assertThrows(IllegalArgumentException.class, () -> registerService.registerViaInvite("validToken", request));
    }

    @Test
    void registerViaInvite_UsernameTaken_ThrowsException() {
        when(userInvitationRepository.findByToken("validToken")).thenReturn(Optional.of(validRegistration));
        when(userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase("takenUser", "takenUser"))
                .thenReturn(Optional.of(new User()));

        RegisterInviteRequest request = new RegisterInviteRequest();
        request.setUsername("takenUser");
        request.setPassword("ValidP@ss1");

        assertThrows(IllegalArgumentException.class, () -> registerService.registerViaInvite("validToken", request));
    }

    @Test
    void registerViaInvite_TokenNotFound_ThrowsException() {
        when(userInvitationRepository.findByToken("unknown")).thenReturn(Optional.empty());

        RegisterInviteRequest request = new RegisterInviteRequest();
        assertThrows(IllegalArgumentException.class, () -> registerService.registerViaInvite("unknown", request));
    }

    // ==================== requestPasswordReset — edge cases ====================

    @Test
    void requestPasswordReset_EmailNotFound_ThrowsException() {
        when(userRepository.findByEmailIgnoreCase("unknown@x.com")).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> registerService.requestPasswordReset("unknown@x.com"));
    }

    @Test
    void requestPasswordReset_CooldownExpired_DeletesOldAndCreatesNew() throws Exception {
        User user = new User();
        user.setEmail("test@example.com");

        Registrations existing = new Registrations();
        existing.setCreatedAt(LocalDateTime.now().minusSeconds(120)); // 2 min ago → cooldown passed

        when(userRepository.findByEmailIgnoreCase("test@example.com")).thenReturn(Optional.of(user));
        when(userInvitationRepository.findByEmailIgnoreCaseAndStatus("test@example.com", Registrations.InvitationStatus.FORGOTPASSWORD))
                .thenReturn(Optional.of(existing));

        registerService.requestPasswordReset("test@example.com");

        verify(userInvitationRepository).deleteByEmailIgnoreCaseAndStatus("test@example.com", Registrations.InvitationStatus.FORGOTPASSWORD);
        verify(userInvitationRepository).save(any(Registrations.class));
    }

    @Test
    void requestPasswordReset_EmailSendFails_ThrowsRuntimeException() throws Exception {
        User user = new User();
        user.setEmail("test@example.com");

        when(userRepository.findByEmailIgnoreCase("test@example.com")).thenReturn(Optional.of(user));
        when(userInvitationRepository.findByEmailIgnoreCaseAndStatus(any(), any())).thenReturn(Optional.empty());

        doThrow(new RuntimeException("SMTP down")).when(sendEmailService).sendForgotPasswordEmail(any(), any(), any());

        assertThrows(RuntimeException.class, () -> registerService.requestPasswordReset("test@example.com"));
    }

    // ==================== getResetPasswordInvite — all 3 branches ====================

    @Test
    void getResetPasswordInvite_TokenNotFound_ThrowsException() {
        when(userInvitationRepository.findByToken("badReset")).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> registerService.getResetPasswordInvite("badReset"));
    }

    @Test
    void getResetPasswordInvite_StatusNotForgotPassword_ThrowsException() {
        Registrations record = new Registrations();
        record.setStatus(Registrations.InvitationStatus.PENDING);
        record.setEmail("test@example.com");
        when(userInvitationRepository.findByToken("wrongStatus")).thenReturn(Optional.of(record));

        assertThrows(IllegalArgumentException.class, () -> registerService.getResetPasswordInvite("wrongStatus"));
    }

    @Test
    void getResetPasswordInvite_Expired_ThrowsException() {
        Registrations record = new Registrations();
        record.setStatus(Registrations.InvitationStatus.FORGOTPASSWORD);
        record.setExpiresAt(LocalDateTime.now().minusHours(1));
        record.setEmail("test@example.com");
        when(userInvitationRepository.findByToken("expired")).thenReturn(Optional.of(record));

        assertThrows(IllegalArgumentException.class, () -> registerService.getResetPasswordInvite("expired"));
    }

    @Test
    void getResetPasswordInvite_Valid_ReturnsResponse() {
        Registrations record = new Registrations();
        record.setStatus(Registrations.InvitationStatus.FORGOTPASSWORD);
        record.setExpiresAt(LocalDateTime.now().plusHours(1));
        record.setEmail("test@example.com");
        record.setCreatedAt(LocalDateTime.now());
        when(userInvitationRepository.findByToken("validReset")).thenReturn(Optional.of(record));

        RegisterInviteResponse response = registerService.getResetPasswordInvite("validReset");
        assertNotNull(response);
    }

    // ==================== resetPassword — edge cases ====================

    @Test
    void resetPassword_PasswordMismatch_ThrowsException() {
        validRegistration.setStatus(Registrations.InvitationStatus.FORGOTPASSWORD);
        when(userInvitationRepository.findByToken("validToken")).thenReturn(Optional.of(validRegistration));

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setNewPassword("NewSecureP@ss1");
        request.setConfirmPassword("DifferentP@ss2");

        assertThrows(IllegalArgumentException.class, () -> registerService.resetPassword("validToken", request));
    }

    @Test
    void resetPassword_WeakPassword_ThrowsException() {
        validRegistration.setStatus(Registrations.InvitationStatus.FORGOTPASSWORD);
        when(userInvitationRepository.findByToken("validToken")).thenReturn(Optional.of(validRegistration));

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setNewPassword("weak");
        request.setConfirmPassword("weak");

        assertThrows(IllegalArgumentException.class, () -> registerService.resetPassword("validToken", request));
    }

    @Test
    void resetPassword_NullCache_SkipsCacheEviction() {
        validRegistration.setStatus(Registrations.InvitationStatus.FORGOTPASSWORD);
        when(userInvitationRepository.findByToken("validToken")).thenReturn(Optional.of(validRegistration));

        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("test@example.com");
        user.setTokenVersion(1);

        when(userRepository.findByEmailIgnoreCase("test@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("NewSecureP@ss1")).thenReturn("hashed");
        when(cacheManager.getCache("tokenVersions")).thenReturn(null); // Cache is null

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setNewPassword("NewSecureP@ss1");
        request.setConfirmPassword("NewSecureP@ss1");

        // Should NOT throw NullPointerException — the null check protects this
        assertDoesNotThrow(() -> registerService.resetPassword("validToken", request));
        assertEquals(Registrations.InvitationStatus.ACCEPTED, validRegistration.getStatus());
    }
}
