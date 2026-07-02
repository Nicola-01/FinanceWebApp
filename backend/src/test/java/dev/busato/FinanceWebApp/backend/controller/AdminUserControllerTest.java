package dev.busato.FinanceWebApp.backend.controller;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import dev.busato.FinanceWebApp.backend.dto.AdminInviteRequest;
import dev.busato.FinanceWebApp.backend.dto.AdminInviteResponse;
import dev.busato.FinanceWebApp.backend.dto.UserResponse;
import dev.busato.FinanceWebApp.backend.service.AdminUserInviteService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;

@WebMvcTest(
    controllers = AdminUserController.class,
    excludeAutoConfiguration = {
      org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class
    })
class AdminUserControllerTest extends BaseWebMvcTest {

  @org.springframework.test.context.bean.override.mockito.MockitoBean
  private AdminUserInviteService manageUserService;

  @Test
  void getUsers_ShouldReturn200() throws Exception {
    UserResponse response =
        UserResponse.builder()
            .id(UUID.randomUUID())
            .name("John Doe")
            .createdAt(LocalDate.now())
            .wallets(2)
            .transactions(10)
            .build();

    when(manageUserService.getUsersWithStats()).thenReturn(List.of(response));

    mockMvc
        .perform(get("/api/admin/management/users"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].name").value("John Doe"))
        .andExpect(jsonPath("$[0].wallets").value(2))
        .andExpect(jsonPath("$[0].transactions").value(10));
  }

  @Test
  void deleteUser_ShouldReturn204() throws Exception {
    UUID userId = UUID.randomUUID();

    mockMvc.perform(delete("/api/admin/management/{id}", userId)).andExpect(status().isNoContent());

    verify(manageUserService).deleteUser(eq(userId));
  }

  @Test
  void getInvites_ShouldReturn200() throws Exception {
    AdminInviteResponse response =
        AdminInviteResponse.builder()
            .email("invitee@example.com")
            .note("Welcome")
            .url("https://example.com/invite/abc")
            .createdAt(LocalDateTime.now())
            .expiresAt(LocalDateTime.now().plusDays(3))
            .status("PENDING")
            .build();

    when(manageUserService.getInvites()).thenReturn(List.of(response));

    mockMvc
        .perform(get("/api/admin/management/invites"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].email").value("invitee@example.com"))
        .andExpect(jsonPath("$[0].status").value("PENDING"));
  }

  @Test
  void createInvite_ShouldReturn200() throws Exception {
    AdminInviteRequest request = new AdminInviteRequest();
    request.setEmail("newuser@example.com");
    request.setNote("Please join");

    AdminInviteResponse response =
        AdminInviteResponse.builder()
            .email("newuser@example.com")
            .note("Please join")
            .url("https://example.com/invite/xyz")
            .createdAt(LocalDateTime.now())
            .expiresAt(LocalDateTime.now().plusDays(3))
            .status("PENDING")
            .build();

    when(manageUserService.createInvite(org.mockito.ArgumentMatchers.any(AdminInviteRequest.class)))
        .thenReturn(response);

    mockMvc
        .perform(
            post("/api/admin/management")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("newuser@example.com"))
        .andExpect(jsonPath("$.status").value("PENDING"));
  }

  @Test
  void revokeInvite_ShouldReturn204() throws Exception {
    String email = "revoke@example.com";

    mockMvc
        .perform(delete("/api/admin/management/invite/{email}", email))
        .andExpect(status().isNoContent());

    verify(manageUserService).revokeInvite(eq(email));
  }
}
