package dev.busato.FinanceWebApp.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import dev.busato.FinanceWebApp.backend.dto.WalletFullRequest;
import dev.busato.FinanceWebApp.backend.dto.WalletFullResponse;
import dev.busato.FinanceWebApp.backend.dto.WalletRequest;
import dev.busato.FinanceWebApp.backend.dto.WalletResponse;
import dev.busato.FinanceWebApp.backend.service.WalletProvisioningService;
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

  @org.springframework.test.context.bean.override.mockito.MockitoBean
  private WalletProvisioningService walletProvisioningService;

  @org.springframework.test.context.bean.override.mockito.MockitoBean
  private dev.busato.FinanceWebApp.backend.service.WalletDashboardService walletDashboardService;

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
  void createWalletFull_ShouldReturn200() throws Exception {
    WalletFullRequest request =
        WalletFullRequest.builder()
            .wallet(WalletRequest.builder().name("New Wallet").currency("USD").build())
            .build();
    WalletFullResponse mockResponse =
        WalletFullResponse.builder()
            .wallet(WalletResponse.builder().name("New Wallet").build())
            .build();

    when(walletProvisioningService.createWalletFull(any(WalletFullRequest.class), any(UUID.class)))
        .thenReturn(mockResponse);

    mockMvc
        .perform(
            post("/api/wallets/full")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.wallet.name").value("New Wallet"));
  }

  @Test
  void createWalletFull_MissingWallet_ShouldReturn400() throws Exception {
    // The nested wallet payload is mandatory; staged lists alone are not a valid draft.
    WalletFullRequest request = WalletFullRequest.builder().build();

    mockMvc
        .perform(
            post("/api/wallets/full")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.title").value("Validation Error"));
  }

  @Test
  void createWalletFull_InvalidNestedWallet_ShouldReturn400() throws Exception {
    // @Valid must cascade into the nested wallet: a blank name is rejected before the service.
    WalletFullRequest request =
        WalletFullRequest.builder().wallet(WalletRequest.builder().build()).build();

    mockMvc
        .perform(
            post("/api/wallets/full")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.title").value("Validation Error"));
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

  @Test
  void getWalletDashboard_ShouldReturn200() throws Exception {
    UUID walletId = UUID.randomUUID();
    dev.busato.FinanceWebApp.backend.dto.WalletDashboardResponse mockResponse =
        dev.busato.FinanceWebApp.backend
            .dto
            .WalletDashboardResponse
            .builder()
            .wallet(WalletResponse.builder().name("Main Wallet").build())
            .transactions(List.of())
            .subscriptions(List.of())
            .tags(List.of())
            .build();

    when(walletDashboardService.getDashboard(eq(walletId), any(UUID.class)))
        .thenReturn(mockResponse);

    mockMvc
        .perform(get("/api/wallets/{walletID}/dashboard", walletId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.wallet.name").value("Main Wallet"))
        .andExpect(jsonPath("$.transactions").isArray())
        .andExpect(jsonPath("$.subscriptions").isArray())
        .andExpect(jsonPath("$.tags").isArray());
  }
}
