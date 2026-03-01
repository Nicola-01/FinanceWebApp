package dev.busato.FinanceWebApp.backend.dto;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class RegisterInviteResponse {
    private String email;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private String status;
}