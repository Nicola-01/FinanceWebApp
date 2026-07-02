package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.verify;

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
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AdminUserInviteServiceTest {

  @Mock private SendEmailService sendEmailService;
  @Mock private UserRepository userRepository;
  @Mock private ManageUserRepository manageUserRepository;
  @Mock private RegistrationsRepository userInvitationRepository;
  @Mock private WalletAccessRepository walletAccessRepository;
  @Mock private TransactionRepository transactionRepository;
  @Mock private UserMapper userMapper;
  @Mock private AdminInviteMapper adminInviteMapper;

  @InjectMocks private AdminUserInviteService adminUserInviteService;

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

    when(walletAccessRepository.findAllByUserIdAndStatus(
            userId, WalletAccess.InvitationStatus.ACCEPTED))
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
    when(userInvitationRepository.findByEmailIgnoreCase("new@example.com"))
        .thenReturn(Optional.empty());

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

    when(userRepository.findByEmailIgnoreCase("existing@example.com"))
        .thenReturn(Optional.of(user));

    assertThrows(
        IllegalArgumentException.class, () -> adminUserInviteService.createInvite(request));
  }

  @Test
  void revokeInvite_InviteExists_Revokes() {
    Registrations invite = new Registrations();
    when(userInvitationRepository.findByEmailIgnoreCase("test@example.com"))
        .thenReturn(Optional.of(invite));

    adminUserInviteService.revokeInvite("test@example.com");

    assertEquals(Registrations.InvitationStatus.REVOKED, invite.getStatus());
  }

  // ==================== getUsersWithStats — edge cases ====================

  @Test
  void getUsersWithStats_ExcludesDemoWallet() {
    when(userRepository.findAllByRole(User.Role.USER)).thenReturn(List.of(user));

    UserResponse mappedResponse = UserResponse.builder().build();
    when(userMapper.mapToResponse(user)).thenReturn(mappedResponse);

    WalletAccess demoAccess = new WalletAccess();
    Wallet demoWallet = new Wallet();
    demoWallet.setId(UUID.randomUUID());
    demoWallet.setName("Portafoglio Demo"); // Should be excluded
    demoAccess.setWallet(demoWallet);

    WalletAccess normalAccess = new WalletAccess();
    Wallet normalWallet = new Wallet();
    normalWallet.setId(UUID.randomUUID());
    normalWallet.setName("Personal");
    normalAccess.setWallet(normalWallet);

    when(walletAccessRepository.findAllByUserIdAndStatus(
            userId, WalletAccess.InvitationStatus.ACCEPTED))
        .thenReturn(List.of(demoAccess, normalAccess));

    when(transactionRepository.countByWalletId(normalWallet.getId())).thenReturn(3L);

    List<UserResponse> responses = adminUserInviteService.getUsersWithStats();

    assertEquals(1, responses.size());
    assertEquals(1, responses.get(0).getWallets()); // Only normal wallet counted
    assertEquals(3, responses.get(0).getTransactions());
  }

  // ==================== createInvite — edge cases ====================

  @Test
  void createInvite_ExistingInvite_UpdatesExistingRecord() throws Exception {
    AdminInviteRequest request = new AdminInviteRequest();
    request.setEmail("existing@example.com");

    Registrations existingInvite = new Registrations();
    existingInvite.setEmail("existing@example.com");

    when(userRepository.findByEmailIgnoreCase("existing@example.com")).thenReturn(Optional.empty());
    when(userInvitationRepository.findByEmailIgnoreCase("existing@example.com"))
        .thenReturn(Optional.of(existingInvite));

    AdminInviteResponse mockResponse = AdminInviteResponse.builder().build();
    when(adminInviteMapper.mapToAdminInviteResponse(any())).thenReturn(mockResponse);

    adminUserInviteService.createInvite(request);

    verify(userInvitationRepository).save(existingInvite);
    assertEquals(Registrations.InvitationStatus.PENDING, existingInvite.getStatus());
  }

  @Test
  void createInvite_EmailSendFails_ThrowsRuntimeException() throws Exception {
    AdminInviteRequest request = new AdminInviteRequest();
    request.setEmail("fail@example.com");

    when(userRepository.findByEmailIgnoreCase("fail@example.com")).thenReturn(Optional.empty());
    when(userInvitationRepository.findByEmailIgnoreCase("fail@example.com"))
        .thenReturn(Optional.empty());

    AdminInviteResponse mockResponse = AdminInviteResponse.builder().build();
    when(adminInviteMapper.mapToAdminInviteResponse(any())).thenReturn(mockResponse);

    doThrow(new RuntimeException("SMTP down"))
        .when(sendEmailService)
        .sendRegistrationInvitation(any());

    assertThrows(RuntimeException.class, () -> adminUserInviteService.createInvite(request));
  }

  // ==================== revokeInvite — edge case ====================

  @Test
  void revokeInvite_NotFound_ThrowsUserNotFoundException() {
    when(userInvitationRepository.findByEmailIgnoreCase("unknown@example.com"))
        .thenReturn(Optional.empty());

    assertThrows(
        dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException.class,
        () -> adminUserInviteService.revokeInvite("unknown@example.com"));
  }
}
