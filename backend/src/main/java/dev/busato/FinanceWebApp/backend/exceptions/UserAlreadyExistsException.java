package dev.busato.FinanceWebApp.backend.exceptions;

import java.util.UUID;

public class UserAlreadyExistsException extends RuntimeException {

    public UserAlreadyExistsException(String username) {
        super("Username '" + username + "' already in use!");
    }
}
