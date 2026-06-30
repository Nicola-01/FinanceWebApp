package dev.busato.FinanceWebApp.backend.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.busato.FinanceWebApp.backend.exceptions.PermissionDeniedException;
import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException;
import dev.busato.FinanceWebApp.backend.model.PersonalAccessToken;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WalletSecurityTest {

    @Mock
    private WalletAccessRepository walletAccessRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private WalletRepository walletRepository;
    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private SecurityContext securityContext;
    @Mock
    private Authentication authentication;

    @InjectMocks
    private WalletSecurity walletSecurity;

    private UUID userId;
    private UUID walletId;
    private User mockUser;
    private WalletAccess mockAccess;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        walletId = UUID.randomUUID();

        mockUser = new User();
        mockUser.setId(userId);
        mockUser.setUsername("testuser");

        mockAccess = new WalletAccess();
        mockAccess.setUser(mockUser);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setupSecurityContext(Object credentials) {
        SecurityContextHolder.setContext(securityContext);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        lenient().when(authentication.getCredentials()).thenReturn(credentials);
    }

    @Test
    void requireUser_ValidUserId_ReturnsTrue() {
        when(userRepository.existsById(userId)).thenReturn(true);
        assertTrue(walletSecurity.requireUser(userId));
    }

    @Test
    void requireUser_InvalidUserId_ThrowsUserNotFoundException() {
        when(userRepository.existsById(userId)).thenReturn(false);
        assertThrows(UserNotFoundException.class, () -> walletSecurity.requireUser(userId));
    }

    @Test
    void requireWallet_ValidWalletId_ReturnsTrue() {
        when(walletRepository.existsById(walletId)).thenReturn(true);
        assertTrue(walletSecurity.requireWallet(walletId));
    }

    @Test
    void requireWallet_InvalidWalletId_ThrowsWalletNotFoundException() {
        when(walletRepository.existsById(walletId)).thenReturn(false);
        assertThrows(WalletNotFoundException.class, () -> walletSecurity.requireWallet(walletId));
    }

    @Test
    void isWalletOwner_UserIsOwnerAndNoPat_ReturnsTrue() {
        mockAccess.setRole(WalletAccess.WalletRole.OWNER);
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.of(mockAccess));

        SecurityContextHolder.setContext(securityContext);
        lenient().when(securityContext.getAuthentication()).thenReturn(null);

        assertTrue(walletSecurity.isWalletOwner(userId, walletId));
    }

    @Test
    void isWalletOwner_UserIsAdmin_ThrowsPermissionDeniedException() {
        mockAccess.setRole(WalletAccess.WalletRole.EDITOR);
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.of(mockAccess));

        assertThrows(PermissionDeniedException.class, () -> walletSecurity.isWalletOwner(userId, walletId));
    }

    @Test
    void isWalletOwner_WithPat_ThrowsPermissionDeniedException() throws Exception {
        mockAccess.setRole(WalletAccess.WalletRole.OWNER);
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.of(mockAccess));

        PersonalAccessToken pat = new PersonalAccessToken();
        pat.setWalletPermissions("[{\"walletId\":\"" + walletId + "\", \"permissions\":[\"OWNER\"]}]");
        setupSecurityContext(pat);

        WalletSecurity.PatWalletPermission perm = new WalletSecurity.PatWalletPermission();
        perm.setWalletId(walletId.toString());
        perm.setPermissions(List.of("OWNER"));
        when(objectMapper.readValue(any(String.class), any(TypeReference.class))).thenReturn(List.of(perm));

        assertThrows(PermissionDeniedException.class, () -> walletSecurity.isWalletOwner(userId, walletId));
    }

    @Test
    void hasWriteAccess_UserIsAdminAccepted_ReturnsTrue() {
        mockAccess.setRole(WalletAccess.WalletRole.EDITOR);
        mockAccess.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.of(mockAccess));

        SecurityContextHolder.clearContext();

        assertTrue(walletSecurity.hasWriteAccess(userId, walletId));
    }

    @Test
    void hasWriteAccess_UserIsViewer_ThrowsPermissionDeniedException() {
        mockAccess.setRole(WalletAccess.WalletRole.VIEWER);
        mockAccess.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.of(mockAccess));

        assertThrows(PermissionDeniedException.class, () -> walletSecurity.hasWriteAccess(userId, walletId));
    }

    @Test
    void hasWriteAccess_UserIsPending_ThrowsPermissionDeniedException() {
        mockAccess.setRole(WalletAccess.WalletRole.EDITOR);
        mockAccess.setStatus(WalletAccess.InvitationStatus.PENDING);
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.of(mockAccess));

        assertThrows(PermissionDeniedException.class, () -> walletSecurity.hasWriteAccess(userId, walletId));
    }

    @Test
    void hasWriteAccess_WithPatWritePermission_ReturnsTrue() throws Exception {
        mockAccess.setRole(WalletAccess.WalletRole.EDITOR);
        mockAccess.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.of(mockAccess));

        PersonalAccessToken pat = new PersonalAccessToken();
        pat.setWalletPermissions("[{\"walletId\":\"" + walletId + "\", \"permissions\":[\"WRITE\"]}]");
        setupSecurityContext(pat);

        WalletSecurity.PatWalletPermission perm = new WalletSecurity.PatWalletPermission();
        perm.setWalletId(walletId.toString());
        perm.setPermissions(List.of("WRITE"));
        when(objectMapper.readValue(any(String.class), any(TypeReference.class))).thenReturn(List.of(perm));

        assertTrue(walletSecurity.hasWriteAccess(userId, walletId));
    }

    @Test
    void hasWriteAccess_WithPatReadPermissionOnly_ThrowsPermissionDeniedException() throws Exception {
        mockAccess.setRole(WalletAccess.WalletRole.EDITOR);
        mockAccess.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.of(mockAccess));

        PersonalAccessToken pat = new PersonalAccessToken();
        pat.setWalletPermissions("[{\"walletId\":\"" + walletId + "\", \"permissions\":[\"READ\"]}]");
        setupSecurityContext(pat);

        WalletSecurity.PatWalletPermission perm = new WalletSecurity.PatWalletPermission();
        perm.setWalletId(walletId.toString());
        perm.setPermissions(List.of("READ"));
        when(objectMapper.readValue(any(String.class), any(TypeReference.class))).thenReturn(List.of(perm));

        assertThrows(PermissionDeniedException.class, () -> walletSecurity.hasWriteAccess(userId, walletId));
    }

    @Test
    void hasReadAccess_UserIsViewerAccepted_ReturnsTrue() {
        mockAccess.setRole(WalletAccess.WalletRole.VIEWER);
        mockAccess.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.of(mockAccess));

        SecurityContextHolder.clearContext();

        assertTrue(walletSecurity.hasReadAccess(userId, walletId));
    }

    @Test
    void hasReadAccess_WithPatReadPermission_ReturnsTrue() throws Exception {
        mockAccess.setRole(WalletAccess.WalletRole.VIEWER);
        mockAccess.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.of(mockAccess));

        PersonalAccessToken pat = new PersonalAccessToken();
        pat.setWalletPermissions("[{\"walletId\":\"" + walletId + "\", \"permissions\":[\"READ\"]}]");
        setupSecurityContext(pat);

        WalletSecurity.PatWalletPermission perm = new WalletSecurity.PatWalletPermission();
        perm.setWalletId(walletId.toString());
        perm.setPermissions(List.of("READ"));
        when(objectMapper.readValue(any(String.class), any(TypeReference.class))).thenReturn(List.of(perm));

        assertTrue(walletSecurity.hasReadAccess(userId, walletId));
    }

    @Test
    void hasReadAccessQuietly_HasAccess_ReturnsTrue() {
        mockAccess.setRole(WalletAccess.WalletRole.VIEWER);
        mockAccess.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.of(mockAccess));
        SecurityContextHolder.clearContext();

        assertTrue(walletSecurity.hasReadAccessQuietly(userId, walletId));
    }

    @Test
    void hasReadAccessQuietly_NoAccess_ReturnsFalse() {
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.empty());
        assertFalse(walletSecurity.hasReadAccessQuietly(userId, walletId));
    }

    @Test
    void preventPatAccess_UserIsNormal_ReturnsTrue() {
        setupSecurityContext("NormalPassword");
        assertTrue(walletSecurity.preventPatAccess());
    }

    @Test
    void preventPatAccess_UserIsPat_ThrowsAccessDeniedException() {
        setupSecurityContext(new PersonalAccessToken());
        assertThrows(AccessDeniedException.class, () -> walletSecurity.preventPatAccess());
    }

    // ==================== verifyPatPermissions — edge case ====================

    @Test
    void hasWriteAccess_WithPatPermissionForDifferentWallet_ThrowsPermissionDeniedException() throws Exception {
        mockAccess.setRole(WalletAccess.WalletRole.EDITOR);
        mockAccess.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.of(mockAccess));

        // PAT con permessi WRITE ma per un wallet DIVERSO
        UUID differentWalletId = UUID.randomUUID();
        PersonalAccessToken pat = new PersonalAccessToken();
        pat.setWalletPermissions("[{\"walletId\":\"" + differentWalletId + "\", \"permissions\":[\"WRITE\"]}]");
        setupSecurityContext(pat);

        WalletSecurity.PatWalletPermission perm = new WalletSecurity.PatWalletPermission();
        perm.setWalletId(differentWalletId.toString());
        perm.setPermissions(List.of("WRITE"));
        when(objectMapper.readValue(any(String.class), any(TypeReference.class))).thenReturn(List.of(perm));

        assertThrows(PermissionDeniedException.class, () -> walletSecurity.hasWriteAccess(userId, walletId));
    }

    @Test
    void hasWriteAccess_WithPatNullPermissions_ThrowsPermissionDeniedException() {
        mockAccess.setRole(WalletAccess.WalletRole.EDITOR);
        mockAccess.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.of(mockAccess));

        PersonalAccessToken pat = new PersonalAccessToken();
        pat.setWalletPermissions(null);
        setupSecurityContext(pat);

        assertThrows(PermissionDeniedException.class, () -> walletSecurity.hasWriteAccess(userId, walletId));
    }

    @Test
    void hasWriteAccess_WithPatBlankPermissions_ThrowsPermissionDeniedException() {
        mockAccess.setRole(WalletAccess.WalletRole.EDITOR);
        mockAccess.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.of(mockAccess));

        PersonalAccessToken pat = new PersonalAccessToken();
        pat.setWalletPermissions("   ");
        setupSecurityContext(pat);

        assertThrows(PermissionDeniedException.class, () -> walletSecurity.hasWriteAccess(userId, walletId));
    }

    @Test
    void hasReadAccess_WithPatWritePermission_ReturnsTrue() throws Exception {
        // WRITE implica READ — un PAT con solo WRITE deve poter leggere
        mockAccess.setRole(WalletAccess.WalletRole.VIEWER);
        mockAccess.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.of(mockAccess));

        PersonalAccessToken pat = new PersonalAccessToken();
        pat.setWalletPermissions("[{\"walletId\":\"" + walletId + "\", \"permissions\":[\"WRITE\"]}]");
        setupSecurityContext(pat);

        WalletSecurity.PatWalletPermission perm = new WalletSecurity.PatWalletPermission();
        perm.setWalletId(walletId.toString());
        perm.setPermissions(List.of("WRITE"));
        when(objectMapper.readValue(any(String.class), any(TypeReference.class))).thenReturn(List.of(perm));

        assertTrue(walletSecurity.hasReadAccess(userId, walletId));
    }

    @Test
    void hasReadAccess_UserIsPending_ThrowsPermissionDeniedException() {
        mockAccess.setRole(WalletAccess.WalletRole.VIEWER);
        mockAccess.setStatus(WalletAccess.InvitationStatus.PENDING);
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.of(mockAccess));

        assertThrows(PermissionDeniedException.class, () -> walletSecurity.hasReadAccess(userId, walletId));
    }

    @Test
    void hasWriteAccess_UserIsOwnerAccepted_ReturnsTrue() {
        // OWNER con status ACCEPTED deve avere write access (non è VIEWER)
        mockAccess.setRole(WalletAccess.WalletRole.OWNER);
        mockAccess.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.of(mockAccess));

        SecurityContextHolder.clearContext();

        assertTrue(walletSecurity.hasWriteAccess(userId, walletId));
    }

    @Test
    void hasWriteAccess_WithPatCorruptedJson_ThrowsPermissionDeniedException() throws Exception {
        mockAccess.setRole(WalletAccess.WalletRole.EDITOR);
        mockAccess.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.of(mockAccess));

        PersonalAccessToken pat = new PersonalAccessToken();
        pat.setWalletPermissions("{corrupted json}");
        setupSecurityContext(pat);

        when(objectMapper.readValue(any(String.class), any(TypeReference.class)))
                .thenThrow(new RuntimeException("Corrupted JSON"));

        assertThrows(PermissionDeniedException.class, () -> walletSecurity.hasWriteAccess(userId, walletId));
    }

    // ==================== getWalletAccess — WalletNotFoundException diretti ====================

    @Test
    void isWalletOwner_NoWalletAccess_ThrowsWalletNotFoundException() {
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.empty());
        assertThrows(WalletNotFoundException.class, () -> walletSecurity.isWalletOwner(userId, walletId));
    }

    @Test
    void hasWriteAccess_NoWalletAccess_ThrowsWalletNotFoundException() {
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.empty());
        assertThrows(WalletNotFoundException.class, () -> walletSecurity.hasWriteAccess(userId, walletId));
    }

    @Test
    void hasReadAccess_NoWalletAccess_ThrowsWalletNotFoundException() {
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.empty());
        assertThrows(WalletNotFoundException.class, () -> walletSecurity.hasReadAccess(userId, walletId));
    }
}
