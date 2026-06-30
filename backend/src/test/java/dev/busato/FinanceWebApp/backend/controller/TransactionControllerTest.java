package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.TransactionRequest;
import dev.busato.FinanceWebApp.backend.dto.TransactionResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionControllerTest {

    @Mock
    private TransactionService transactionService;

    @InjectMocks
    private TransactionController transactionController;

    private User user;
    private UUID walletId;
    private UUID transactionId;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(UUID.randomUUID());
        walletId = UUID.randomUUID();
        transactionId = UUID.randomUUID();
    }

    @Test
    void getTransactionsByWallet_ReturnsOk() {
        List<TransactionResponse> responses = List.of(TransactionResponse.builder().build());
        when(transactionService.getTransactionsByWalletID(walletId, user.getId())).thenReturn(responses);

        ResponseEntity<List<TransactionResponse>> response = transactionController.getTransactions(walletId, user);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(responses, response.getBody());
    }

    @Test
    void createTransaction_ReturnsOk() {
        TransactionRequest request = TransactionRequest.builder().build();
        TransactionResponse mockResponse = TransactionResponse.builder().build();
        when(transactionService.createTransaction(request, walletId, user.getId())).thenReturn(mockResponse);

        ResponseEntity<TransactionResponse> response = transactionController.createTransaction(request, walletId, user);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockResponse, response.getBody());
    }

    @Test
    void updateTransaction_ReturnsOk() {
        TransactionRequest request = TransactionRequest.builder().build();
        TransactionResponse mockResponse = TransactionResponse.builder().build();
        when(transactionService.updateTransaction(transactionId, request, walletId, user.getId())).thenReturn(mockResponse);

        ResponseEntity<TransactionResponse> response = transactionController.updateTransaction(walletId, transactionId, request, user);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockResponse, response.getBody());
    }

    @Test
    void deleteTransaction_ReturnsNoContent() {
        ResponseEntity<Void> response = transactionController.deleteTransaction(walletId, transactionId, user);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(transactionService).deleteTransaction(transactionId, walletId, user.getId());
    }
}
