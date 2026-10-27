package dev.busato.FinanceWebApp.backend.openbanking;

import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.openbanking.BankDtos.BankConnectionResponse;
import dev.busato.FinanceWebApp.backend.openbanking.BankDtos.CallbackRequest;
import dev.busato.FinanceWebApp.backend.openbanking.BankDtos.ConnectRequest;
import dev.busato.FinanceWebApp.backend.openbanking.BankDtos.UrlResponse;
import dev.busato.FinanceWebApp.backend.openbanking.BankDtos.WalletBankResponse;
import dev.busato.FinanceWebApp.backend.openbanking.BankSyncService.SyncResult;
import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.Aspsp;
import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.PsuContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Open Banking link lifecycle. Interactive (JWT) sessions only: PATs are rejected. */
@RestController
@RequestMapping("/api/bank")
@RequiredArgsConstructor
@PreAuthorize("@walletSecurity.preventPatAccess()")
public class BankLinkController {

  private final BankLinkService service;

  @GetMapping("/aspsps")
  public List<Aspsp> aspsps(@RequestParam String country, @AuthenticationPrincipal User user) {
    return service.listAspsps(user.getId(), country);
  }

  @GetMapping("/wallets/{walletId}")
  public WalletBankResponse wallet(
      @PathVariable UUID walletId, @AuthenticationPrincipal User user) {
    return service.walletStatus(user.getId(), walletId);
  }

  @PostMapping("/wallets/{walletId}/connect")
  public UrlResponse connect(
      @PathVariable UUID walletId,
      @Valid @RequestBody ConnectRequest body,
      @AuthenticationPrincipal User user) {
    return service.connect(user.getId(), walletId, body);
  }

  @PostMapping("/callback")
  public BankConnectionResponse callback(
      @Valid @RequestBody CallbackRequest body,
      @AuthenticationPrincipal User user,
      HttpServletRequest request) {
    return service.callback(user.getId(), body, psu(request));
  }

  @PostMapping("/connections/{id}/renew")
  public UrlResponse renew(@PathVariable UUID id, @AuthenticationPrincipal User user) {
    return service.renew(user.getId(), id);
  }

  @PostMapping("/connections/{id}/sync")
  public SyncResult sync(
      @PathVariable UUID id, @AuthenticationPrincipal User user, HttpServletRequest request) {
    return service.sync(user.getId(), id, psu(request));
  }

  @PostMapping("/wallets/{walletId}/sync-if-stale")
  public List<SyncResult> syncIfStale(
      @PathVariable UUID walletId, @AuthenticationPrincipal User user, HttpServletRequest request) {
    return service.syncIfStale(user.getId(), walletId, psu(request));
  }

  @DeleteMapping("/connections/{id}")
  public ResponseEntity<Void> unlink(@PathVariable UUID id, @AuthenticationPrincipal User user) {
    service.unlink(user.getId(), id);
    return ResponseEntity.noContent().build();
  }

  /** The PSU's IP is only forwarded to the bank, so a spoofed X-Forwarded-For is harmless. */
  static PsuContext psu(HttpServletRequest request) {
    String fwd = request.getHeader("X-Forwarded-For");
    String ip = fwd != null && !fwd.isBlank() ? fwd.split(",")[0].trim() : request.getRemoteAddr();
    return new PsuContext(ip, request.getHeader("User-Agent"));
  }
}
