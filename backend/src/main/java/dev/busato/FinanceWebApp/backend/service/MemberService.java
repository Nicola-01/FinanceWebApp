package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.MemberRequest;
import dev.busato.FinanceWebApp.backend.dto.MemberResponse;
import dev.busato.FinanceWebApp.backend.dto.WalletInviteResponse;
import dev.busato.FinanceWebApp.backend.dto.WalletResponse;
import dev.busato.FinanceWebApp.backend.exceptions.UnauthorizedAccessException;
import dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import jakarta.mail.MessagingException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MemberService {

    private final WalletAccessRepository walletAccessRepository;
    private final WalletRepository walletRepository;
    private final UserRepository userRepository;

    private final SendEmailService sendEmailService;

    private final WalletService walletService;

    @PreAuthorize("@walletSecurity.hasReadAccess(#userId, #walletId)")
    public List<MemberResponse> getMembers(UUID walletId, UUID userId) {
        return walletAccessRepository.findAllByWalletId(walletId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    @PreAuthorize("@walletSecurity.isWalletOwner(#userId, #walletId)")
    public MemberResponse inviteMember(UUID walletId, MemberRequest request, UUID userId) {
        Wallet wallet = walletRepository.findById(walletId)
                .orElseThrow(() -> new WalletNotFoundException(walletId));

        Optional<User> targetUserOpt = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(request.getUser(), request.getUser());

        if (targetUserOpt.isEmpty()) {
            return MemberResponse.builder()
                    .userId(UUID.randomUUID()) // TODO da vedere. stesso user UUID diverso
                    .username(request.getUser())
                    .role(request.getRole().toUpperCase())
                    .status(WalletAccess.InvitationStatus.PENDING.name())
                    .invitedAt(LocalDate.now())
                    .build();
        }

        User targetUser = targetUserOpt.get();

        if (targetUser.getId().equals(userId))
            throw new IllegalArgumentException("You cannot invite yourself");

        if (walletAccessRepository.existsByWalletIdAndUserIdAndStatusIn(
                walletId,
                targetUser.getId(),
                new WalletAccess.InvitationStatus[]{
                        WalletAccess.InvitationStatus.PENDING,
                        WalletAccess.InvitationStatus.ACCEPTED
                }
        )) {
            throw new IllegalArgumentException("User is already a member or has a pending invite");
        }

        LocalDate threeDaysAgo = LocalDate.now().minusDays(3);
        if (walletAccessRepository.existsByWalletIdAndUserIdAndStatusInAndUpdatedAtAfter(
                walletId,
                targetUser.getId(),
                List.of(WalletAccess.InvitationStatus.REJECTED, WalletAccess.InvitationStatus.LEFT),
                threeDaysAgo
        ))
            throw new IllegalArgumentException("L'utente ha rifiutato l'invito o ha abbandonato il wallet di recente. Devi aspettare 3 giorni dall'evento prima di poterlo reinvitare.");

        WalletAccess access = new WalletAccess();
        access.setId(new WalletAccess.WalletAccessId(targetUser.getId(), wallet.getId()));
        access.setUser(targetUser);
        access.setWallet(wallet);
        access.setRole(WalletAccess.WalletRole.valueOf(request.getRole().toUpperCase()));
        access.setStatus(WalletAccess.InvitationStatus.PENDING);

        try {
            sendEmailService.sendWalletInvitation(userRepository.findById(userId).get().getUsername(), wallet, targetUser.getEmail(), access.getRole() == WalletAccess.WalletRole.EDITOR);
        } catch (Exception e) {
            throw new RuntimeException("Unable to send the invitation email to " + targetUser.getEmail(), e);
        }

        walletAccessRepository.save(access);

        return mapToResponse(access);
    }

    @Transactional
    @PreAuthorize("@walletSecurity.isWalletOwner(#userId, #walletId)")
    public MemberResponse updateMemberRole(UUID walletId, UUID memberId, MemberRequest request, UUID userId) {
        WalletAccess access = walletAccessRepository.findByWalletIdAndUserId(walletId, memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found in this wallet"));

        if (access.getRole() == WalletAccess.WalletRole.OWNER)
            throw new IllegalArgumentException("Cannot change the role of the wallet owner");

        access.setRole(WalletAccess.WalletRole.valueOf(request.getRole().toUpperCase()));
        return mapToResponse(access);
    }

    @Transactional
    @PreAuthorize("@walletSecurity.isWalletOwner(#userId, #walletId)")
    public void removeMember(UUID walletId, UUID memberId, UUID userId) {
        WalletAccess access = walletAccessRepository.findByWalletIdAndUserId(walletId, memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found in this wallet"));

        if (access.getRole() == WalletAccess.WalletRole.OWNER) {
            throw new IllegalArgumentException("Cannot remove the wallet owner");
        }

        access.setStatus(WalletAccess.InvitationStatus.REVOKED);
    }

    @Transactional
    public List<WalletInviteResponse> getInvites(User user) {
        List<WalletAccess> accesses = walletAccessRepository.findAllByUserIdAndStatus(
                user.getId(),
                WalletAccess.InvitationStatus.PENDING
        );
        return accesses.stream()
                .filter(access -> access.getStatus() == WalletAccess.InvitationStatus.PENDING)
                .map(this::mapToWalletInviteResponse)
                .collect(Collectors.toList());
    }

    private MemberResponse mapToResponse(WalletAccess access) {
        return MemberResponse.builder()
                .userId(access.getUser().getId())
                .username(access.getUser().getUsername())
                .role(access.getRole().toString())
                .status(access.getStatus().toString())
                .invitedAt(access.getInvitedAt())
                .build();
    }

    private WalletInviteResponse mapToWalletInviteResponse(WalletAccess access) {
        String ownerUsername = walletAccessRepository
                .findByWalletIdAndRole(access.getWallet().getId(), WalletAccess.WalletRole.OWNER)
                .map(wa -> wa.getUser().getUsername())
                .orElse("User no found");

        return WalletInviteResponse.builder()
                .walletOwner(ownerUsername)
                .wallet(walletService.mapWalletToResponse(access))
                .role(access.getRole().name())
                .status(access.getStatus().name())
                .invitedAt(access.getInvitedAt())
                .build();
    }

    public void setStatus(UUID id, UUID walletID, WalletAccess.InvitationStatus invitationStatus) {
        WalletAccess access = walletAccessRepository.findByWalletIdAndUserId(walletID, id)
                .orElseThrow(() -> new IllegalArgumentException("Member not found in this wallet"));

        access.setStatus(invitationStatus);
        walletAccessRepository.save(access);
    }
}