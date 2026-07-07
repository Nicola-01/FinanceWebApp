package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.PatBulkDeleteRequest;
import dev.busato.FinanceWebApp.backend.dto.PatBulkPauseRequest;
import dev.busato.FinanceWebApp.backend.dto.PatCreateRequest;
import dev.busato.FinanceWebApp.backend.dto.PatCreateResponse;
import dev.busato.FinanceWebApp.backend.dto.PatResponse;
import dev.busato.FinanceWebApp.backend.dto.PatUpdateRequest;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.PatService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for managing Personal Access Tokens (PATs).
 *
 * <p>All endpoints require an interactive JWT session. Token management must never be reachable
 * with a PAT itself: otherwise a narrowly-scoped token could mint a fully-privileged one (or revoke
 * the user's other tokens), escaping its per-wallet scope. {@code preventPatAccess()} rejects any
 * request authenticated with a PAT.
 */
@RestController
@RequestMapping("/api/tokens")
@RequiredArgsConstructor
@PreAuthorize("@walletSecurity.preventPatAccess()")
public class PatController {

  private final PatService patService;

  /**
   * Creates a new PAT and returns the plain token ONCE. The user must copy it immediately — it
   * cannot be retrieved later.
   */
  @PostMapping
  public ResponseEntity<PatCreateResponse> createToken(
      @RequestBody PatCreateRequest request, @AuthenticationPrincipal User user) {
    PatCreateResponse response = patService.createToken(user.getId(), request);
    return ResponseEntity.ok(response);
  }

  /**
   * Lists all tokens belonging to the authenticated user. Plain tokens are never included — only
   * prefixes for identification.
   */
  @GetMapping
  public ResponseEntity<List<PatResponse>> listTokens(@AuthenticationPrincipal User user) {
    return ResponseEntity.ok(patService.listTokens(user.getId()));
  }

  /**
   * Revokes (permanently deletes) a token by ID. Only the token owner can revoke their own tokens.
   */
  @DeleteMapping("/{tokenId}")
  public ResponseEntity<Void> revokeToken(
      @PathVariable UUID tokenId, @AuthenticationPrincipal User user) {
    patService.revokeToken(tokenId, user.getId());
    return ResponseEntity.noContent().build();
  }

  /** Updates an existing token's wallet permissions. */
  @PutMapping("/{tokenId}")
  public ResponseEntity<PatResponse> updateToken(
      @PathVariable UUID tokenId,
      @RequestBody PatUpdateRequest request,
      @AuthenticationPrincipal User user) {
    PatResponse response = patService.updateToken(tokenId, user.getId(), request);
    return ResponseEntity.ok(response);
  }

  /** Pauses a token so it is rejected during API authentication (without deleting it). */
  @PostMapping("/{tokenId}/pause")
  public ResponseEntity<PatResponse> pauseToken(
      @PathVariable UUID tokenId, @AuthenticationPrincipal User user) {
    PatResponse response = patService.setPaused(tokenId, user.getId(), true);
    return ResponseEntity.ok(response);
  }

  /** Resumes a previously paused token. */
  @PostMapping("/{tokenId}/resume")
  public ResponseEntity<PatResponse> resumeToken(
      @PathVariable UUID tokenId, @AuthenticationPrincipal User user) {
    PatResponse response = patService.setPaused(tokenId, user.getId(), false);
    return ResponseEntity.ok(response);
  }

  /**
   * Bulk-deletes tokens by ID. Only tokens owned by the authenticated user are affected; IDs not
   * owned by the user are silently ignored.
   */
  @PostMapping("/bulk-delete")
  public ResponseEntity<Void> bulkDeleteTokens(
      @Valid @RequestBody PatBulkDeleteRequest request, @AuthenticationPrincipal User user) {
    patService.bulkDeleteTokens(request.getIds(), user.getId());
    return ResponseEntity.noContent().build();
  }

  /**
   * Bulk pauses or resumes tokens by ID. Only tokens owned by the authenticated user are affected;
   * IDs not owned by the user are silently ignored. Returns the updated tokens.
   */
  @PostMapping("/bulk-pause")
  public ResponseEntity<List<PatResponse>> bulkPauseTokens(
      @Valid @RequestBody PatBulkPauseRequest request, @AuthenticationPrincipal User user) {
    List<PatResponse> response =
        patService.bulkSetPaused(request.getIds(), user.getId(), request.getPaused());
    return ResponseEntity.ok(response);
  }
}
