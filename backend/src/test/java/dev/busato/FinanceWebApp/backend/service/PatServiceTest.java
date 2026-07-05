package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.dto.*;
import dev.busato.FinanceWebApp.backend.exceptions.InvalidTokenException;
import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.mappers.PatMapper;
import dev.busato.FinanceWebApp.backend.model.PersonalAccessToken;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.PersonalAccessTokenRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PatServiceTest {

  @Mock private PersonalAccessTokenRepository tokenRepository;
  @Mock private UserRepository userRepository;
  @Mock private WalletAccessRepository walletAccessRepository;
  @Mock private PatMapper patMapper;

  @InjectMocks private PatService patService;

  private UUID userId;
  private UUID tokenId;
  private UUID walletId;
  private User mockUser;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    tokenId = UUID.randomUUID();
    walletId = UUID.randomUUID();

    mockUser = new User();
    mockUser.setId(userId);
    mockUser.setUsername("testuser");
  }

  @Test
  void createToken_ValidRequest_CreatesTokenAndReturnsPlainTokenOnce() {
    PatCreateRequest request = new PatCreateRequest();
    request.setName("My PAT");
    request.setExpiresAt(LocalDateTime.now().plusDays(30));

    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    when(tokenRepository.save(any(PersonalAccessToken.class)))
        .thenAnswer(
            invocation -> {
              PersonalAccessToken saved = invocation.getArgument(0);
              saved.setId(tokenId);
              return saved;
            });

    PatCreateResponse mockResponse = PatCreateResponse.builder().build();
    mockResponse.setId(tokenId);
    mockResponse.setPlainToken("fin_pat_randomString");

    when(patMapper.toCreateResponse(any(PersonalAccessToken.class), any(String.class)))
        .thenReturn(mockResponse);

    PatCreateResponse response = patService.createToken(userId, request);

    assertNotNull(response);
    assertEquals(tokenId, response.getId());
    assertEquals("fin_pat_randomString", response.getPlainToken());

    verify(tokenRepository).save(any(PersonalAccessToken.class));
  }

  @Test
  void createToken_MissingName_ThrowsIllegalArgumentException() {
    PatCreateRequest request = new PatCreateRequest();
    request.setName("   "); // Blank name

    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));

    assertThrows(IllegalArgumentException.class, () -> patService.createToken(userId, request));
  }

  @Test
  void createToken_NameTooLong_ThrowsIllegalArgumentException() {
    PatCreateRequest request = new PatCreateRequest();
    request.setName("A".repeat(51)); // 51 chars

    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));

    assertThrows(IllegalArgumentException.class, () -> patService.createToken(userId, request));
  }

  @Test
  void createToken_InvalidUser_ThrowsUserNotFoundException() {
    when(userRepository.findById(userId)).thenReturn(Optional.empty());
    PatCreateRequest request = new PatCreateRequest();
    assertThrows(UserNotFoundException.class, () -> patService.createToken(userId, request));
  }

  @Test
  void createToken_GrantWriteWhileViewer_ThrowsIllegalArgumentException() {
    PatCreateRequest request = new PatCreateRequest();
    request.setName("Test");
    WalletPermission perm = new WalletPermission(walletId, List.of("WRITE"));
    request.setWalletPermissions(List.of(perm));

    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));

    WalletAccess access = new WalletAccess();
    access.setRole(WalletAccess.WalletRole.VIEWER);
    when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId))
        .thenReturn(Optional.of(access));

    IllegalArgumentException ex =
        assertThrows(IllegalArgumentException.class, () -> patService.createToken(userId, request));
    assertTrue(ex.getMessage().contains("Cannot grant WRITE permission"));
  }

  @Test
  void validateToken_ValidToken_ReturnsTokenAndUpdateLastUsedAsync() {
    String plainToken = "fin_pat_randomToken123";
    String hashedToken = PatService.hashToken(plainToken);

    PersonalAccessToken token = new PersonalAccessToken();
    token.setId(tokenId);
    token.setTokenHash(hashedToken);
    // No expiration set

    when(tokenRepository.findByTokenHash(hashedToken)).thenReturn(Optional.of(token));

    // Mock for updateLastUsedAsync
    when(tokenRepository.findById(tokenId)).thenReturn(Optional.of(token));

    PersonalAccessToken validated = patService.validateToken(plainToken);

    assertNotNull(validated);
    assertEquals(tokenId, validated.getId());

    // Verify updateLastUsedAsync called save
    ArgumentCaptor<PersonalAccessToken> captor = ArgumentCaptor.forClass(PersonalAccessToken.class);
    verify(tokenRepository).save(captor.capture());
    assertNotNull(captor.getValue().getLastUsedAt());
  }

  @Test
  void validateToken_ExpiredToken_ThrowsInvalidTokenException() {
    String plainToken = "fin_pat_expiredToken";
    String hashedToken = PatService.hashToken(plainToken);

    PersonalAccessToken token = new PersonalAccessToken();
    token.setTokenHash(hashedToken);
    token.setExpiresAt(LocalDateTime.now().minusDays(1)); // Expired yesterday

    when(tokenRepository.findByTokenHash(hashedToken)).thenReturn(Optional.of(token));

    assertThrows(InvalidTokenException.class, () -> patService.validateToken(plainToken));
  }

  @Test
  void validateToken_UnknownToken_ThrowsInvalidTokenException() {
    String plainToken = "fin_pat_unknownToken";
    String hashedToken = PatService.hashToken(plainToken);

    when(tokenRepository.findByTokenHash(hashedToken)).thenReturn(Optional.empty());

    assertThrows(InvalidTokenException.class, () -> patService.validateToken(plainToken));
  }

  @Test
  void validateToken_PausedToken_ThrowsInvalidTokenException() {
    String plainToken = "fin_pat_pausedToken";
    String hashedToken = PatService.hashToken(plainToken);

    PersonalAccessToken token = new PersonalAccessToken();
    token.setId(tokenId);
    token.setTokenHash(hashedToken);
    token.setPaused(true);

    when(tokenRepository.findByTokenHash(hashedToken)).thenReturn(Optional.of(token));

    InvalidTokenException ex =
        assertThrows(InvalidTokenException.class, () -> patService.validateToken(plainToken));
    assertEquals("API token is paused", ex.getMessage());

    // A rejected paused token must NOT bump lastUsedAt
    verify(tokenRepository, never()).save(any(PersonalAccessToken.class));
  }

  @Test
  void listTokens_ReturnsTokensList() {
    PersonalAccessToken token = new PersonalAccessToken();
    when(tokenRepository.findAllByUserId(userId)).thenReturn(List.of(token));

    PatResponse patResponse = PatResponse.builder().build();
    when(patMapper.toResponse(token)).thenReturn(patResponse);

    List<PatResponse> result = patService.listTokens(userId);
    assertEquals(1, result.size());
  }

  @Test
  void revokeToken_DeletesToken() {
    patService.revokeToken(tokenId, userId);
    verify(tokenRepository).deleteByIdAndUserId(tokenId, userId);
  }

  @Test
  void updateToken_UpdatesPermissions() {
    PatUpdateRequest request = new PatUpdateRequest();
    request.setWalletPermissions(List.of(new WalletPermission(walletId, List.of("READ"))));

    PersonalAccessToken token = new PersonalAccessToken();
    when(tokenRepository.findByIdAndUserId(tokenId, userId)).thenReturn(Optional.of(token));
    when(patMapper.serializeWalletPermissions(anyList())).thenReturn("[{...}]");
    when(tokenRepository.save(token)).thenReturn(token);

    PatResponse expectedResponse = PatResponse.builder().build();
    when(patMapper.toResponse(token)).thenReturn(expectedResponse);

    PatResponse result = patService.updateToken(tokenId, userId, request);
    assertNotNull(result);
    verify(tokenRepository).save(token);
  }

  @Test
  void addWalletToToken_AddsReadWritePermissions() {
    PersonalAccessToken token = new PersonalAccessToken();
    token.setWalletPermissions("[]");

    when(tokenRepository.findById(tokenId)).thenReturn(Optional.of(token));
    when(patMapper.parseWalletPermissions("[]")).thenReturn(List.of());
    when(patMapper.serializeWalletPermissions(anyList()))
        .thenReturn("[{\"walletId\":\"" + walletId + "\", \"permissions\":[\"READ\",\"WRITE\"]}]");

    patService.addWalletToToken(tokenId, walletId);

    verify(tokenRepository).save(token);
    assertEquals(
        "[{\"walletId\":\"" + walletId + "\", \"permissions\":[\"READ\",\"WRITE\"]}]",
        token.getWalletPermissions());
  }

  // ==================== createToken — edge cases ====================

  @Test
  void createToken_NullWalletPermissions_SkipsValidation() {
    PatCreateRequest request = new PatCreateRequest();
    request.setName("Simple PAT");
    request.setWalletPermissions(null); // null → validateTokenPermissions does early return

    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    when(tokenRepository.save(any(PersonalAccessToken.class)))
        .thenAnswer(
            invocation -> {
              PersonalAccessToken saved = invocation.getArgument(0);
              saved.setId(tokenId);
              return saved;
            });

    PatCreateResponse mockResponse = PatCreateResponse.builder().build();
    when(patMapper.toCreateResponse(any(), any())).thenReturn(mockResponse);

    assertDoesNotThrow(() -> patService.createToken(userId, request));
    verify(tokenRepository).save(any());
  }

  @Test
  void createToken_WritePermissionWithEditorAccess_Succeeds() {
    PatCreateRequest request = new PatCreateRequest();
    request.setName("Editor PAT");
    WalletPermission perm = new WalletPermission(walletId, List.of("WRITE"));
    request.setWalletPermissions(List.of(perm));

    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));

    WalletAccess access = new WalletAccess();
    access.setRole(WalletAccess.WalletRole.EDITOR);
    when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId))
        .thenReturn(Optional.of(access));

    when(tokenRepository.save(any(PersonalAccessToken.class)))
        .thenAnswer(
            invocation -> {
              PersonalAccessToken saved = invocation.getArgument(0);
              saved.setId(tokenId);
              return saved;
            });

    PatCreateResponse mockResponse = PatCreateResponse.builder().build();
    when(patMapper.toCreateResponse(any(), any())).thenReturn(mockResponse);

    assertDoesNotThrow(() -> patService.createToken(userId, request));
  }

  @Test
  void createToken_WalletNotAccessible_ThrowsException() {
    PatCreateRequest request = new PatCreateRequest();
    request.setName("No Access PAT");
    WalletPermission perm = new WalletPermission(walletId, List.of("WRITE"));
    request.setWalletPermissions(List.of(perm));

    when(userRepository.findById(userId)).thenReturn(Optional.of(mockUser));
    when(walletAccessRepository.findByUserIdAndWalletId(userId, walletId))
        .thenReturn(Optional.empty());

    assertThrows(IllegalArgumentException.class, () -> patService.createToken(userId, request));
  }

  // ==================== updateToken — edge case ====================

  @Test
  void updateToken_TokenNotFound_ThrowsException() {
    PatUpdateRequest request = new PatUpdateRequest();
    when(tokenRepository.findByIdAndUserId(tokenId, userId)).thenReturn(Optional.empty());

    assertThrows(
        InvalidTokenException.class, () -> patService.updateToken(tokenId, userId, request));
  }

  // ==================== setPaused ====================

  @Test
  void setPaused_Pause_FlipsFlagAndReturnsResponse() {
    PersonalAccessToken token = new PersonalAccessToken();
    token.setPaused(false);

    when(tokenRepository.findByIdAndUserId(tokenId, userId)).thenReturn(Optional.of(token));
    when(tokenRepository.save(token)).thenReturn(token);

    PatResponse expected = PatResponse.builder().paused(true).build();
    when(patMapper.toResponse(token)).thenReturn(expected);

    PatResponse result = patService.setPaused(tokenId, userId, true);

    assertNotNull(result);
    assertTrue(result.isPaused());
    assertTrue(token.isPaused());
    verify(tokenRepository).save(token);
  }

  @Test
  void setPaused_Resume_FlipsFlagAndReturnsResponse() {
    PersonalAccessToken token = new PersonalAccessToken();
    token.setPaused(true);

    when(tokenRepository.findByIdAndUserId(tokenId, userId)).thenReturn(Optional.of(token));
    when(tokenRepository.save(token)).thenReturn(token);

    PatResponse expected = PatResponse.builder().paused(false).build();
    when(patMapper.toResponse(token)).thenReturn(expected);

    PatResponse result = patService.setPaused(tokenId, userId, false);

    assertNotNull(result);
    assertFalse(result.isPaused());
    assertFalse(token.isPaused());
    verify(tokenRepository).save(token);
  }

  @Test
  void setPaused_TokenNotOwned_ThrowsException() {
    when(tokenRepository.findByIdAndUserId(tokenId, userId)).thenReturn(Optional.empty());

    assertThrows(InvalidTokenException.class, () -> patService.setPaused(tokenId, userId, true));
    verify(tokenRepository, never()).save(any());
  }

  // ==================== bulkDeleteTokens ====================

  @Test
  void bulkDeleteTokens_DeletesOnlyCallerOwnedTokens() {
    List<UUID> ids = List.of(tokenId, UUID.randomUUID());

    patService.bulkDeleteTokens(ids, userId);

    verify(tokenRepository).deleteAllByIdInAndUserId(ids, userId);
  }

  @Test
  void bulkDeleteTokens_EmptyIds_DoesNothing() {
    patService.bulkDeleteTokens(List.of(), userId);
    verify(tokenRepository, never()).deleteAllByIdInAndUserId(anyCollection(), any());
  }

  @Test
  void bulkDeleteTokens_NullIds_DoesNothing() {
    patService.bulkDeleteTokens(null, userId);
    verify(tokenRepository, never()).deleteAllByIdInAndUserId(anyCollection(), any());
  }

  // ==================== bulkSetPaused ====================

  @Test
  void bulkSetPaused_Pause_SetsPausedTrueOnCallerTokensAndReturnsResponses() {
    UUID secondId = UUID.randomUUID();
    List<UUID> ids = List.of(tokenId, secondId);

    PersonalAccessToken token1 = new PersonalAccessToken();
    token1.setId(tokenId);
    token1.setPaused(false);
    PersonalAccessToken token2 = new PersonalAccessToken();
    token2.setId(secondId);
    token2.setPaused(false);
    List<PersonalAccessToken> owned = List.of(token1, token2);

    when(tokenRepository.findAllByIdInAndUserId(ids, userId)).thenReturn(owned);
    when(tokenRepository.saveAll(owned)).thenReturn(owned);
    when(patMapper.toResponse(token1))
        .thenReturn(PatResponse.builder().id(tokenId).paused(true).build());
    when(patMapper.toResponse(token2))
        .thenReturn(PatResponse.builder().id(secondId).paused(true).build());

    List<PatResponse> result = patService.bulkSetPaused(ids, userId, true);

    assertEquals(2, result.size());
    assertTrue(result.get(0).isPaused());
    assertTrue(result.get(1).isPaused());
    assertTrue(token1.isPaused());
    assertTrue(token2.isPaused());
    verify(tokenRepository).saveAll(owned);
  }

  @Test
  void bulkSetPaused_Resume_SetsPausedFalseOnCallerTokens() {
    List<UUID> ids = List.of(tokenId);

    PersonalAccessToken token1 = new PersonalAccessToken();
    token1.setId(tokenId);
    token1.setPaused(true);
    List<PersonalAccessToken> owned = List.of(token1);

    when(tokenRepository.findAllByIdInAndUserId(ids, userId)).thenReturn(owned);
    when(tokenRepository.saveAll(owned)).thenReturn(owned);
    when(patMapper.toResponse(token1))
        .thenReturn(PatResponse.builder().id(tokenId).paused(false).build());

    List<PatResponse> result = patService.bulkSetPaused(ids, userId, false);

    assertEquals(1, result.size());
    assertFalse(result.get(0).isPaused());
    assertFalse(token1.isPaused());
    verify(tokenRepository).saveAll(owned);
  }

  @Test
  void bulkSetPaused_OnlyCallerOwnedTokensAreLoadedAndUpdated() {
    UUID foreignId = UUID.randomUUID();
    List<UUID> ids = List.of(tokenId, foreignId);

    // Repository only returns the caller-owned token; the foreign one is filtered out by the query.
    PersonalAccessToken ownedToken = new PersonalAccessToken();
    ownedToken.setId(tokenId);
    ownedToken.setPaused(false);
    List<PersonalAccessToken> owned = List.of(ownedToken);

    when(tokenRepository.findAllByIdInAndUserId(ids, userId)).thenReturn(owned);
    when(tokenRepository.saveAll(owned)).thenReturn(owned);
    when(patMapper.toResponse(ownedToken))
        .thenReturn(PatResponse.builder().id(tokenId).paused(true).build());

    List<PatResponse> result = patService.bulkSetPaused(ids, userId, true);

    // Only the caller-owned token is returned/updated; the foreign id is silently ignored.
    assertEquals(1, result.size());
    assertEquals(tokenId, result.get(0).getId());
    verify(tokenRepository).findAllByIdInAndUserId(ids, userId);
  }

  @Test
  void bulkSetPaused_EmptyIds_ReturnsEmptyAndSkipsRepository() {
    List<PatResponse> result = patService.bulkSetPaused(List.of(), userId, true);

    assertTrue(result.isEmpty());
    verify(tokenRepository, never()).findAllByIdInAndUserId(anyCollection(), any());
    verify(tokenRepository, never()).saveAll(anyList());
  }

  @Test
  void bulkSetPaused_NullIds_ReturnsEmptyAndSkipsRepository() {
    List<PatResponse> result = patService.bulkSetPaused(null, userId, true);

    assertTrue(result.isEmpty());
    verify(tokenRepository, never()).findAllByIdInAndUserId(anyCollection(), any());
    verify(tokenRepository, never()).saveAll(anyList());
  }

  // ==================== addWalletToToken — edge case ====================

  @Test
  void addWalletToToken_TokenNotFound_ReturnsEarly() {
    when(tokenRepository.findById(tokenId)).thenReturn(Optional.empty());

    assertDoesNotThrow(() -> patService.addWalletToToken(tokenId, walletId));
    verify(tokenRepository, never()).save(any());
  }
}
