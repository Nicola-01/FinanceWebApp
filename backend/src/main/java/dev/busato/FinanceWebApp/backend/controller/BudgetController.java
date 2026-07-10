package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.BudgetRequest;
import dev.busato.FinanceWebApp.backend.dto.BudgetStatusResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.BudgetService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

  private final BudgetService budgetService;

  @GetMapping("/{walletId}")
  public ResponseEntity<List<BudgetStatusResponse>> getBudgets(
      @PathVariable UUID walletId, @AuthenticationPrincipal User user) {
    return ResponseEntity.ok(budgetService.getBudgets(walletId, user.getId()));
  }

  @PostMapping("/{walletId}")
  public ResponseEntity<BudgetStatusResponse> createBudget(
      @PathVariable UUID walletId,
      @AuthenticationPrincipal User user,
      @Valid @RequestBody BudgetRequest budgetRequest) {
    return ResponseEntity.ok(budgetService.createBudget(budgetRequest, walletId, user.getId()));
  }

  @PutMapping("/{walletId}/{budgetId}")
  public ResponseEntity<BudgetStatusResponse> updateBudget(
      @PathVariable UUID walletId,
      @PathVariable UUID budgetId,
      @AuthenticationPrincipal User user,
      @Valid @RequestBody BudgetRequest budgetRequest) {
    return ResponseEntity.ok(
        budgetService.updateBudget(budgetId, budgetRequest, walletId, user.getId()));
  }

  @DeleteMapping("/{walletId}/{budgetId}")
  public ResponseEntity<Void> deleteBudget(
      @PathVariable UUID walletId,
      @PathVariable UUID budgetId,
      @AuthenticationPrincipal User user) {
    budgetService.deleteBudget(budgetId, walletId, user.getId());
    return ResponseEntity.noContent().build();
  }
}
