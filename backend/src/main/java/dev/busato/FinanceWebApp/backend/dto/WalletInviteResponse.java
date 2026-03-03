package dev.busato.FinanceWebApp.backend.dto;

import dev.busato.FinanceWebApp.backend.model.Wallet;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class WalletInviteResponse {
    private String walletOwner;
    private WalletResponse wallet;
    private String role;
    private String status;
    private LocalDate invitedAt;
}