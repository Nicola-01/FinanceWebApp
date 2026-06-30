package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.SubscriptionRequest;
import dev.busato.FinanceWebApp.backend.dto.SubscriptionResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.SubscriptionService;
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
class SubscriptionControllerTest {

    @Mock
    private SubscriptionService subscriptionService;

    @InjectMocks
    private SubscriptionController subscriptionController;

    private User user;
    private UUID userId;
    private UUID walletId;
    private UUID subscriptionId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        walletId = UUID.randomUUID();
        subscriptionId = UUID.randomUUID();

        user = new User();
        user.setId(userId);
    }

    @Test
    void getSubscriptionByWallet_ReturnsOk() {
        List<SubscriptionResponse> responses = List.of(SubscriptionResponse.builder().build());
        when(subscriptionService.getSubscriptionsByWalletID(walletId, userId)).thenReturn(responses);

        ResponseEntity<List<SubscriptionResponse>> response = subscriptionController.getSubscriptionByWallet(walletId, user);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(responses, response.getBody());
    }

    @Test
    void createSubscription_ReturnsOk() {
        SubscriptionRequest request = SubscriptionRequest.builder().build();
        SubscriptionResponse mockResponse = SubscriptionResponse.builder().build();
        when(subscriptionService.createSubscription(request, walletId, userId)).thenReturn(mockResponse);

        ResponseEntity<SubscriptionResponse> response = subscriptionController.createSubscription(request, walletId, user);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockResponse, response.getBody());
    }

    @Test
    void updateSubscription_ReturnsOk() {
        SubscriptionRequest request = SubscriptionRequest.builder().build();
        SubscriptionResponse mockResponse = SubscriptionResponse.builder().build();
        when(subscriptionService.updateSubscription(subscriptionId, request, walletId, userId)).thenReturn(mockResponse);

        ResponseEntity<SubscriptionResponse> response = subscriptionController.updateSubscription(walletId, subscriptionId, request, user);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockResponse, response.getBody());
    }

    @Test
    void deleteSubscription_ReturnsNoContent() {
        ResponseEntity<Void> response = subscriptionController.deleteSubscription(walletId, subscriptionId, user);

        assertEquals(HttpStatus.NO_CONTENT, response.getStatusCode());
        verify(subscriptionService).deleteSubscription(subscriptionId, walletId, userId);
    }
}
