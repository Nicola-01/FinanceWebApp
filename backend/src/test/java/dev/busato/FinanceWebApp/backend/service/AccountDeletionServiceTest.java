package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.EmailChangeRequestRepository;
import dev.busato.FinanceWebApp.backend.repository.PersonalAccessTokenRepository;
import dev.busato.FinanceWebApp.backend.repository.PushSubscriptionRepository;
import dev.busato.FinanceWebApp.backend.repository.SubscriptionRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import java.time.LocalDate;
import java.util.List;
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
class AccountDeletionServiceTest {

  @Mock private PasswordEncoder passwordEncoder;
  @Mock private UserRepository userRepository;
  @Mock private WalletRepository walletRepository;
  @Mock private WalletAccessRepository walletAccessRepository;
  @Mock private SubscriptionRepository subscriptionRepository;
  @Mock private PersonalAccessTokenRepository patRepository;
  @Mock private EmailChangeRequestRepository emailChangeRepository;
  @Mock private PushSubscriptionRepository pushSubscriptionRepository;

  @InjectMocks private AccountDeletionService accountDeletionService;

  private static final String RAW_PASSWORD = "MyPassw0rd!";
  private static final String HASH = "hashedPassword";

  private User me;
  private UUID meId;

  @BeforeEach
  void setUp() {
    meId = UUID.randomUUID();
    me = new User();
    me.setId(meId);
    me.setUsername("owner");
    me.setPassword(HASH);
  }

  /**
   * Builds a fully-populated access row (embedded id + user + wallet + role + status + invitedAt).
   */
  private WalletAccess access(
      UUID userId,
      Wallet wallet,
      WalletAccess.WalletRole role,
      WalletAccess.InvitationStatus status,
      LocalDate invitedAt,
      String username,
      LocalDate userCreatedAt) {
    User u = new User();
    u.setId(userId);
    u.setUsername(username);
    u.setCreatedAt(userCreatedAt);

    WalletAccess wa = new WalletAccess();
    wa.setId(new WalletAccess.WalletAccessId(userId, wallet.getId()));
    wa.setUser(u);
    wa.setWallet(wallet);
    wa.setRole(role);
    wa.setStatus(status);
    wa.setInvitedAt(invitedAt);
    return wa;
  }

  private Wallet wallet() {
    Wallet w = new Wallet();
    w.setId(UUID.randomUUID());
    return w;
  }

  private WalletAccess myOwnerAccess(Wallet wallet) {
    return access(
        meId,
        wallet,
        WalletAccess.WalletRole.OWNER,
        WalletAccess.InvitationStatus.ACCEPTED,
        LocalDate.of(2020, 1, 1),
        "owner",
        LocalDate.of(2020, 1, 1));
  }

  private void passwordOk() {
    when(passwordEncoder.matches(RAW_PASSWORD, HASH)).thenReturn(true);
  }

  private void verifyAccountRowRemoved() {
    verify(patRepository).deleteAllByUserId(meId);
    verify(pushSubscriptionRepository).deleteAllByUserId(meId);
    verify(emailChangeRepository).deleteByUserId(meId);
    verify(walletAccessRepository).deleteAllByUserId(meId);
    verify(userRepository).delete(me);
  }

  // ==================== PASSWORD GUARD ====================

  @Test
  void deleteAccount_WrongPassword_ThrowsAndTouchesNothing() {
    when(passwordEncoder.matches(RAW_PASSWORD, HASH)).thenReturn(false);

    assertThrows(
        BadCredentialsException.class,
        () -> accountDeletionService.deleteAccount(me, RAW_PASSWORD));

    verifyNoInteractions(
        userRepository,
        walletRepository,
        walletAccessRepository,
        subscriptionRepository,
        patRepository,
        pushSubscriptionRepository,
        emailChangeRepository);
  }

  // ==================== ADMIN ERASURE (NO PASSWORD) ====================

  @Test
  void deleteUserAsAdmin_PurgesUserWithoutPasswordCheck() {
    Wallet w = wallet();
    WalletAccess editor =
        access(
            meId,
            w,
            WalletAccess.WalletRole.EDITOR,
            WalletAccess.InvitationStatus.ACCEPTED,
            LocalDate.of(2021, 1, 1),
            "owner",
            LocalDate.of(2020, 1, 1));
    when(walletAccessRepository.findAllByUserId(meId)).thenReturn(List.of(editor));

    accountDeletionService.deleteUserAsAdmin(me);

    // Same cascade cleanup as the self-service path...
    verify(walletAccessRepository).delete(editor);
    verifyAccountRowRemoved();
    // ...but the admin path never asks for a password.
    verifyNoInteractions(passwordEncoder);
  }

