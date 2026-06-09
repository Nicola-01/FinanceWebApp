package dev.busato.FinanceWebApp.backend.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Request body for creating a new Personal Access Token.
 */
@Data
public class PatCreateRequest {

    /** User-defined name/label for easy identification */
    private String name;

    /** List of wallets and their granted permissions */
    private List<WalletPermission> walletPermissions;

    /** Optional expiration date (null = never expires) */
    private LocalDateTime expiresAt;
}
