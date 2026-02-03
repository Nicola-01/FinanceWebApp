package dev.busato.FinanceWebApp.backend.exceptions;

import java.util.UUID;

public class PermissionDeniedException extends RuntimeException {

    public PermissionDeniedException(String message) {
        super(message);
    }

    public PermissionDeniedException(String username, UUID walletId) {
        this("The user " + username + " does not have permission to write in wallet " + walletId);
    }
}
