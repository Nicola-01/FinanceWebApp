package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.WalletRequest;
import dev.busato.FinanceWebApp.backend.dto.WalletResponse;
import dev.busato.FinanceWebApp.backend.model.*;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository; // <--- Nuovo import
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletAccessRepository walletAccessRepository;
    private final UserRepository userRepository;

    @Transactional
    public WalletResponse createWallet(WalletRequest request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));


        // Create the wallet
        Wallet wallet = Wallet.builder()
                .name(request.getName())
                .currency(request.getCurrency())
                .color(request.getColor())
                .icon(request.getIcon())
                .build();

        wallet = walletRepository.save(wallet);

        // Set the access
        WalletAccess.WalletAccessId accessId = new WalletAccess.WalletAccessId(user.getId(), wallet.getId());

        WalletAccess access = new WalletAccess();
        access.setId(accessId);
        access.setUser(user);
        access.setWallet(wallet);
        access.setRole(WalletAccess.WalletRole.OWNER);
        access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);

        walletAccessRepository.save(access);

        return mapToResponse(access);
    }

    public List<WalletResponse> getMyWallets(UUID userId) {
        return walletAccessRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private WalletResponse mapToResponse(WalletAccess access) {
        return WalletResponse.builder()
                .id(access.getWallet().getId())
                .name(access.getWallet().getName())
                .currency(access.getWallet().getCurrency())
                .icon(access.getWallet().getIcon())
                .myRole(access.getRole()) // Mappa il ruolo corretto
                .build();
    }
}