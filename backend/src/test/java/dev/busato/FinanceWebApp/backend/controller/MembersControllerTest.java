package dev.busato.FinanceWebApp.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import dev.busato.FinanceWebApp.backend.dto.MemberRequest;
import dev.busato.FinanceWebApp.backend.dto.MemberResponse;
import dev.busato.FinanceWebApp.backend.dto.WalletInviteResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.service.MemberService;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;

@WebMvcTest(
    controllers = MembersController.class,
    excludeAutoConfiguration = {
      org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class
    })
class MembersControllerTest extends BaseWebMvcTest {

  @org.springframework.test.context.bean.override.mockito.MockitoBean
  private MemberService memberService;

  @Test
  void getMembers_ShouldReturn200() throws Exception {
    UUID walletId = UUID.randomUUID();
    MemberResponse mockResponse = MemberResponse.builder().username("testuser").build();

    when(memberService.getMembers(eq(walletId), any(UUID.class))).thenReturn(List.of(mockResponse));

    mockMvc
        .perform(get("/api/invitations/{walletID}", walletId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].username").value("testuser"));
  }

  @Test
  void inviteMember_ShouldReturn200() throws Exception {
    UUID walletId = UUID.randomUUID();
    MemberRequest request = MemberRequest.builder().user("testuser").build();
    MemberResponse mockResponse = MemberResponse.builder().username("testuser").build();

    when(memberService.inviteMember(eq(walletId), any(MemberRequest.class), any(UUID.class)))
        .thenReturn(mockResponse);

    mockMvc
        .perform(
            post("/api/invitations/{walletID}", walletId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("testuser"));
  }

  @Test
  void inviteMember_WithInvalidPayload_ShouldReturn400() throws Exception {
    UUID walletId = UUID.randomUUID();
    MemberRequest request = MemberRequest.builder().build(); // Missing user

    mockMvc
        .perform(
            post("/api/invitations/{walletID}", walletId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.title").value("Validation Error"))
        .andExpect(jsonPath("$.detail").value("Invalid input data"));
  }

  @Test
  void updateMemberRole_ShouldReturn200() throws Exception {
    UUID walletId = UUID.randomUUID();
    UUID memberId = UUID.randomUUID();
    MemberRequest request = MemberRequest.builder().user("testuser").build();
    MemberResponse mockResponse = MemberResponse.builder().username("testuser").build();

    when(memberService.updateMemberRole(
            eq(walletId), eq(memberId), any(MemberRequest.class), any(UUID.class)))
        .thenReturn(mockResponse);

    mockMvc
        .perform(
            put("/api/invitations/{walletID}/{memberID}", walletId, memberId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("testuser"));
  }

  @Test
  void removeMember_ShouldReturn204() throws Exception {
    UUID walletId = UUID.randomUUID();
    UUID memberId = UUID.randomUUID();

    mockMvc
        .perform(delete("/api/invitations/{walletID}/{memberID}", walletId, memberId))
        .andExpect(status().isNoContent());

    verify(memberService).removeMember(eq(walletId), eq(memberId), any(UUID.class));
  }

  @Test
  void getInvites_ShouldReturn200() throws Exception {
    WalletInviteResponse mockResponse =
        WalletInviteResponse.builder()
            .wallet(
                dev.busato.FinanceWebApp.backend
                    .dto
                    .WalletResponse
                    .builder()
                    .name("Shared Wallet")
                    .build())
            .build();

    when(memberService.getInvites(any(User.class))).thenReturn(List.of(mockResponse));

    mockMvc
        .perform(get("/api/invitations"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].wallet.name").value("Shared Wallet"));
  }

  @Test
  void acceptInvite_ShouldReturn204() throws Exception {
    UUID walletId = UUID.randomUUID();

    mockMvc
        .perform(post("/api/invitations/{walletID}/accept", walletId))
        .andExpect(status().isNoContent());

    verify(memberService)
        .setStatus(any(UUID.class), eq(walletId), eq(WalletAccess.InvitationStatus.ACCEPTED));
  }

  @Test
  void rejectInvite_ShouldReturn204() throws Exception {
    UUID walletId = UUID.randomUUID();

    mockMvc
        .perform(post("/api/invitations/{walletID}/reject", walletId))
        .andExpect(status().isNoContent());

    verify(memberService)
        .setStatus(any(UUID.class), eq(walletId), eq(WalletAccess.InvitationStatus.REJECTED));
  }
}
