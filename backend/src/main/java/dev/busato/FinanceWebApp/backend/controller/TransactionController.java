package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.TransactionRequest;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {
    private final TransactionService transactionService;
    private final UUID TMP_userId = UUID.fromString("61a3c590-368d-4442-953e-2d37f60a29ba");

    @GetMapping("/{walletID}")
    public ResponseEntity<List<TransactionRequest>> getTransactions(@PathVariable UUID walletID) {
        return ResponseEntity.ok(transactionService.getTransactionsByWalletID(walletID));
    }

    @PostMapping("/{walletID}")
    public ResponseEntity<TransactionRequest> createTransaction(@RequestBody TransactionRequest request,
                                                                @PathVariable UUID walletID,
                                                                @AuthenticationPrincipal User user) {
//        return ResponseEntity.ok(transactionService.createTransaction(walletID, user.getId()));
        return ResponseEntity.ok(transactionService.createTransaction(request, walletID, TMP_userId));
    }
}