  // ==================== TAIL: PAT + EMAIL + USER ====================

  @Test
  void deleteAccount_NoWallets_RemovesTokensPendingEmailAndUser() {
    passwordOk();
    when(walletAccessRepository.findAllByUserId(meId)).thenReturn(List.of());

    accountDeletionService.deleteAccount(me, RAW_PASSWORD);

    verifyAccountRowRemoved();
    verifyNoInteractions(walletRepository, subscriptionRepository);
  }

  // ==================== NON-OWNER MEMBERSHIP ====================

  @Test
  void deleteAccount_NonOwnerMembership_DropsAccessRowAndKeepsWallet() {
    passwordOk();
    Wallet w = wallet();
    WalletAccess editor =
        access(
            meId,
            w,
            WalletAccess.WalletRole.EDITOR,
            WalletAccess.InvitationStatus.ACCEPTED,
            LocalDate.of(2021, 1, 1),
            "owner",
            LocalDate.of(2020, 1, 1));
    when(walletAccessRepository.findAllByUserId(meId)).thenReturn(List.of(editor));

    accountDeletionService.deleteAccount(me, RAW_PASSWORD);

    verify(walletAccessRepository).delete(editor);
    verify(walletRepository, never()).delete(any());
    verifyNoInteractions(subscriptionRepository);
    verifyAccountRowRemoved();
  }

  // ==================== SOLELY-OWNED WALLET → DELETE ====================

  @Test
  void deleteAccount_SolelyOwnedWallet_DeletesWalletAndSubscriptions() {
    passwordOk();
    Wallet w = wallet();
    WalletAccess mine = myOwnerAccess(w);
    // A rejected invite is present but does NOT count as an accepted member.
    WalletAccess rejected =
        access(
            UUID.randomUUID(),
            w,
            WalletAccess.WalletRole.VIEWER,
            WalletAccess.InvitationStatus.REJECTED,
            LocalDate.of(2019, 1, 1),
            "ghost",
            LocalDate.of(2018, 1, 1));

    when(walletAccessRepository.findAllByUserId(meId)).thenReturn(List.of(mine));
    when(walletAccessRepository.findAllByWalletId(w.getId())).thenReturn(List.of(mine, rejected));

    accountDeletionService.deleteAccount(me, RAW_PASSWORD);

    verify(subscriptionRepository).deleteAllByWalletId(w.getId());
    verify(walletRepository).delete(w);
    verify(walletAccessRepository, never()).save(any());
    verifyAccountRowRemoved();
  }

  // ==================== OWNERSHIP TRANSFER — TIE-BREAK LEVELS ====================

  @Test
  void deleteAccount_Transfer_PicksEarliestInvitedAt() {
    passwordOk();
    Wallet w = wallet();
    WalletAccess mine = myOwnerAccess(w);
    WalletAccess older =
        access(
            UUID.randomUUID(),
            w,
            WalletAccess.WalletRole.VIEWER,
            WalletAccess.InvitationStatus.ACCEPTED,
            LocalDate.of(2022, 1, 1), // joined first
            "zed",
            LocalDate.of(2023, 1, 1));
    WalletAccess newer =
        access(
            UUID.randomUUID(),
            w,
            WalletAccess.WalletRole.VIEWER, // same role → invitedAt decides
            WalletAccess.InvitationStatus.ACCEPTED,
            LocalDate.of(2022, 6, 1), // joined later
            "amy",
            LocalDate.of(2019, 1, 1));

    when(walletAccessRepository.findAllByUserId(meId)).thenReturn(List.of(mine));
    when(walletAccessRepository.findAllByWalletId(w.getId()))
        .thenReturn(List.of(mine, newer, older));

    accountDeletionService.deleteAccount(me, RAW_PASSWORD);

    // 'older' joined first → wins on invitedAt, regardless of createdAt/username.
    assertEquals(WalletAccess.WalletRole.OWNER, older.getRole());
    verify(walletAccessRepository).save(older);
    verify(walletAccessRepository).delete(mine);
    verify(walletRepository, never()).delete(any());
    verifyNoInteractions(subscriptionRepository);
    verifyAccountRowRemoved();
  }

