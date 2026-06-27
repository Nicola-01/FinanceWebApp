package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.PatCreateRequest;
import dev.busato.FinanceWebApp.backend.dto.PatCreateResponse;
import dev.busato.FinanceWebApp.backend.dto.PatResponse;
import dev.busato.FinanceWebApp.backend.dto.PatUpdateRequest;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.PatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for managing Personal Access Tokens (PATs).
 * <p>
 * All endpoints require JWT authentication (the PAT filter only handles
 * API authentication, not PAT management itself).
 */
@RestController
@RequestMapping("/api/tokens")
@RequiredArgsConstructor
public class PatController {

    private final PatService patService;

    /**
     * Creates a new PAT and returns the plain token ONCE.
     * The user must copy it immediately — it cannot be retrieved later.
     */
    @PostMapping
    public ResponseEntity<PatCreateResponse> createToken(
            @RequestBody PatCreateRequest request,
            @AuthenticationPrincipal User user
    ) {
        PatCreateResponse response = patService.createToken(user.getId(), request);
        return ResponseEntity.ok(response);
    }

    /**
     * Lists all tokens belonging to the authenticated user.
     * Plain tokens are never included — only prefixes for identification.
     */
    @GetMapping
    public ResponseEntity<List<PatResponse>> listTokens(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(patService.listTokens(user.getId()));
    }

    /**
     * Revokes (permanently deletes) a token by ID.
     * Only the token owner can revoke their own tokens.
     */
    @DeleteMapping("/{tokenId}")
    public ResponseEntity<Void> revokeToken(
            @PathVariable UUID tokenId,
            @AuthenticationPrincipal User user
    ) {
        patService.revokeToken(tokenId, user.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * Updates an existing token's wallet permissions.
     */
    @PutMapping("/{tokenId}")
    public ResponseEntity<PatResponse> updateToken(
            @PathVariable UUID tokenId,
            @RequestBody PatUpdateRequest request,
            @AuthenticationPrincipal User user
    ) {
        PatResponse response = patService.updateToken(tokenId, user.getId(), request);
        return ResponseEntity.ok(response);
    }
}
