package dev.busato.FinanceWebApp.backend.exceptions;

import java.util.UUID;

public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(UUID userId) {
        this("Could not find user with id: " + userId);
    }

    public UserNotFoundException(String username) {
        super("Could not find user with name: " + username);
    }
}
