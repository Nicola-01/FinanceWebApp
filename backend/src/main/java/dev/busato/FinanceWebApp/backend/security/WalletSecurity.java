package dev.busato.FinanceWebApp.backend.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.busato.FinanceWebApp.backend.exceptions.PermissionDeniedException;
import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException;
import dev.busato.FinanceWebApp.backend.model.PersonalAccessToken;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component("walletSecurity")
@RequiredArgsConstructor
public class WalletSecurity {
    private final WalletAccessRepository walletAccessRepository;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final ObjectMapper objectMapper;

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
        WalletAccess access = getWalletAccess(userId, walletId);

        if (access.getRole() != WalletAccess.WalletRole.OWNER)
            throw new PermissionDeniedException(access.getUser().getUsername(), walletId);

        verifyPatPermissions(walletId, "OWNER", access.getUser().getUsername());

        return true;
    }

    public boolean hasWriteAccess(UUID userId, UUID walletId) {
        WalletAccess access = getWalletAccess(userId, walletId);

        if (access.getStatus() != WalletAccess.InvitationStatus.ACCEPTED || access.getRole() == WalletAccess.WalletRole.VIEWER)
            throw new PermissionDeniedException(access.getUser().getUsername(), walletId);

        verifyPatPermissions(walletId, "WRITE", access.getUser().getUsername());

        return true;
    }

    public boolean hasReadAccess(UUID userId, UUID walletId) {
        WalletAccess access = getWalletAccess(userId, walletId);

        if (access.getStatus() != WalletAccess.InvitationStatus.ACCEPTED )
            throw new PermissionDeniedException(access.getUser().getUsername(), walletId);

        verifyPatPermissions(walletId, "READ", access.getUser().getUsername());

        return true;
    }

    public boolean hasReadAccessQuietly(UUID userId, UUID walletId) {
        try {
            return hasReadAccess(userId, walletId);
        } catch (Exception e) {
            return false;
        }
    }

    public boolean preventPatAccess() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getCredentials() instanceof PersonalAccessToken) {
            throw new org.springframework.security.access.AccessDeniedException("Personal Access Tokens cannot perform this operation.");
        }
        return true;
    }

    private WalletAccess getWalletAccess(UUID userId, UUID walletId) {
        return walletAccessRepository.findByUserIdAndWalletId(userId, walletId)
                .orElseThrow(() -> new WalletNotFoundException(walletId));
    }

    private void verifyPatPermissions(UUID walletId, String requiredPermission, String username) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getCredentials() instanceof PersonalAccessToken pat)) {
            return; // Not a PAT, so no extra token-level restrictions apply
        }

        String permissionsJson = pat.getWalletPermissions();
        if (permissionsJson == null || permissionsJson.isBlank()) {
            throw new PermissionDeniedException(username, walletId);
        }

        try {
            List<PatWalletPermission> perms = objectMapper.readValue(permissionsJson, new TypeReference<List<PatWalletPermission>>() {});
            boolean hasAccess = perms.stream()
                    .filter(p -> walletId.toString().equals(p.getWalletId()))
                    .map(PatWalletPermission::getPermissions)
                    .filter(java.util.Objects::nonNull)
                    .anyMatch(list -> {
                        if ("OWNER".equals(requiredPermission)) return false; // PATs can never act as owners
                        if ("WRITE".equals(requiredPermission)) return list.contains("WRITE");
                        return list.contains("READ") || list.contains("WRITE"); // READ required
                    });

            if (!hasAccess) {
                throw new PermissionDeniedException(username, walletId);
            }
        } catch (Exception e) {
            throw new PermissionDeniedException(username, walletId);
        }
    }

    @Data
    public static class PatWalletPermission {
        private String walletId;
        private List<String> permissions;
    }
}
