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

  // ==================== addWalletToToken — edge case ====================

  @Test
  void addWalletToToken_TokenNotFound_ReturnsEarly() {
    when(tokenRepository.findById(tokenId)).thenReturn(Optional.empty());

    assertDoesNotThrow(() -> patService.addWalletToToken(tokenId, walletId));
    verify(tokenRepository, never()).save(any());
  }
}