  @Test
  void deleteAccount_Transfer_PrefersEditorOverEarlierViewer() {
    // An EDITOR inherits ahead of a VIEWER even if the VIEWER joined earlier: a read-only member
    // should not be handed ownership while a writer is available.
    passwordOk();
    Wallet w = wallet();
    WalletAccess mine = myOwnerAccess(w);
    WalletAccess earlyViewer =
        access(
            UUID.randomUUID(),
            w,
            WalletAccess.WalletRole.VIEWER,
            WalletAccess.InvitationStatus.ACCEPTED,
            LocalDate.of(2020, 1, 1), // joined much earlier
            "viewer",
            LocalDate.of(2019, 1, 1));
    WalletAccess lateEditor =
        access(
            UUID.randomUUID(),
            w,
            WalletAccess.WalletRole.EDITOR,
            WalletAccess.InvitationStatus.ACCEPTED,
            LocalDate.of(2023, 1, 1), // joined later, but is a writer
            "editor",
            LocalDate.of(2022, 1, 1));

    when(walletAccessRepository.findAllByUserId(meId)).thenReturn(List.of(mine));
    when(walletAccessRepository.findAllByWalletId(w.getId()))
        .thenReturn(List.of(mine, earlyViewer, lateEditor));

    accountDeletionService.deleteAccount(me, RAW_PASSWORD);

    assertEquals(WalletAccess.WalletRole.OWNER, lateEditor.getRole());
    assertEquals(WalletAccess.WalletRole.VIEWER, earlyViewer.getRole());
    verify(walletAccessRepository).save(lateEditor);
    verify(walletAccessRepository).delete(mine);
    verifyAccountRowRemoved();
  }

  @Test
  void deleteAccount_Transfer_InvitedAtTie_PicksEarliestUserCreatedAt() {
    passwordOk();
    Wallet w = wallet();
    WalletAccess mine = myOwnerAccess(w);
    LocalDate sameInvited = LocalDate.of(2022, 1, 1);
    WalletAccess youngerAccount =
        access(
            UUID.randomUUID(),
            w,
            WalletAccess.WalletRole.VIEWER,
            WalletAccess.InvitationStatus.ACCEPTED,
            sameInvited,
            "aaa",
            LocalDate.of(2021, 5, 5)); // newer account
    WalletAccess olderAccount =
        access(
            UUID.randomUUID(),
            w,
            WalletAccess.WalletRole.VIEWER, // same role → createdAt decides
            WalletAccess.InvitationStatus.ACCEPTED,
            sameInvited,
            "zzz",
            LocalDate.of(2018, 3, 3)); // oldest account → wins the tie

    when(walletAccessRepository.findAllByUserId(meId)).thenReturn(List.of(mine));
    when(walletAccessRepository.findAllByWalletId(w.getId()))
        .thenReturn(List.of(mine, youngerAccount, olderAccount));

    accountDeletionService.deleteAccount(me, RAW_PASSWORD);

    assertEquals(WalletAccess.WalletRole.OWNER, olderAccount.getRole());
    verify(walletAccessRepository).save(olderAccount);
    verify(walletAccessRepository).delete(mine);
    verifyAccountRowRemoved();
  }

  @Test
  void deleteAccount_Transfer_InvitedAtAndCreatedAtTie_PicksAlphabeticalUsername() {
    passwordOk();
    Wallet w = wallet();
    WalletAccess mine = myOwnerAccess(w);
    LocalDate sameInvited = LocalDate.of(2022, 1, 1);
    LocalDate sameCreated = LocalDate.of(2020, 1, 1);
    WalletAccess bob =
        access(
            UUID.randomUUID(),
            w,
            WalletAccess.WalletRole.VIEWER,
            WalletAccess.InvitationStatus.ACCEPTED,
            sameInvited,
            "Bob", // case-insensitive: "alice" < "Bob"
            sameCreated);
    WalletAccess alice =
        access(
            UUID.randomUUID(),
            w,
            WalletAccess.WalletRole.VIEWER, // same role → username decides
            WalletAccess.InvitationStatus.ACCEPTED,
            sameInvited,
            "alice", // wins alphabetically
            sameCreated);

    when(walletAccessRepository.findAllByUserId(meId)).thenReturn(List.of(mine));
    when(walletAccessRepository.findAllByWalletId(w.getId())).thenReturn(List.of(mine, bob, alice));

    accountDeletionService.deleteAccount(me, RAW_PASSWORD);

    assertEquals(WalletAccess.WalletRole.OWNER, alice.getRole());
    assertEquals(WalletAccess.WalletRole.VIEWER, bob.getRole());
    verify(walletAccessRepository).save(alice);
    verify(walletAccessRepository).delete(mine);
    verifyAccountRowRemoved();
  }
}
