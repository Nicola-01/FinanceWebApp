package dev.busato.FinanceWebApp.backend.dto;

import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponse {
  private UUID id;
  private String name;
  private String tempPassword;
  private LocalDate createdAt;
  //    private List<WalletResponse> wallets;
  private int wallets;
  private int transactions;
}
