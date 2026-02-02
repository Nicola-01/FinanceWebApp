package dev.busato.FinanceWebApp.backend.exceptions;

import java.util.UUID;

public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(String message) {
        super(message);
    }

    public UserNotFoundException(UUID userId) {
        this("Could not find user with id: " + userId);
    }
}
