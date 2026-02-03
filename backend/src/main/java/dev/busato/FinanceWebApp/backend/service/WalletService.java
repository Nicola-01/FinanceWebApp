package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.WalletRequest;
import dev.busato.FinanceWebApp.backend.dto.WalletResponse;
import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException;
import dev.busato.FinanceWebApp.backend.model.*;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository; // <--- Nuovo import
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletAccessRepository walletAccessRepository;
    private final UserRepository userRepository;

    @Transactional
    @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
    public WalletResponse createWallet(WalletRequest request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // Create the wallet
        Wallet wallet = Wallet.builder()
                .name(request.getName())
                .color(Optional.ofNullable(request.getColor()).orElse("#abababa"))
                .icon(request.getIcon())
                .currency(Optional.ofNullable(request.getCurrency()).orElse("EUR"))
                .createdAt(LocalDate.now())
                .build();

        wallet = walletRepository.save(wallet);

        // Set the access
        WalletAccess.WalletAccessId accessId = new WalletAccess.WalletAccessId(userId, wallet.getId());

        WalletAccess access = new WalletAccess();
        access.setId(accessId);
        access.setUser(user);
        access.setWallet(wallet);
        access.setRole(WalletAccess.WalletRole.OWNER);
        access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
        access.setInvitedAt(LocalDate.now());

        walletAccessRepository.save(access);

        return mapToResponse(access);
    }

//    @PreAuthorize("@walletService.requireUser(#userId)")
    public List<WalletResponse> getWallets(UUID userId) {
        return walletAccessRepository.findAllByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public WalletResponse getWallet(UUID userId, UUID walletID) {
        WalletAccess walletAccess = walletAccessRepository.findByUserIdAndWalletId(userId, walletID)
                .orElseThrow(() -> new WalletNotFoundException(walletID));

        return mapToResponse(walletAccess);
    }

    private WalletResponse mapToResponse(WalletAccess access) {
        return WalletResponse.builder()
                .id(access.getWallet().getId())
                .name(access.getWallet().getName())
                .currency(access.getWallet().getCurrency())
                .icon(access.getWallet().getIcon())
                .color(access.getWallet().getColor())
                .createdAt(access.getWallet().getCreatedAt())
                .myRole(access.getRole())
                .build();
    }
}