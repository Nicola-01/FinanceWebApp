package dev.busato.FinanceWebApp.backend.mappers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.busato.FinanceWebApp.backend.dto.MemberResponse;
import dev.busato.FinanceWebApp.backend.dto.WalletInviteResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MemberMapperTest {
  @InjectMocks private MemberMapper memberMapper;

  @Test
  void mapToResponse_ShouldMapCorrectly() {
    User user = new User();
    user.setId(UUID.randomUUID());
    user.setUsername("member@example.com");
    WalletAccess access = new WalletAccess();
    access.setUser(user);
    access.setRole(WalletAccess.WalletRole.EDITOR);
    access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    MemberResponse response = memberMapper.mapToResponse(access);
    assertNotNull(response);
    assertEquals(user.getId(), response.getUserId());
    assertEquals(user.getUsername(), response.getUsername());
    assertEquals("EDITOR", response.getRole());
    assertEquals("ACCEPTED", response.getStatus());
  }

  @Test
  void mapToWalletInviteResponse_NestedWallet_IncludesDescription() {
    // Use a real WalletMapper so the nested WalletResponse is built end-to-end
    MemberMapper mapper = new MemberMapper(new WalletMapper(new ObjectMapper()));

    User user = new User();
    user.setId(UUID.randomUUID());
    user.setUsername("invitee@example.com");

    Wallet wallet = new Wallet();
    wallet.setId(UUID.randomUUID());
    wallet.setName("Shared Wallet");
    wallet.setDescription("Household expenses for 2026");

    WalletAccess access = new WalletAccess();
    access.setUser(user);
    access.setWallet(wallet);
    access.setRole(WalletAccess.WalletRole.VIEWER);
    access.setStatus(WalletAccess.InvitationStatus.PENDING);

    WalletInviteResponse response = mapper.mapToWalletInviteResponse(access, "owner@example.com");

    assertNotNull(response);
    assertNotNull(response.getWallet());
    assertEquals("owner@example.com", response.getWalletOwner());
    assertEquals("Household expenses for 2026", response.getWallet().getDescription());
  }
}
