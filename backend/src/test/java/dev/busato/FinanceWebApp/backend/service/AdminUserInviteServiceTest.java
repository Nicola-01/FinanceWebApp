package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.AdminInviteRequest;
import dev.busato.FinanceWebApp.backend.dto.AdminInviteResponse;
import dev.busato.FinanceWebApp.backend.dto.UserResponse;
import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.mappers.AdminInviteMapper;
import dev.busato.FinanceWebApp.backend.mappers.UserMapper;
import dev.busato.FinanceWebApp.backend.model.Registrations;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserInviteServiceTest {

    @Mock
    private SendEmailService sendEmailService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ManageUserRepository manageUserRepository;
    @Mock
    private RegistrationsRepository userInvitationRepository;
    @Mock
    private WalletAccessRepository walletAccessRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private UserMapper userMapper;
    @Mock
    private AdminInviteMapper adminInviteMapper;

    @InjectMocks
    private AdminUserInviteService adminUserInviteService;

    private User user;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        user.setRole(User.Role.USER);
    }

    @Test
    void getUsersWithStats_CalculatesWalletsAndTransactions() {
        when(userRepository.findAllByRole(User.Role.USER)).thenReturn(List.of(user));

        UserResponse mappedResponse = UserResponse.builder().build();
        when(userMapper.mapToResponse(user)).thenReturn(mappedResponse);

        WalletAccess access = new WalletAccess();
        Wallet wallet = new Wallet();
        wallet.setId(UUID.randomUUID());
        wallet.setName("Normal Wallet");
        access.setWallet(wallet);

        when(walletAccessRepository.findAllByUserIdAndStatus(userId, WalletAccess.InvitationStatus.ACCEPTED))
                .thenReturn(List.of(access));

        when(transactionRepository.countByWalletId(wallet.getId())).thenReturn(5L);

        List<UserResponse> responses = adminUserInviteService.getUsersWithStats();

        assertEquals(1, responses.size());
        assertEquals(1, responses.get(0).getWallets());
        assertEquals(5, responses.get(0).getTransactions());
    }

    @Test
    void deleteUser_UserExists_DeletesUser() {
        when(userRepository.existsById(userId)).thenReturn(true);
        adminUserInviteService.deleteUser(userId);
        verify(userRepository).deleteById(userId);
    }

    @Test
    void deleteUser_UserNotFound_ThrowsException() {
        when(userRepository.existsById(userId)).thenReturn(false);
        assertThrows(UserNotFoundException.class, () -> adminUserInviteService.deleteUser(userId));
    }

    @Test
    void createInvite_NewEmail_SendsInvite() throws Exception {
        AdminInviteRequest request = new AdminInviteRequest();
        request.setEmail("new@example.com");

        when(userRepository.findByEmailIgnoreCase("new@example.com")).thenReturn(Optional.empty());
        when(userInvitationRepository.findByEmailIgnoreCase("new@example.com")).thenReturn(Optional.empty());

        AdminInviteResponse mappedResponse = AdminInviteResponse.builder().build();
        when(adminInviteMapper.mapToAdminInviteResponse(any())).thenReturn(mappedResponse);

        AdminInviteResponse response = adminUserInviteService.createInvite(request);

        assertNotNull(response);
        verify(userInvitationRepository).save(any(Registrations.class));
        verify(sendEmailService).sendRegistrationInvitation(mappedResponse);
    }

    @Test
    void createInvite_EmailExists_ThrowsException() {
        AdminInviteRequest request = new AdminInviteRequest();
        request.setEmail("existing@example.com");

        when(userRepository.findByEmailIgnoreCase("existing@example.com")).thenReturn(Optional.of(user));

        assertThrows(IllegalArgumentException.class, () -> adminUserInviteService.createInvite(request));
    }

    @Test
    void revokeInvite_InviteExists_Revokes() {
        Registrations invite = new Registrations();
        when(userInvitationRepository.findByEmailIgnoreCase("test@example.com")).thenReturn(Optional.of(invite));

        adminUserInviteService.revokeInvite("test@example.com");

        assertEquals(Registrations.InvitationStatus.REVOKED, invite.getStatus());
    }
}
