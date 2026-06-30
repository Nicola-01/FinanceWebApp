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
}
