package dev.busato.FinanceWebApp.backend.dto;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminInviteResponse {
  private String email;
  private String note;
  private String url;
  private LocalDateTime createdAt;
  private LocalDateTime expiresAt;
  private String status;
}
