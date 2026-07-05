package dev.busato.FinanceWebApp.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import dev.busato.FinanceWebApp.backend.dto.PatBulkDeleteRequest;
import dev.busato.FinanceWebApp.backend.dto.PatBulkPauseRequest;
import dev.busato.FinanceWebApp.backend.dto.PatCreateRequest;
import dev.busato.FinanceWebApp.backend.dto.PatCreateResponse;
import dev.busato.FinanceWebApp.backend.dto.PatResponse;
import dev.busato.FinanceWebApp.backend.dto.PatUpdateRequest;
import dev.busato.FinanceWebApp.backend.dto.WalletPermission;
import dev.busato.FinanceWebApp.backend.service.PatService;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;

@WebMvcTest(
    controllers = PatController.class,
    excludeAutoConfiguration = {
      org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class
    })
class PatControllerTest extends BaseWebMvcTest {

  @org.springframework.test.context.bean.override.mockito.MockitoBean private PatService patService;

  @Test
  void createToken_ShouldReturn200() throws Exception {
    PatCreateRequest request = new PatCreateRequest();
    request.setName("My Token");
    request.setWalletPermissions(List.of(new WalletPermission(UUID.randomUUID(), List.of("READ"))));

    PatCreateResponse mockResponse =
        PatCreateResponse.builder()
            .id(UUID.randomUUID())
            .name("My Token")
            .plainToken("fin_pat_abcdef1234567890")
            .tokenPrefix("fin_pat_abcd")
            .build();

    when(patService.createToken(eq(mockUser.getId()), any(PatCreateRequest.class)))
        .thenReturn(mockResponse);

    mockMvc
        .perform(
            post("/api/tokens")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("My Token"))
        .andExpect(jsonPath("$.plainToken").value("fin_pat_abcdef1234567890"))
        .andExpect(jsonPath("$.tokenPrefix").value("fin_pat_abcd"));

    verify(patService).createToken(eq(mockUser.getId()), any(PatCreateRequest.class));
  }

