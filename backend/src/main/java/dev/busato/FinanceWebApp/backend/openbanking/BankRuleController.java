package dev.busato.FinanceWebApp.backend.openbanking;

import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.openbanking.BankDtos.BankRuleRequest;
import dev.busato.FinanceWebApp.backend.openbanking.BankDtos.BankRuleResponse;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bank-rules")
@RequiredArgsConstructor
public class BankRuleController {

  private final BankRuleService service;

  @GetMapping("/{walletId}")
  public ResponseEntity<List<BankRuleResponse>> list(
      @PathVariable UUID walletId, @AuthenticationPrincipal User user) {
    return ResponseEntity.ok(service.list(user.getId(), walletId));
  }

  @PostMapping("/{walletId}")
  public ResponseEntity<BankRuleResponse> create(
      @PathVariable UUID walletId,
      @RequestBody BankRuleRequest request,
      @AuthenticationPrincipal User user) {
    return ResponseEntity.ok(service.create(user.getId(), walletId, request));
  }

  @PutMapping("/{walletId}/{ruleId}")
  public ResponseEntity<BankRuleResponse> update(
      @PathVariable UUID walletId,
      @PathVariable UUID ruleId,
      @RequestBody BankRuleRequest request,
      @AuthenticationPrincipal User user) {
    return ResponseEntity.ok(service.update(user.getId(), walletId, ruleId, request));
  }

  @DeleteMapping("/{walletId}/{ruleId}")
  public ResponseEntity<Void> delete(
      @PathVariable UUID walletId, @PathVariable UUID ruleId, @AuthenticationPrincipal User user) {
    service.delete(user.getId(), walletId, ruleId);
    return ResponseEntity.noContent().build();
  }
}
