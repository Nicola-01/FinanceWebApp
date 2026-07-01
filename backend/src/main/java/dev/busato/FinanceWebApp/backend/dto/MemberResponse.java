package dev.busato.FinanceWebApp.backend.dto;

import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MemberResponse {
  private UUID userId;
  private String username;
  private String role;
  private String status;
  private LocalDate invitedAt;
}
