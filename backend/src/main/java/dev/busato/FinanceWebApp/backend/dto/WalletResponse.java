package dev.busato.FinanceWebApp.backend.dto;

import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class WalletResponse {
    private UUID id;
    private String name;
    private String icon;
    private String color;
    private String currency;
    private LocalDate createdAt;
    private WalletAccess.WalletRole userRole;
    private WalletAccess.WalletRole tokenAccess;
}
