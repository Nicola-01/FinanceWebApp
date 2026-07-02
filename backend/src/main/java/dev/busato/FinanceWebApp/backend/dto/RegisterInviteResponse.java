package dev.busato.FinanceWebApp.backend.dto;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RegisterInviteResponse {
  private String email;
  private LocalDateTime createdAt;
  private LocalDateTime expiresAt;
  private String status;
}
