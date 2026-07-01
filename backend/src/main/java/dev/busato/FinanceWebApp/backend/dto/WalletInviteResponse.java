package dev.busato.FinanceWebApp.backend.dto;

import java.time.LocalDate;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WalletInviteResponse {
  private String walletOwner;
  private WalletResponse wallet;
  private String role;
  private String status;
  private LocalDate invitedAt;
}
