package dev.busato.FinanceWebApp.backend.mappers;

import dev.busato.FinanceWebApp.backend.dto.WalletResponse;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import org.springframework.stereotype.Component;

@Component
public class WalletMapper {

    public WalletResponse mapToResponse(WalletAccess access) {
        return WalletResponse.builder()
                .id(access.getWallet().getId())
                .name(access.getWallet().getName())
                .currency(access.getWallet().getCurrency())
                .icon(access.getWallet().getIcon())
                .color(access.getWallet().getColor())
                .createdAt(access.getWallet().getCreatedAt())
                .myRole(access.getRole())
                .build();
    }
}
