package dev.busato.FinanceWebApp.backend.dto;

import java.util.List;
import java.util.UUID;

/**
 * Represents a single wallet's permission scope within a PAT.
 * Permissions can be "READ" (mandatory if wallet is allowed) and/or "WRITE".
 */
public record WalletPermission(UUID walletId, List<String> permissions) {}
