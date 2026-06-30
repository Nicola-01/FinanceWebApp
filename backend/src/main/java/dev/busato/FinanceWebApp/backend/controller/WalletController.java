package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.WalletRequest;
import dev.busato.FinanceWebApp.backend.dto.WalletResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    public ResponseEntity<List<WalletResponse>> getMyWallets(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(walletService.getWallets(user.getId()));
    }

    @GetMapping("/{walletID}")
    public ResponseEntity<WalletResponse> getWalletById(@PathVariable UUID walletID, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(walletService.getWallet(user.getId(), walletID));
    }

    @PostMapping
    public ResponseEntity<WalletResponse> createWallet(
            @Valid @RequestBody WalletRequest request,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(walletService.createWallet(request, user.getId()));
    }

    @DeleteMapping("/{walletID}")
    public ResponseEntity<Void> deleteWalletById(@AuthenticationPrincipal User user, @PathVariable UUID walletID) {
        walletService.removeWallet(walletID, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{walletID}")
    public ResponseEntity<WalletResponse> updateWallet(@PathVariable UUID walletID, @Valid @RequestBody WalletRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(walletService.updateWallet(walletID, request, user.getId()));
    }
}
