package dev.busato.FinanceWebApp.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class UserResponse {
    private UUID id;
    private String username;
    private String tempPassword;
    private LocalDate createdAt;
//    private List<WalletResponse> wallets;
    private int wallets;
    private int transactions;
}
