package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.SubscriptionBulkResponse;
import dev.busato.FinanceWebApp.backend.dto.SubscriptionRequest;
import dev.busato.FinanceWebApp.backend.dto.SubscriptionResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.SubscriptionService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/subscription")
@RequiredArgsConstructor
public class SubscriptionController {

  private final SubscriptionService subscriptionService;

  @GetMapping("/{walletID}")
  public ResponseEntity<List<SubscriptionResponse>> getSubscriptionByWallet(
      @PathVariable UUID walletID, @AuthenticationPrincipal User user) {
    return ResponseEntity.ok(
        subscriptionService.getSubscriptionsByWalletID(walletID, user.getId()));
  }

  @PostMapping("/{walletID}")
  public ResponseEntity<SubscriptionResponse> createSubscription(
      @RequestBody SubscriptionRequest request,
      @PathVariable UUID walletID,
      @AuthenticationPrincipal User user) {
    return ResponseEntity.ok(
        subscriptionService.createSubscription(request, walletID, user.getId()));
  }

  @PostMapping("/{walletID}/bulk")
  public ResponseEntity<SubscriptionBulkResponse> createSubscriptionsBulk(
      @RequestBody List<SubscriptionRequest> requests,
      @PathVariable UUID walletID,
      @AuthenticationPrincipal User user) {
    return ResponseEntity.ok(
        subscriptionService.createSubscriptionsBulk(requests, walletID, user.getId()));
  }

  @PutMapping("/{walletID}/{subscriptionID}")
  public ResponseEntity<SubscriptionResponse> updateSubscription(
      @PathVariable UUID walletID,
      @PathVariable UUID subscriptionID,
      @RequestBody SubscriptionRequest request,
      @AuthenticationPrincipal User user) {

    return ResponseEntity.ok(
        subscriptionService.updateSubscription(subscriptionID, request, walletID, user.getId()));
  }

  @DeleteMapping("/{walletID}/{subscriptionID}")
  public ResponseEntity<Void> deleteSubscription(
      @PathVariable UUID walletID,
      @PathVariable UUID subscriptionID,
      @AuthenticationPrincipal User user) {

    subscriptionService.deleteSubscription(subscriptionID, walletID, user.getId());
    return ResponseEntity.noContent().build();
  }
}
