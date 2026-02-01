package dev.busato.FinanceWebApp.backend.dto;

import lombok.Data;

@Data
public class WalletRequest {
    private String name;
    private String icon;
    private String color;
    private String currency; // "EUR", "USD"
}