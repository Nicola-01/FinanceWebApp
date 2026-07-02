package dev.busato.FinanceWebApp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class WalletRequest {
  @NotBlank(message = "Name is required")
  private String name;

  private String icon;
  private String color;
  private String currency; // "EUR", "USD"
}
