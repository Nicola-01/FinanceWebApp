package dev.busato.FinanceWebApp.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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
}
