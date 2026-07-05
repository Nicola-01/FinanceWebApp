package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.dto.TagResponse;
import dev.busato.FinanceWebApp.backend.dto.WalletRequest;
import dev.busato.FinanceWebApp.backend.dto.WalletResponse;
import dev.busato.FinanceWebApp.backend.dto.WalletTagsResponse;
import dev.busato.FinanceWebApp.backend.exceptions.UnauthorizedAccessException;
import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.mappers.TagMapper;
import dev.busato.FinanceWebApp.backend.mappers.WalletMapper;
import dev.busato.FinanceWebApp.backend.model.PersonalAccessToken;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.TagRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import dev.busato.FinanceWebApp.backend.security.WalletSecurity;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class WalletServiceTest {

  @Mock private WalletRepository walletRepository;
  @Mock private WalletAccessRepository walletAccessRepository;
  @Mock private UserRepository userRepository;
  @Mock private WalletMapper walletMapper;
  @Mock private WalletSecurity walletSecurity;
  @Mock private PatService patService;
  @Mock private TagRepository tagRepository;
  @Mock private TagMapper tagMapper;

  @InjectMocks private WalletService walletService;

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
    when(walletRepository.save(any(Wallet.class)))
        .thenAnswer(
            i -> {
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
  void createWallet_WithDescription_PersistsDescription() {
    WalletRequest request = new WalletRequest();
    request.setName("New Wallet");
    request.setDescription("A shared holiday budget");

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(walletRepository.save(any(Wallet.class)))
        .thenAnswer(
            i -> {
              Wallet w = i.getArgument(0);
              w.setId(walletId);
              return w;
            });
    when(walletMapper.mapToResponse(any(WalletAccess.class)))
        .thenReturn(WalletResponse.builder().build());

    walletService.createWallet(request, userId);

    org.mockito.ArgumentCaptor<Wallet> captor = org.mockito.ArgumentCaptor.forClass(Wallet.class);
    verify(walletRepository).save(captor.capture());
    assertEquals("A shared holiday budget", captor.getValue().getDescription());
  }

  @Test
  void updateWallet_OmittingDescription_DoesNotWipeExisting() {
    wallet.setDescription("Original description");

    WalletRequest request = new WalletRequest();
    request.setName("Updated Wallet");
    // description intentionally left null (frontend never sends it on edit)

    when(walletAccessRepository.findByWalletIdAndUserIdAndRole(
            walletId, userId, WalletAccess.WalletRole.OWNER))
        .thenReturn(Optional.of(walletAccess));

    walletService.updateWallet(walletId, request, userId);

    assertEquals("Original description", wallet.getDescription());
    assertEquals("Updated Wallet", wallet.getName());
  }

  @Test
  void createWallet_WithPatToken_GrantsWalletToPat() {
    WalletRequest request = new WalletRequest();
    request.setName("New Wallet");

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(walletRepository.save(any(Wallet.class)))
        .thenAnswer(
            i -> {
              Wallet w = i.getArgument(0);
              w.setId(walletId);
              return w;
            });

    // Set PAT in security context
    PersonalAccessToken pat = new PersonalAccessToken();
    UUID patId = UUID.randomUUID();
    pat.setId(patId);

    UsernamePasswordAuthenticationToken auth =
        new UsernamePasswordAuthenticationToken(user, pat, List.of());
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

    when(walletAccessRepository.findByWalletIdAndUserIdAndRole(
            walletId, userId, WalletAccess.WalletRole.OWNER))
        .thenReturn(Optional.of(walletAccess));

    walletService.updateWallet(walletId, request, userId);

    assertEquals("Updated Wallet", wallet.getName());
  }

  @Test
  void updateWallet_NotOwner_ThrowsException() {
    WalletRequest request = new WalletRequest();
    request.setName("Updated Wallet");

    when(walletAccessRepository.findByWalletIdAndUserIdAndRole(
            walletId, userId, WalletAccess.WalletRole.OWNER))
        .thenReturn(Optional.empty());

    assertThrows(
        UnauthorizedAccessException.class,
        () -> walletService.updateWallet(walletId, request, userId));
  }

  @Test
  void removeWallet_Owner_DeletesWallet() {
    when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId))
        .thenReturn(Optional.of(walletAccess));

    walletService.removeWallet(walletId, userId);

    verify(walletRepository).delete(wallet);
  }

  @Test
  void removeWallet_NotOwner_LeavesWallet() {
    walletAccess.setRole(WalletAccess.WalletRole.VIEWER);
    when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId))
        .thenReturn(Optional.of(walletAccess));

    walletService.removeWallet(walletId, userId);

    verify(walletRepository, never()).delete(any());
    assertEquals(WalletAccess.InvitationStatus.LEFT, walletAccess.getStatus());
  }

  @Test
  void getWallets_ReturnsOnlyAccessibleWallets() {
    when(walletAccessRepository.findAllByUserIdAndStatus(
            userId, WalletAccess.InvitationStatus.ACCEPTED))
        .thenReturn(List.of(walletAccess));
    when(walletSecurity.hasReadAccessQuietly(userId, walletId)).thenReturn(true);

    List<WalletResponse> responses = walletService.getWallets(userId);
    assertEquals(1, responses.size());
  }

  // ==================== createWallet — edge case ====================

  @Test
  void createWallet_NameTooShort_ThrowsException() {
    WalletRequest request = new WalletRequest();
    request.setName("AB"); // < 3 chars

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));

    assertThrows(IllegalArgumentException.class, () -> walletService.createWallet(request, userId));
  }

  @Test
  void createWallet_NameTooLong_ThrowsException() {
    WalletRequest request = new WalletRequest();
    request.setName("A".repeat(26)); // > 25 chars

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));

    assertThrows(IllegalArgumentException.class, () -> walletService.createWallet(request, userId));
  }

  // ==================== updateWallet — edge case ====================

  @Test
  void updateWallet_NameTooShort_ThrowsException() {
    WalletRequest request = new WalletRequest();
    request.setName("AB"); // < 3 chars

    assertThrows(
        IllegalArgumentException.class,
        () -> walletService.updateWallet(walletId, request, userId));
  }

  // ==================== removeWallet — edge case ====================

  @Test
  void removeWallet_NoAccess_ThrowsUnauthorizedAccessException() {
    when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId))
        .thenReturn(Optional.empty());

    assertThrows(
        UnauthorizedAccessException.class, () -> walletService.removeWallet(walletId, userId));
  }

  // ==================== getWallet — edge case ====================

  @Test
  void getWallet_WalletNotFound_ThrowsWalletNotFoundException() {
    when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId))
        .thenReturn(Optional.empty());

    assertThrows(
        dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException.class,
        () -> walletService.getWallet(userId, walletId));
  }

  // ==================== getWalletsWithTags ====================

  private WalletAccess acceptedAccess(Wallet w) {
    WalletAccess access = new WalletAccess();
    // WalletAccess equals/hashCode is based only on the composite id, so give each a distinct id
    // to keep per-access mock stubbing unambiguous.
    access.setId(new WalletAccess.WalletAccessId(userId, w.getId()));
    access.setUser(user);
    access.setWallet(w);
    access.setRole(WalletAccess.WalletRole.OWNER);
    access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    return access;
  }

  private Tag tagFor(Wallet w, String name) {
    Tag tag = new Tag();
    tag.setName(name);
    tag.setWallet(w);
    return tag;
  }

  @Test
  void getWalletsWithTags_GroupsTagsToCorrectWalletAndSortsByCreatedAtDesc() {
    UUID walletId1 = UUID.randomUUID();
    UUID walletId2 = UUID.randomUUID();

    Wallet wallet1 = new Wallet();
    wallet1.setId(walletId1);
    Wallet wallet2 = new Wallet();
    wallet2.setId(walletId2);

    WalletAccess access1 = acceptedAccess(wallet1);
    WalletAccess access2 = acceptedAccess(wallet2);

    when(walletAccessRepository.findAllByUserIdAndStatus(
            userId, WalletAccess.InvitationStatus.ACCEPTED))
        .thenReturn(List.of(access1, access2));
    when(walletSecurity.hasReadAccessQuietly(userId, walletId1)).thenReturn(true);
    when(walletSecurity.hasReadAccessQuietly(userId, walletId2)).thenReturn(true);

    // wallet1 is older, wallet2 is newer -> newest (wallet2) must come first.
    WalletResponse response1 =
        WalletResponse.builder().id(walletId1).createdAt(LocalDate.of(2026, 1, 1)).build();
    WalletResponse response2 =
        WalletResponse.builder().id(walletId2).createdAt(LocalDate.of(2026, 1, 2)).build();
    when(walletMapper.mapToResponse(access1)).thenReturn(response1);
    when(walletMapper.mapToResponse(access2)).thenReturn(response2);

    // wallet1 owns two tags; wallet2 owns one tag.
    Tag tag1a = tagFor(wallet1, "Food");
    Tag tag1b = tagFor(wallet1, "Rent");
    Tag tag2 = tagFor(wallet2, "Salary");
    when(tagRepository.getTagsByWalletIdIn(anyList())).thenReturn(List.of(tag1a, tag1b, tag2));
    when(tagMapper.mapToResponse(any(Tag.class)))
        .thenAnswer(i -> TagResponse.builder().name(((Tag) i.getArgument(0)).getName()).build());

    List<WalletTagsResponse> result = walletService.getWalletsWithTags(userId);

    assertEquals(2, result.size());
    // Sorted by createdAt descending -> wallet2 first.
    assertEquals(walletId2, result.get(0).getWallet().getId());
    assertEquals(walletId1, result.get(1).getWallet().getId());

    // wallet2 has its single tag; wallet1 has its two tags. No cross-contamination.
    assertEquals(
        List.of("Salary"), result.get(0).getTags().stream().map(TagResponse::getName).toList());
    assertEquals(
        List.of("Food", "Rent"),
        result.get(1).getTags().stream().map(TagResponse::getName).toList());

    // Batch finder used exactly once; the per-wallet finder is never used (no N+1).
    verify(tagRepository, times(1)).getTagsByWalletIdIn(anyList());
    verify(tagRepository, never()).getTagsByWalletId(any(UUID.class));
  }

  @Test
  void getWalletsWithTags_WalletWithNoTags_ReturnsEmptyTagsList() {
    UUID walletId1 = UUID.randomUUID();
    Wallet wallet1 = new Wallet();
    wallet1.setId(walletId1);
    WalletAccess access1 = acceptedAccess(wallet1);

    when(walletAccessRepository.findAllByUserIdAndStatus(
            userId, WalletAccess.InvitationStatus.ACCEPTED))
        .thenReturn(List.of(access1));
    when(walletSecurity.hasReadAccessQuietly(userId, walletId1)).thenReturn(true);
    when(walletMapper.mapToResponse(access1))
        .thenReturn(
            WalletResponse.builder().id(walletId1).createdAt(LocalDate.of(2026, 1, 1)).build());
    // No tags exist for this wallet.
    when(tagRepository.getTagsByWalletIdIn(anyList())).thenReturn(List.of());

    List<WalletTagsResponse> result = walletService.getWalletsWithTags(userId);

    assertEquals(1, result.size());
    assertNotNull(result.get(0).getTags());
    assertTrue(result.get(0).getTags().isEmpty());
    verify(tagRepository, times(1)).getTagsByWalletIdIn(anyList());
  }

  @Test
  void getWalletsWithTags_NoAcceptedWallets_ReturnsEmptyAndSkipsBatchQuery() {
    when(walletAccessRepository.findAllByUserIdAndStatus(
            userId, WalletAccess.InvitationStatus.ACCEPTED))
        .thenReturn(List.of());

    List<WalletTagsResponse> result = walletService.getWalletsWithTags(userId);

    assertTrue(result.isEmpty());
    // Empty guard: never issue a `WHERE id IN ()` query.
    verify(tagRepository, never()).getTagsByWalletIdIn(anyList());
    verify(tagRepository, never()).getTagsByWalletId(any(UUID.class));
  }
}
