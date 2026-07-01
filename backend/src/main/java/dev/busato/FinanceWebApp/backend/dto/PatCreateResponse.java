package dev.busato.FinanceWebApp.backend.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

/**
 * Response returned ONLY ONCE upon token creation. Contains the plain token which must be copied by
 * the user immediately.
 */
@Data
@Builder
public class PatCreateResponse {
  private UUID id;
  private String name;

  /** The raw token string — shown to the user exactly ONCE, then never retrievable again */
  private String plainToken;

  private String tokenPrefix;
  private List<WalletPermission> walletPermissions;
  private LocalDateTime createdAt;
  private LocalDateTime expiresAt;
}
