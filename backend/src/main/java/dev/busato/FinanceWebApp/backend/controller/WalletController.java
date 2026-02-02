package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.WalletRequest;
import dev.busato.FinanceWebApp.backend.dto.WalletResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final UUID TMP_userId = UUID.fromString("61a3c590-368d-4442-953e-2d37f60a29ba");

    @GetMapping
    public ResponseEntity<List<WalletResponse>> getMyWallets(@AuthenticationPrincipal User user) {
//        return ResponseEntity.ok(walletService.getMyWallets(user.getId()));
        return ResponseEntity.ok(walletService.getWallets(TMP_userId));
    }

    @GetMapping("/{walletID}")
    public ResponseEntity<WalletResponse> getWalletById(@PathVariable UUID walletID) {
        return ResponseEntity.ok(walletService.getWallet(TMP_userId, walletID));
    }

    @PostMapping
    public ResponseEntity<WalletResponse> createWallet(
            @RequestBody WalletRequest request,
            @AuthenticationPrincipal User user
    ) {
        // Spring inietta automaticamente l'oggetto User dell'utente loggato
//        return ResponseEntity.ok(walletService.createWallet(request, user.getId()));
        return ResponseEntity.ok(walletService.createWallet(request, TMP_userId));
    }

}
