package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.WalletRequest;
import dev.busato.FinanceWebApp.backend.dto.WalletResponse;
import dev.busato.FinanceWebApp.backend.exceptions.UnauthorizedAccessException;
import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException;
import dev.busato.FinanceWebApp.backend.model.*;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository; // <--- Nuovo import
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
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
    public WalletResponse createWallet(WalletRequest request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        if (request.getName().length() < 3 || request.getName().length() > 25)
            throw new IllegalArgumentException("The name must be between 3 and 25 characters long.");

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

        return mapWalletToResponse(access);
    }

    @Transactional
    public WalletResponse updateWallet(UUID walletId, WalletRequest request, UUID userId) {

        if (request.getName().length() < 3 || request.getName().length() > 25)
            throw new IllegalArgumentException("The name must be between 3 and 25 characters long.");

        WalletAccess ownerAccess = walletAccessRepository.findByWalletIdAndUserIdAndRole(walletId, userId, WalletAccess.WalletRole.OWNER)
                .orElseThrow(() -> new UnauthorizedAccessException("Only the owner can update this wallet"));

        Wallet wallet = ownerAccess.getWallet();

        if (request.getName() != null && !request.getName().isBlank())
            wallet.setName(request.getName());
        if (request.getColor() != null && !request.getColor().isBlank())
            wallet.setColor(request.getColor());
        if (request.getIcon() != null && !request.getIcon().isBlank())
            wallet.setIcon(request.getIcon());

        return mapWalletToResponse(ownerAccess);
    }

    @Transactional
    public void removeWallet(UUID walletId, UUID userId) {
        WalletAccess userAccess = walletAccessRepository.findByUserIdAndWalletId(userId, walletId)
                .orElseThrow(() -> new UnauthorizedAccessException("No access to this wallet"));

        if (userAccess.getRole() == WalletAccess.WalletRole.OWNER)
            walletRepository.delete(userAccess.getWallet());
        else
            userAccess.setStatus(WalletAccess.InvitationStatus.LEFT);
    }

    public List<WalletResponse> getWallets(UUID userId) {
        return walletAccessRepository.findAllByUserIdAndStatus(userId, WalletAccess.InvitationStatus.ACCEPTED)
                .stream()
                .map(this::mapWalletToResponse)
                .collect(Collectors.toList());
    }

    public WalletResponse getWallet(UUID userId, UUID walletID) {
        WalletAccess walletAccess = walletAccessRepository.findByUserIdAndWalletId(userId, walletID)
                .orElseThrow(() -> new WalletNotFoundException(walletID));

        return mapWalletToResponse(walletAccess);
    }

    public WalletResponse mapWalletToResponse(WalletAccess access) {
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