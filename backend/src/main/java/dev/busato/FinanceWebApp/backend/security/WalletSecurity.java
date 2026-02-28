package dev.busato.FinanceWebApp.backend.security;

import dev.busato.FinanceWebApp.backend.exceptions.PermissionDeniedException;
import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component("walletSecurity")
@RequiredArgsConstructor
public class WalletSecurity {
    private final WalletAccessRepository walletAccessRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;

    public boolean requireUser(UUID userId) {
        if (!userRepository.existsById(userId))
            throw new UserNotFoundException(userId);
        return true;
    }

    public boolean requireWallet(UUID walletId) {
        if (!walletRepository.existsById(walletId))
            throw new WalletNotFoundException(walletId);
        return true;
    }

    public boolean isWalletOwner(UUID userId, UUID walletId) {
        WalletAccess access = walletAccessRepository.findByUserIdAndWalletId(userId, walletId)
                .orElseThrow(() -> new WalletNotFoundException(walletId));

        if (access.getRole() != WalletAccess.WalletRole.OWNER)
            throw new PermissionDeniedException(access.getUser().getUsername(), walletId);

        return true;
    }

    public boolean hasWriteAccess(UUID userId, UUID walletId) {
        WalletAccess access = walletAccessRepository.findByUserIdAndWalletId(userId, walletId)
                .orElseThrow(() -> new WalletNotFoundException(walletId));

        if (access.getStatus() != WalletAccess.InvitationStatus.ACCEPTED || access.getRole() == WalletAccess.WalletRole.VIEWER)
            throw new PermissionDeniedException(access.getUser().getUsername(), walletId);

        return true;
    }

    public boolean hasReadAccess(UUID userId, UUID walletId) {
        WalletAccess access = walletAccessRepository.findByUserIdAndWalletId(userId, walletId)
                .orElseThrow(() -> new WalletNotFoundException(walletId));

        if (access.getStatus() != WalletAccess.InvitationStatus.ACCEPTED )
            throw new PermissionDeniedException(access.getUser().getUsername(), walletId);

        return true;
    }
}
