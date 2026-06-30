package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.WalletRequest;
import dev.busato.FinanceWebApp.backend.dto.WalletResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.WalletService;
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
class WalletControllerTest {

    @Mock
    private WalletService walletService;

    @InjectMocks
    private WalletController walletController;

    private User user;
    private UUID walletId;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(UUID.randomUUID());
        walletId = UUID.randomUUID();
    }

    @Test
    void getWallets_ReturnsOk() {
        List<WalletResponse> responses = List.of(WalletResponse.builder().build());
        when(walletService.getWallets(user.getId())).thenReturn(responses);

        ResponseEntity<List<WalletResponse>> response = walletController.getMyWallets(user);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(responses, response.getBody());
    }

    @Test
    void createWallet_ReturnsOk() {
        WalletRequest request = new WalletRequest();
        WalletResponse mockResponse = WalletResponse.builder().build();
        when(walletService.createWallet(request, user.getId())).thenReturn(mockResponse);

        ResponseEntity<WalletResponse> response = walletController.createWallet(request, user);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockResponse, response.getBody());
    }

    @Test
    void getWallet_ReturnsOk() {
        WalletResponse mockResponse = WalletResponse.builder().build();
        when(walletService.getWallet(user.getId(), walletId)).thenReturn(mockResponse);

        ResponseEntity<WalletResponse> response = walletController.getWalletById(walletId, user);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockResponse, response.getBody());
    }

    @Test
    void updateWallet_ReturnsOk() {
        WalletRequest request = new WalletRequest();
        WalletResponse mockResponse = WalletResponse.builder().build();
        when(walletService.updateWallet(walletId, request, user.getId())).thenReturn(mockResponse);

        ResponseEntity<WalletResponse> response = walletController.updateWallet(walletId, request, user);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockResponse, response.getBody());
    }

    @Test
    void removeWallet_ReturnsNoContent() {
        ResponseEntity<Void> response = walletController.deleteWalletById(user, walletId);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(walletService).removeWallet(walletId, user.getId());
    }
}
