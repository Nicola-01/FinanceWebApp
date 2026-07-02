package dev.busato.FinanceWebApp.backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

/**
 * Response for listing existing tokens. Never contains the plain token — only the prefix for
 * identification.
 */
@Data
@Builder
public class PatResponse {
  private UUID id;
  private String name;

  /** Partial token for identification (e.g., "fin_pat_a1b2c3d4") */
  private String tokenPrefix;

  private List<WalletPermission> walletPermissions;
  private LocalDateTime createdAt;
  private LocalDateTime expiresAt;
  private LocalDateTime lastUsedAt;
}
