package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.MemberRequest;
import dev.busato.FinanceWebApp.backend.dto.MemberResponse;
import dev.busato.FinanceWebApp.backend.dto.WalletInviteResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.MemberService;
import dev.busato.FinanceWebApp.backend.service.SendEmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
public class MembersController {

    private final MemberService memberService;

    // Get members of a wallet
    @GetMapping("/{walletID}")
    public ResponseEntity<List<MemberResponse>> getMembers(
            @PathVariable UUID walletID,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(memberService.getMembers(walletID, user.getId()));
    }

    // Invite a member to a wallet
    @PostMapping("/{walletID}")
    public ResponseEntity<MemberResponse> inviteMember(
            @PathVariable UUID walletID,
            @RequestBody MemberRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(memberService.inviteMember(walletID, request, user.getId()));
    }

    // Update member role
    @PutMapping("/{walletID}/{memberID}")
    public ResponseEntity<MemberResponse> updateMemberRole(
            @PathVariable UUID walletID,
            @PathVariable UUID memberID,
            @RequestBody MemberRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(memberService.updateMemberRole(walletID, memberID, request, user.getId()));
    }

    @DeleteMapping("/{walletID}/{memberID}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID walletID,
            @PathVariable UUID memberID,
            @AuthenticationPrincipal User user) {
        memberService.removeMember(walletID, memberID, user.getId());
        return ResponseEntity.noContent().build();
    }

    // get invites of a user
    @GetMapping()
    public ResponseEntity<List<WalletInviteResponse>> getInvites(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(memberService.getInvites(user));
    }

}