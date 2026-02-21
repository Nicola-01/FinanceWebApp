package dev.busato.FinanceWebApp.backend.exceptions;

import java.util.UUID;

public class UnauthorizedAccessException extends RuntimeException {

    public UnauthorizedAccessException(String message) {
        super(message);
    }

}
