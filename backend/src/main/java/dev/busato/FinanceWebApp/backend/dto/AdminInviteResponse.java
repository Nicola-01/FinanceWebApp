package dev.busato.FinanceWebApp.backend.dto;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

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