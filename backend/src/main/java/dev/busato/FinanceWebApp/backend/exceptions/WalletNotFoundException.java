package dev.busato.FinanceWebApp.backend.exceptions;

import java.util.UUID;

public class WalletNotFoundException extends RuntimeException {

    public WalletNotFoundException(String message) {
        super(message);
    }

    public WalletNotFoundException(UUID walletId) {
        this("Could not find wallet with id: " + walletId);
    }
}
