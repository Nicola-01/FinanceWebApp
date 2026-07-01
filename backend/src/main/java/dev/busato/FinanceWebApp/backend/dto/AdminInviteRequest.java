package dev.busato.FinanceWebApp.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminInviteRequest {
  @NotBlank(message = "Email cannot be empty.")
  @Email(message = "Invalid email format.")
  private String email;

  private String note;
}
