package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.TransactionRequest;
import dev.busato.FinanceWebApp.backend.dto.TransactionResponse;
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

    @GetMapping("/{walletID}")
    public ResponseEntity<List<TransactionResponse>> getTransactions(@PathVariable UUID walletID, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(transactionService.getTransactionsByWalletID(walletID, user.getId()));
    }

    @PostMapping("/{walletID}")
    public ResponseEntity<TransactionResponse> createTransaction(@RequestBody TransactionRequest request,
                                                                @PathVariable UUID walletID,
                                                                @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(transactionService.createTransaction(request, walletID, user.getId()));
    }

    @PutMapping("/{walletID}/{transactionID}")
    public ResponseEntity<TransactionResponse> updateTransaction(
            @PathVariable UUID walletID,
            @PathVariable UUID transactionID,
            @RequestBody TransactionRequest request,
            @AuthenticationPrincipal User user) {

        return ResponseEntity.ok(transactionService.updateTransaction(transactionID, request, walletID, user.getId()));
    }

    @DeleteMapping("/{walletID}/{transactionID}")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable UUID walletID,
            @PathVariable UUID transactionID,
            @AuthenticationPrincipal User user) {

        transactionService.deleteTransaction(transactionID, walletID, user.getId());
        return ResponseEntity.noContent().build();
    }
}
