package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.TagBulkResponse;
import dev.busato.FinanceWebApp.backend.dto.TagRequest;
import dev.busato.FinanceWebApp.backend.dto.TagResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.TagService;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

  private final TagService tagService;

  @GetMapping("/{walletID}")
  public ResponseEntity<List<TagResponse>> getTags(
      @PathVariable UUID walletID, @AuthenticationPrincipal User user) {
    return ResponseEntity.ok(tagService.getTags(walletID, user.getId()));
  }

  @PostMapping("/{walletID}")
  public ResponseEntity<TagResponse> createTag(
      @PathVariable UUID walletID,
      @AuthenticationPrincipal User user,
      @Valid @RequestBody TagRequest tagRequest) {
    return ResponseEntity.ok(tagService.createTag(tagRequest, walletID, user.getId()));
  }

  @PostMapping("/{walletID}/bulk")
  public ResponseEntity<TagBulkResponse> createTagsBulk(
      @PathVariable UUID walletID,
      @AuthenticationPrincipal User user,
      @Valid @RequestBody List<TagRequest> tagRequests) {
    return ResponseEntity.ok(tagService.createTagsBulk(tagRequests, walletID, user.getId()));
  }

  @DeleteMapping("/{walletID}/{tagName}")
  public ResponseEntity<TagResponse> deleteTag(
      @PathVariable String tagName,
      @PathVariable UUID walletID,
      @RequestParam(required = false) Instant baseUpdatedAt,
      @AuthenticationPrincipal User user) {
    tagService.deleteTag(tagName, walletID, user.getId(), baseUpdatedAt);
    return ResponseEntity.noContent().build();
  }

  @PutMapping("/{walletID}/{tagName}")
  public ResponseEntity<TagResponse> updateTag(
      @PathVariable String tagName,
      @PathVariable UUID walletID,
      @AuthenticationPrincipal User user,
      @Valid @RequestBody TagRequest tagRequest) {
    return ResponseEntity.ok(tagService.updateTag(tagName, tagRequest, walletID, user.getId()));
  }
}
