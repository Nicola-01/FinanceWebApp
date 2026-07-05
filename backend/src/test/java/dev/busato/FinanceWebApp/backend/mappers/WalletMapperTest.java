package dev.busato.FinanceWebApp.backend.mappers;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.busato.FinanceWebApp.backend.dto.WalletResponse;
import dev.busato.FinanceWebApp.backend.model.PersonalAccessToken;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class WalletMapperTest {
  @Mock private ObjectMapper objectMapper;
  @InjectMocks private WalletMapper walletMapper;
  private WalletAccess walletAccess;
  private Wallet wallet;

  @BeforeEach
  void setUp() {
    wallet = new Wallet();
    wallet.setId(UUID.randomUUID());
    wallet.setName("Test Wallet");
    wallet.setDescription("A shared family wallet");
    wallet.setCurrency("EUR");
    wallet.setIcon("icon");
    wallet.setColor("#000000");
    wallet.setCreatedAt(LocalDate.now());
    walletAccess = new WalletAccess();
    walletAccess.setWallet(wallet);
    walletAccess.setRole(WalletAccess.WalletRole.OWNER);
  }

  @AfterEach
  void tearDown() {
    SecurityContextHolder.clearContext();
  }

  @Test
  void mapToResponse_WithoutAuth_ShouldMapCorrectly() {
    WalletResponse response = walletMapper.mapToResponse(walletAccess);
    assertNotNull(response);
    assertEquals(wallet.getId(), response.getId());
    assertEquals("Test Wallet", response.getName());
    assertEquals("A shared family wallet", response.getDescription());
    assertEquals(WalletAccess.WalletRole.OWNER, response.getUserRole());
    assertNull(response.getTokenAccess());
  }

  @Test
  void mapToResponse_WithPatAuth_ShouldMapTokenRole() throws Exception {
    SecurityContext securityContext = mock(SecurityContext.class);
    Authentication authentication = mock(Authentication.class);
    PersonalAccessToken pat = new PersonalAccessToken();
    String json =
        "[{\"walletId\":\"" + wallet.getId().toString() + "\", \"permissions\":[\"WRITE\"]}]";
    pat.setWalletPermissions(json);
    when(securityContext.getAuthentication()).thenReturn(authentication);
    when(authentication.getCredentials()).thenReturn(pat);
    SecurityContextHolder.setContext(securityContext);
    WalletMapper.PatWalletPermission perm = new WalletMapper.PatWalletPermission();
    perm.setWalletId(wallet.getId().toString());
    perm.setPermissions(List.of("WRITE"));
    when(objectMapper.readValue(eq(json), any(TypeReference.class))).thenReturn(List.of(perm));
    WalletResponse response = walletMapper.mapToResponse(walletAccess);
    assertNotNull(response);
    assertEquals(WalletAccess.WalletRole.OWNER, response.getUserRole());
    assertEquals(WalletAccess.WalletRole.EDITOR, response.getTokenAccess());
  }

  @Test
  void mapToResponse_WithPatAuth_ReadAccess_ShouldMapTokenRole() throws Exception {
    SecurityContext securityContext = mock(SecurityContext.class);
    Authentication authentication = mock(Authentication.class);
    PersonalAccessToken pat = new PersonalAccessToken();
    String json =
        "[{\"walletId\":\"" + wallet.getId().toString() + "\", \"permissions\":[\"READ\"]}]";
    pat.setWalletPermissions(json);
    when(securityContext.getAuthentication()).thenReturn(authentication);
    when(authentication.getCredentials()).thenReturn(pat);
    SecurityContextHolder.setContext(securityContext);
    WalletMapper.PatWalletPermission perm = new WalletMapper.PatWalletPermission();
    perm.setWalletId(wallet.getId().toString());
    perm.setPermissions(List.of("READ"));
    when(objectMapper.readValue(eq(json), any(TypeReference.class))).thenReturn(List.of(perm));
    WalletResponse response = walletMapper.mapToResponse(walletAccess);
    assertNotNull(response);
    assertEquals(WalletAccess.WalletRole.VIEWER, response.getTokenAccess());
  }
}
