package dev.busato.FinanceWebApp.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class MemberResponse {
    private UUID userId;
    private String username;
    private String role;
    private String status;
    private LocalDate invitedAt;
}