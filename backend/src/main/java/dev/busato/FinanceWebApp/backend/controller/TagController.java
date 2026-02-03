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
    private final UUID TMP_userId = UUID.fromString("61a3c590-368d-4442-953e-2d37f60a29ba");


    @GetMapping("/{walletID}")
    public ResponseEntity<List<TagResponse>> getTags(@PathVariable UUID walletID,
                                                     @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(tagService.getTags(walletID, TMP_userId));
//        return ResponseEntity.ok(tagService.getTags(walletID, user.getId()));
//        return ResponseEntity.ok(transactionService.getTransactionsByWalletID(walletID));
    }


    @PostMapping("/{walletID}")
    public ResponseEntity<TagResponse> createTag(@PathVariable UUID walletID,
                                                               @AuthenticationPrincipal User user,
                                                               @RequestBody TagRequest tagRequest
    ) {
        return ResponseEntity.ok(tagService.createTag(tagRequest, walletID, TMP_userId));
//        return ResponseEntity.ok(tagService.getTags(walletID, user.getId()));
//        return ResponseEntity.ok(transactionService.getTransactionsByWalletID(walletID));
    }
}
