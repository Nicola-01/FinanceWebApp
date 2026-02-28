package dev.busato.FinanceWebApp.backend.dto;

import lombok.Data;

@Data
public class MemberRequest {
    private String user;
    private String role;
}