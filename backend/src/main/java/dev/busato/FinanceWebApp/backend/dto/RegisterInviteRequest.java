package dev.busato.FinanceWebApp.backend.dto;
import lombok.Data;

@Data
public class RegisterInviteRequest {
    private String token;
    private String username;
    private String password;
}