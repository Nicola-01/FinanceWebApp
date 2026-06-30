package dev.busato.FinanceWebApp.backend.controller;

import dev.busato.FinanceWebApp.backend.dto.MemberRequest;
import dev.busato.FinanceWebApp.backend.dto.MemberResponse;
import dev.busato.FinanceWebApp.backend.dto.WalletInviteResponse;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.service.MemberService;
import dev.busato.FinanceWebApp.backend.service.SendEmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
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
    @PreAuthorize("!principal.demo")
    public ResponseEntity<MemberResponse> inviteMember(
            @PathVariable UUID walletID,
            @Valid @RequestBody MemberRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(memberService.inviteMember(walletID, request, user.getId()));
    }

    // Update member role
    @PutMapping("/{walletID}/{memberID}")
    @PreAuthorize("!principal.demo")
    public ResponseEntity<MemberResponse> updateMemberRole(
            @PathVariable UUID walletID,
            @PathVariable UUID memberID,
            @Valid @RequestBody MemberRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(memberService.updateMemberRole(walletID, memberID, request, user.getId()));
    }

    @DeleteMapping("/{walletID}/{memberID}")
    @PreAuthorize("!principal.demo")
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

    // accept an invitation
    @PostMapping("/{walletID}/accept")
    @PreAuthorize("!principal.demo")
    public ResponseEntity<Void> acceptInvite(
            @PathVariable UUID walletID,
            @AuthenticationPrincipal User user) {
        memberService.setStatus(user.getId(), walletID, WalletAccess.InvitationStatus.ACCEPTED);
        return ResponseEntity.noContent().build();
    }

    // refuse an invitation
    @PostMapping("/{walletID}/reject")
    @PreAuthorize("!principal.demo")
    public ResponseEntity<Void> rejectInvite(
            @PathVariable UUID walletID,
            @AuthenticationPrincipal User user) {
        memberService.setStatus(user.getId(), walletID, WalletAccess.InvitationStatus.REJECTED);
        return ResponseEntity.noContent().build();
    }

}