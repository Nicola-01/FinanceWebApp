package dev.busato.FinanceWebApp.backend.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import dev.busato.FinanceWebApp.backend.dto.TransactionRequest;
import dev.busato.FinanceWebApp.backend.dto.TransactionResponse;
import dev.busato.FinanceWebApp.backend.service.TransactionService;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;

@WebMvcTest(
    controllers = TransactionController.class,
    excludeAutoConfiguration = {
      org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration.class
    })
class TransactionControllerTest extends BaseWebMvcTest {

  @org.springframework.test.context.bean.override.mockito.MockitoBean
  private TransactionService transactionService;

  @Test
  void getTransactions_ShouldReturn200() throws Exception {
    UUID walletId = UUID.randomUUID();
    TransactionResponse mockResponse = TransactionResponse.builder().name("Lunch").build();

    when(transactionService.getTransactionsByWalletID(eq(walletId), any(UUID.class)))
        .thenReturn(List.of(mockResponse));

    mockMvc
        .perform(get("/api/transactions/{walletID}", walletId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].name").value("Lunch"));
  }

  @Test
  void createTransaction_ShouldReturn200() throws Exception {
    UUID walletId = UUID.randomUUID();
    TransactionRequest request = TransactionRequest.builder().name("Lunch").build();
    TransactionResponse mockResponse = TransactionResponse.builder().name("Lunch").build();

    when(transactionService.createTransaction(
            any(TransactionRequest.class), eq(walletId), any(UUID.class)))
        .thenReturn(mockResponse);

    mockMvc
        .perform(
            post("/api/transactions/{walletID}", walletId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Lunch"));
  }

  @Test
  void createTransaction_WithInvalidPayload_ShouldReturn400() throws Exception {
    UUID walletId = UUID.randomUUID();
    TransactionRequest request = TransactionRequest.builder().build(); // Missing name

    mockMvc
        .perform(
            post("/api/transactions/{walletID}", walletId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.title").value("Validation Error"))
        .andExpect(jsonPath("$.detail").value("Invalid input data"));
  }

  @Test
  void updateTransaction_ShouldReturn200() throws Exception {
    UUID walletId = UUID.randomUUID();
    UUID transactionId = UUID.randomUUID();
    TransactionRequest request = TransactionRequest.builder().name("Dinner").build();
    TransactionResponse mockResponse = TransactionResponse.builder().name("Dinner").build();

    when(transactionService.updateTransaction(
            eq(transactionId), any(TransactionRequest.class), eq(walletId), any(UUID.class)))
        .thenReturn(mockResponse);

    mockMvc
        .perform(
            put("/api/transactions/{walletID}/{transactionID}", walletId, transactionId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Dinner"));
  }

  @Test
  void deleteTransaction_ShouldReturn204() throws Exception {
    UUID walletId = UUID.randomUUID();
    UUID transactionId = UUID.randomUUID();

    mockMvc
        .perform(delete("/api/transactions/{walletID}/{transactionID}", walletId, transactionId))
        .andExpect(status().isNoContent());

    verify(transactionService).deleteTransaction(eq(transactionId), eq(walletId), any(UUID.class));
  }
}
