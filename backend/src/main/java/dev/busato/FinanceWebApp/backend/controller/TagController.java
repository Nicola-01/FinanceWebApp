package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.TagRequest;
import dev.busato.FinanceWebApp.backend.dto.TagResponse;
import dev.busato.FinanceWebApp.backend.dto.TransactionResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;


    @GetMapping("/{walletID}")
    public ResponseEntity<List<TagResponse>> getTags(@PathVariable UUID walletID,
                                                     @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(tagService.getTags(walletID, user.getId()));
    }


    @PostMapping("/{walletID}")
    public ResponseEntity<TagResponse> createTag(@PathVariable UUID walletID,
                                                 @AuthenticationPrincipal User user,
                                                 @RequestBody TagRequest tagRequest
    ) {
        return ResponseEntity.ok(tagService.createTag(tagRequest, walletID, user.getId()));
    }

    @DeleteMapping("/{walletID}/{tagName}")
    public ResponseEntity<TagResponse> deleteTag(@PathVariable String tagName, @PathVariable UUID walletID, @AuthenticationPrincipal User user) {
        tagService.deleteTag(tagName, walletID, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{walletID}/{tagName}")
    public ResponseEntity<TagResponse> updateTag(@PathVariable String tagName,
                                                 @PathVariable UUID walletID,
                                                 @AuthenticationPrincipal User user,
                                                 @RequestBody TagRequest tagRequest
    ) {
        return ResponseEntity.ok(tagService.updateTag(tagName, tagRequest, walletID, user.getId()));
    }
}
