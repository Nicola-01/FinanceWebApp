package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.WalletRequest;
import dev.busato.FinanceWebApp.backend.dto.WalletResponse;
import dev.busato.FinanceWebApp.backend.exceptions.UnauthorizedAccessException;
import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.mappers.WalletMapper;
import dev.busato.FinanceWebApp.backend.model.PersonalAccessToken;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import dev.busato.FinanceWebApp.backend.security.WalletSecurity;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WalletServiceTest {

    @Mock
    private WalletRepository walletRepository;
    @Mock
    private WalletAccessRepository walletAccessRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private WalletMapper walletMapper;
    @Mock
    private WalletSecurity walletSecurity;
    @Mock
    private PatService patService;

    @InjectMocks
    private WalletService walletService;

    private UUID userId;
    private UUID walletId;
    private User user;
    private Wallet wallet;
    private WalletAccess walletAccess;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        walletId = UUID.randomUUID();

        user = new User();
        user.setId(userId);

        wallet = new Wallet();
        wallet.setId(walletId);
        wallet.setName("My Wallet");

        walletAccess = new WalletAccess();
        walletAccess.setUser(user);
        walletAccess.setWallet(wallet);
        walletAccess.setRole(WalletAccess.WalletRole.OWNER);
        walletAccess.setStatus(WalletAccess.InvitationStatus.ACCEPTED);

        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createWallet_ValidRequest_CreatesWalletAndOwnerAccess() {
        WalletRequest request = new WalletRequest();
        request.setName("New Wallet");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(i -> {
            Wallet w = i.getArgument(0);
            w.setId(walletId);
            return w;
        });

        WalletResponse mockResponse = WalletResponse.builder().build();
        when(walletMapper.mapToResponse(any(WalletAccess.class))).thenReturn(mockResponse);

        WalletResponse response = walletService.createWallet(request, userId);

        assertNotNull(response);
        verify(walletRepository).save(any(Wallet.class));
        verify(walletAccessRepository).save(any(WalletAccess.class));
    }

    @Test
    void createWallet_WithPatToken_GrantsWalletToPat() {
        WalletRequest request = new WalletRequest();
        request.setName("New Wallet");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(walletRepository.save(any(Wallet.class))).thenAnswer(i -> {
            Wallet w = i.getArgument(0);
            w.setId(walletId);
            return w;
        });

        // Set PAT in security context
        PersonalAccessToken pat = new PersonalAccessToken();
        UUID patId = UUID.randomUUID();
        pat.setId(patId);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(user, pat, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);

        walletService.createWallet(request, userId);

        verify(patService).addWalletToToken(patId, walletId);
    }

    @Test
    void createWallet_UserNotFound_ThrowsException() {
        WalletRequest request = new WalletRequest();
        request.setName("New Wallet");

        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(UserNotFoundException.class, () -> walletService.createWallet(request, userId));
    }

    @Test
    void updateWallet_Owner_UpdatesWallet() {
        WalletRequest request = new WalletRequest();
        request.setName("Updated Wallet");

        when(walletAccessRepository.findByWalletIdAndUserIdAndRole(walletId, userId, WalletAccess.WalletRole.OWNER))
                .thenReturn(Optional.of(walletAccess));

        walletService.updateWallet(walletId, request, userId);

        assertEquals("Updated Wallet", wallet.getName());
    }

    @Test
    void updateWallet_NotOwner_ThrowsException() {
        WalletRequest request = new WalletRequest();
        request.setName("Updated Wallet");

        when(walletAccessRepository.findByWalletIdAndUserIdAndRole(walletId, userId, WalletAccess.WalletRole.OWNER))
                .thenReturn(Optional.empty());

        assertThrows(UnauthorizedAccessException.class, () -> walletService.updateWallet(walletId, request, userId));
    }

    @Test
    void removeWallet_Owner_DeletesWallet() {
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.of(walletAccess));

        walletService.removeWallet(walletId, userId);

        verify(walletRepository).delete(wallet);
    }

    @Test
    void removeWallet_NotOwner_LeavesWallet() {
        walletAccess.setRole(WalletAccess.WalletRole.VIEWER);
        when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId)).thenReturn(Optional.of(walletAccess));

        walletService.removeWallet(walletId, userId);

        verify(walletRepository, never()).delete(any());
        assertEquals(WalletAccess.InvitationStatus.LEFT, walletAccess.getStatus());
    }

    @Test
    void getWallets_ReturnsOnlyAccessibleWallets() {
        when(walletAccessRepository.findAllByUserIdAndStatus(userId, WalletAccess.InvitationStatus.ACCEPTED))
                .thenReturn(List.of(walletAccess));
        when(walletSecurity.hasReadAccessQuietly(userId, walletId)).thenReturn(true);

        List<WalletResponse> responses = walletService.getWallets(userId);
        assertEquals(1, responses.size());
    }
}
