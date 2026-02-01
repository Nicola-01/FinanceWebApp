package dev.busato.FinanceWebApp.backend.dto;

import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class WalletResponse {
    private UUID id;
    private String name;
    private String icon;
    private String currency;
    private LocalDateTime createdAt;
    private WalletAccess.WalletRole myRole;
}
