package dev.busato.FinanceWebApp.backend.mappers;

import static org.junit.jupiter.api.Assertions.*;

import dev.busato.FinanceWebApp.backend.dto.PatCreateResponse;
import dev.busato.FinanceWebApp.backend.dto.PatResponse;
import dev.busato.FinanceWebApp.backend.dto.WalletPermission;
import dev.busato.FinanceWebApp.backend.model.PersonalAccessToken;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class PatMapperTest {
  private PatMapper patMapper;

  @BeforeEach
  void setUp() {
    patMapper = new PatMapper();
  }

  @Test
  void toCreateResponse_ShouldMapCorrectly() {
    PersonalAccessToken token = new PersonalAccessToken();
    token.setId(UUID.randomUUID());
    token.setName("My PAT");
    token.setTokenPrefix("PREFIX_");
    token.setWalletPermissions(
        "[{\"walletId\":\"" + UUID.randomUUID() + "\",\"permissions\":[\"READ\"]}]");
    token.setCreatedAt(LocalDateTime.now());
    token.setExpiresAt(LocalDateTime.now().plusDays(30));
    PatCreateResponse response = patMapper.toCreateResponse(token, "plain-token-123");
    assertNotNull(response);
    assertEquals(token.getId(), response.getId());
    assertEquals("My PAT", response.getName());
    assertEquals("PREFIX_", response.getTokenPrefix());
    assertEquals("plain-token-123", response.getPlainToken());
    assertEquals(token.getCreatedAt(), response.getCreatedAt());
    assertEquals(token.getExpiresAt(), response.getExpiresAt());
    assertFalse(response.getWalletPermissions().isEmpty());
  }

  @Test
  void toResponse_ShouldMapCorrectly() {
    PersonalAccessToken token = new PersonalAccessToken();
    token.setId(UUID.randomUUID());
    token.setName("My PAT");
    token.setTokenPrefix("PREFIX_");
    token.setWalletPermissions(
        "[{\"walletId\":\"" + UUID.randomUUID() + "\",\"permissions\":[\"READ\"]}]");
    token.setCreatedAt(LocalDateTime.now());
    token.setExpiresAt(LocalDateTime.now().plusDays(30));
    token.setLastUsedAt(LocalDateTime.now().plusDays(1));
    PatResponse response = patMapper.toResponse(token);
    assertNotNull(response);
    assertEquals(token.getId(), response.getId());
    assertEquals("My PAT", response.getName());
    assertEquals("PREFIX_", response.getTokenPrefix());
    assertEquals(token.getCreatedAt(), response.getCreatedAt());
    assertEquals(token.getExpiresAt(), response.getExpiresAt());
    assertEquals(token.getLastUsedAt(), response.getLastUsedAt());
    assertFalse(response.getWalletPermissions().isEmpty());
  }

  @Test
  void parseWalletPermissions_WithValidJson_ShouldReturnList() {
    UUID validId = UUID.randomUUID();
    String json =
        "[{\"walletId\":\"" + validId.toString() + "\",\"permissions\":[\"READ\",\"WRITE\"]}]";
    List<WalletPermission> perms = patMapper.parseWalletPermissions(json);

    assertNotNull(perms);
    assertEquals(1, perms.size());
    assertEquals(validId, perms.get(0).walletId());
    assertTrue(perms.get(0).permissions().contains("READ"));
  }

  @Test
  void parseWalletPermissions_WithEmptyJson_ShouldReturnEmptyList() {
    List<WalletPermission> perms = patMapper.parseWalletPermissions("");
    assertTrue(perms.isEmpty());

    perms = patMapper.parseWalletPermissions(null);
    assertTrue(perms.isEmpty());
  }

  @Test
  void serializeWalletPermissions_WithValidList_ShouldReturnJson() {
    UUID someId = UUID.randomUUID();
    WalletPermission perm = new WalletPermission(someId, List.of("READ"));

    String json = patMapper.serializeWalletPermissions(List.of(perm));
    assertNotNull(json);
    assertTrue(json.contains(someId.toString()));
    assertTrue(json.contains("READ"));
  }

  @Test
  void serializeWalletPermissions_WithNullOrEmpty_ShouldReturnEmptyArray() {
    assertEquals("[]", patMapper.serializeWalletPermissions(null));
    assertEquals("[]", patMapper.serializeWalletPermissions(List.of()));
  }

  @Test
  void parseWalletPermissions_WithInvalidJson_ShouldThrowException() {
    assertThrows(RuntimeException.class, () -> patMapper.parseWalletPermissions("invalid json"));
  }
}
