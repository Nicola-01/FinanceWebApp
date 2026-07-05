package dev.busato.FinanceWebApp.backend.dto;

import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WalletResponse {
  private UUID id;
  private String name;
  private String description;
  private String icon;
  private String color;
  private String currency;
  private LocalDate createdAt;
  private WalletAccess.WalletRole userRole;
  private WalletAccess.WalletRole tokenAccess;
}