  @Test
  void listTokens_ShouldReturn200() throws Exception {
    PatResponse mockResponse =
        PatResponse.builder()
            .id(UUID.randomUUID())
            .name("My Token")
            .tokenPrefix("fin_pat_abcd")
            .build();

    when(patService.listTokens(mockUser.getId())).thenReturn(List.of(mockResponse));

    mockMvc
        .perform(get("/api/tokens"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].name").value("My Token"))
        .andExpect(jsonPath("$[0].tokenPrefix").value("fin_pat_abcd"));

    verify(patService).listTokens(mockUser.getId());
  }

  @Test
  void revokeToken_ShouldReturn204() throws Exception {
    UUID tokenId = UUID.randomUUID();

    mockMvc.perform(delete("/api/tokens/{tokenId}", tokenId)).andExpect(status().isNoContent());

    verify(patService).revokeToken(eq(tokenId), eq(mockUser.getId()));
  }

  @Test
  void updateToken_ShouldReturn200() throws Exception {
    UUID tokenId = UUID.randomUUID();
    PatUpdateRequest request = new PatUpdateRequest();
    request.setWalletPermissions(
        List.of(new WalletPermission(UUID.randomUUID(), List.of("READ", "WRITE"))));

    PatResponse mockResponse =
        PatResponse.builder().id(tokenId).name("Updated Token").tokenPrefix("fin_pat_wxyz").build();

    when(patService.updateToken(eq(tokenId), eq(mockUser.getId()), any(PatUpdateRequest.class)))
        .thenReturn(mockResponse);

    mockMvc
        .perform(
            put("/api/tokens/{tokenId}", tokenId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Updated Token"))
        .andExpect(jsonPath("$.tokenPrefix").value("fin_pat_wxyz"));

    verify(patService).updateToken(eq(tokenId), eq(mockUser.getId()), any(PatUpdateRequest.class));
  }

  @Test
  void pauseToken_ShouldReturn200WithPausedTrue() throws Exception {
    UUID tokenId = UUID.randomUUID();
    PatResponse mockResponse =
        PatResponse.builder().id(tokenId).name("My Token").paused(true).build();

    when(patService.setPaused(eq(tokenId), eq(mockUser.getId()), eq(true)))
        .thenReturn(mockResponse);

    mockMvc
        .perform(post("/api/tokens/{tokenId}/pause", tokenId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.paused").value(true));

    verify(patService).setPaused(eq(tokenId), eq(mockUser.getId()), eq(true));
  }

  @Test
  void resumeToken_ShouldReturn200WithPausedFalse() throws Exception {
    UUID tokenId = UUID.randomUUID();
    PatResponse mockResponse =
        PatResponse.builder().id(tokenId).name("My Token").paused(false).build();

    when(patService.setPaused(eq(tokenId), eq(mockUser.getId()), eq(false)))
        .thenReturn(mockResponse);

    mockMvc
        .perform(post("/api/tokens/{tokenId}/resume", tokenId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.paused").value(false));

    verify(patService).setPaused(eq(tokenId), eq(mockUser.getId()), eq(false));
  }

  @Test
  void bulkDeleteTokens_ShouldReturn204() throws Exception {
    PatBulkDeleteRequest request = new PatBulkDeleteRequest();
    List<UUID> ids = List.of(UUID.randomUUID(), UUID.randomUUID());
    request.setIds(ids);

    mockMvc
        .perform(
            post("/api/tokens/bulk-delete")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isNoContent());

    verify(patService).bulkDeleteTokens(eq(ids), eq(mockUser.getId()));
  }

  @Test
  void bulkDeleteTokens_EmptyIds_ShouldReturn400() throws Exception {
    PatBulkDeleteRequest request = new PatBulkDeleteRequest();
    request.setIds(List.of());

    mockMvc
        .perform(
            post("/api/tokens/bulk-delete")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void bulkPauseTokens_Pause_ShouldReturn200WithUpdatedResponses() throws Exception {
    UUID id1 = UUID.randomUUID();
    UUID id2 = UUID.randomUUID();
    PatBulkPauseRequest request = new PatBulkPauseRequest();
    List<UUID> ids = List.of(id1, id2);
    request.setIds(ids);
    request.setPaused(true);

    List<PatResponse> mockResponse =
        List.of(
            PatResponse.builder().id(id1).name("Token A").paused(true).build(),
            PatResponse.builder().id(id2).name("Token B").paused(true).build());

    when(patService.bulkSetPaused(eq(ids), eq(mockUser.getId()), eq(true)))
        .thenReturn(mockResponse);

    mockMvc
        .perform(
            post("/api/tokens/bulk-pause")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].paused").value(true))
        .andExpect(jsonPath("$[1].paused").value(true));

    verify(patService).bulkSetPaused(eq(ids), eq(mockUser.getId()), eq(true));
  }

  @Test
  void bulkPauseTokens_Resume_ShouldReturn200WithUpdatedResponses() throws Exception {
    UUID id1 = UUID.randomUUID();
    PatBulkPauseRequest request = new PatBulkPauseRequest();
    List<UUID> ids = List.of(id1);
    request.setIds(ids);
    request.setPaused(false);

    List<PatResponse> mockResponse =
        List.of(PatResponse.builder().id(id1).name("Token A").paused(false).build());

    when(patService.bulkSetPaused(eq(ids), eq(mockUser.getId()), eq(false)))
        .thenReturn(mockResponse);

    mockMvc
        .perform(
            post("/api/tokens/bulk-pause")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].paused").value(false));

    verify(patService).bulkSetPaused(eq(ids), eq(mockUser.getId()), eq(false));
  }

  @Test
  void bulkPauseTokens_EmptyIds_ShouldReturn400() throws Exception {
    PatBulkPauseRequest request = new PatBulkPauseRequest();
    request.setIds(List.of());
    request.setPaused(true);

    mockMvc
        .perform(
            post("/api/tokens/bulk-pause")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest());
  }

  @Test
  void bulkPauseTokens_MissingPaused_ShouldReturn400() throws Exception {
    PatBulkPauseRequest request = new PatBulkPauseRequest();
    request.setIds(List.of(UUID.randomUUID()));
    // paused left null

    mockMvc
        .perform(
            post("/api/tokens/bulk-pause")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest());
  }
}
