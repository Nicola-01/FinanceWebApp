package dev.busato.FinanceWebApp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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

  // Optional free-text description, shown to invitees. Sent only at creation time.
  @Size(max = 500, message = "Description must be at most 500 characters")
  private String description;

  private String icon;
  private String color;
  private String currency; // "EUR", "USD"
}
