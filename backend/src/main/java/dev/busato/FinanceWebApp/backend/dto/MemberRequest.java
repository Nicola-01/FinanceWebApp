package dev.busato.FinanceWebApp.backend.dto;

import lombok.Data;

@Data
public class MemberRequest {
    private String username; // Usato per invitare un nuovo membro
    private String role;     // EDITOR o VIEWER
}