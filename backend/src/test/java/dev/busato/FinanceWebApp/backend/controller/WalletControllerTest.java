package dev.busato.FinanceWebApp.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import dev.busato.FinanceWebApp.backend.dto.WalletRequest;
import dev.busato.FinanceWebApp.backend.dto.WalletResponse;
import dev.busato.FinanceWebApp.backend.service.WalletService;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;

@WebMvcTest(
    controllers = WalletController.class,
    excludeAutoConfiguration = {
      org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class
    })
class WalletControllerTest extends BaseWebMvcTest {

  @org.springframework.test.context.bean.override.mockito.MockitoBean
  private WalletService walletService;

  @Test
  void getMyWallets_ShouldReturn200() throws Exception {
    WalletResponse mockResponse = WalletResponse.builder().name("Main Wallet").build();

    when(walletService.getWallets(any(UUID.class))).thenReturn(List.of(mockResponse));

    mockMvc
        .perform(get("/api/wallets"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].name").value("Main Wallet"));
  }

  @Test
  void getWalletById_ShouldReturn200() throws Exception {
    UUID walletId = UUID.randomUUID();
    WalletResponse mockResponse = WalletResponse.builder().name("Main Wallet").build();

    when(walletService.getWallet(any(UUID.class), eq(walletId))).thenReturn(mockResponse);

    mockMvc
        .perform(get("/api/wallets/{walletID}", walletId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Main Wallet"));
  }

  @Test
  void createWallet_ShouldReturn200() throws Exception {
    WalletRequest request = WalletRequest.builder().name("New Wallet").currency("USD").build();
    WalletResponse mockResponse = WalletResponse.builder().name("New Wallet").build();

    when(walletService.createWallet(any(WalletRequest.class), any(UUID.class)))
        .thenReturn(mockResponse);

    mockMvc
        .perform(
            post("/api/wallets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("New Wallet"));
  }

  @Test
  void createWallet_WithInvalidPayload_ShouldReturn400() throws Exception {
    WalletRequest request = WalletRequest.builder().build(); // Missing name

    mockMvc
        .perform(
            post("/api/wallets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.title").value("Validation Error"))
        .andExpect(jsonPath("$.detail").value("Invalid input data"));
  }

  @Test
  void updateWallet_ShouldReturn200() throws Exception {
    UUID walletId = UUID.randomUUID();
    WalletRequest request = WalletRequest.builder().name("Updated Wallet").build();
    WalletResponse mockResponse = WalletResponse.builder().name("Updated Wallet").build();

    when(walletService.updateWallet(eq(walletId), any(WalletRequest.class), any(UUID.class)))
        .thenReturn(mockResponse);

    mockMvc
        .perform(
            put("/api/wallets/{walletID}", walletId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Updated Wallet"));
  }

  @Test
  void deleteWalletById_ShouldReturn204() throws Exception {
    UUID walletId = UUID.randomUUID();

    mockMvc.perform(delete("/api/wallets/{walletID}", walletId)).andExpect(status().isNoContent());

    verify(walletService).removeWallet(eq(walletId), any(UUID.class));
  }
}
