package dev.busato.FinanceWebApp.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import dev.busato.FinanceWebApp.backend.dto.SubscriptionBulkResponse;
import dev.busato.FinanceWebApp.backend.dto.SubscriptionRequest;
import dev.busato.FinanceWebApp.backend.dto.SubscriptionResponse;
import dev.busato.FinanceWebApp.backend.service.SubscriptionService;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@WebMvcTest(
    controllers = SubscriptionController.class,
    excludeAutoConfiguration = {
      SecurityAutoConfiguration.class,
      SecurityFilterAutoConfiguration.class
    })
public class SubscriptionControllerTest extends BaseWebMvcTest {

  @MockitoBean private SubscriptionService subscriptionService;

  @Test
  void getSubscriptionByWallet_ShouldReturn200() throws Exception {
    UUID walletId = UUID.randomUUID();
    List<SubscriptionResponse> mockResponse = List.of();

    when(subscriptionService.getSubscriptionsByWalletID(eq(walletId), any(UUID.class)))
        .thenReturn(mockResponse);

    mockMvc
        .perform(get("/api/subscription/{walletID}", walletId))
        .andDo(print())
        .andExpect(status().isOk())
        .andExpect(content().string("[]"));

    verify(subscriptionService).getSubscriptionsByWalletID(walletId, mockUser.getId());
  }

  @Test
  void createSubscription_ShouldReturn200() throws Exception {
    UUID walletId = UUID.randomUUID();
    SubscriptionRequest request =
        SubscriptionRequest.builder()
            .name("Netflix")
            .amount(new BigDecimal("15.99"))
            .type("EXPENSE")
            .build();

    SubscriptionResponse mockResponse = SubscriptionResponse.builder().name("Netflix").build();

    when(subscriptionService.createSubscription(
            any(SubscriptionRequest.class), eq(walletId), any(UUID.class)))
        .thenReturn(mockResponse);

    mockMvc
        .perform(
            post("/api/subscription/{walletID}", walletId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andDo(print())
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Netflix"));
  }

  @Test
  void createSubscriptionsBulk_ShouldReturn200() throws Exception {
    UUID walletId = UUID.randomUUID();
    SubscriptionRequest r1 =
        SubscriptionRequest.builder()
            .name("Netflix")
            .amount(new BigDecimal("15.99"))
            .type("EXPENSE")
            .build();
    SubscriptionRequest r2 =
        SubscriptionRequest.builder()
            .name("Spotify")
            .amount(new BigDecimal("9.99"))
            .type("EXPENSE")
            .build();

    when(subscriptionService.createSubscriptionsBulk(anyList(), eq(walletId), any(UUID.class)))
        .thenReturn(
            SubscriptionBulkResponse.builder()
                .created(List.of(SubscriptionResponse.builder().name("Netflix").build()))
                .updated(List.of(SubscriptionResponse.builder().name("Spotify").build()))
                .autoCreatedTags(List.of())
                .build());

    mockMvc
        .perform(
            post("/api/subscription/{walletID}/bulk", walletId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(List.of(r1, r2))))
        .andDo(print())
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.created[0].name").value("Netflix"))
        .andExpect(jsonPath("$.updated[0].name").value("Spotify"));

    verify(subscriptionService).createSubscriptionsBulk(anyList(), eq(walletId), any(UUID.class));
  }

  @Test
  void updateSubscription_ShouldReturn200() throws Exception {
    UUID walletId = UUID.randomUUID();
    UUID subId = UUID.randomUUID();
    SubscriptionRequest request =
        SubscriptionRequest.builder()
            .name("Spotify")
            .amount(new BigDecimal("9.99"))
            .type("EXPENSE")
            .build();

    SubscriptionResponse mockResponse = SubscriptionResponse.builder().name("Spotify").build();

    when(subscriptionService.updateSubscription(
            eq(subId), any(SubscriptionRequest.class), eq(walletId), any(UUID.class)))
        .thenReturn(mockResponse);

    mockMvc
        .perform(
            put("/api/subscription/{walletID}/{subscriptionID}", walletId, subId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andDo(print())
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Spotify"));
  }

  @Test
  void deleteSubscription_ShouldReturn204() throws Exception {
    UUID walletId = UUID.randomUUID();
    UUID subId = UUID.randomUUID();

    mockMvc
        .perform(delete("/api/subscription/{walletID}/{subscriptionID}", walletId, subId))
        .andDo(print())
        .andExpect(status().isNoContent());

    verify(subscriptionService)
        .deleteSubscription(eq(subId), eq(walletId), any(UUID.class), isNull());
  }

  @Test
  void deleteSubscription_WithBaseUpdatedAt_ForwardsItToService() throws Exception {
    UUID walletId = UUID.randomUUID();
    UUID subId = UUID.randomUUID();
    java.time.Instant baseUpdatedAt = java.time.Instant.parse("2026-07-08T10:00:00Z");

    mockMvc
        .perform(
            delete("/api/subscription/{walletID}/{subscriptionID}", walletId, subId)
                .param("baseUpdatedAt", baseUpdatedAt.toString()))
        .andDo(print())
        .andExpect(status().isNoContent());

    verify(subscriptionService)
        .deleteSubscription(eq(subId), eq(walletId), any(UUID.class), eq(baseUpdatedAt));
  }
}
