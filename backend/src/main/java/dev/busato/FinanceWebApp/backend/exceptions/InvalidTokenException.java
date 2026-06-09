package dev.busato.FinanceWebApp.backend.exceptions;

/**
 * Thrown when a PAT token is invalid, expired, or not found.
 */
public class InvalidTokenException extends RuntimeException {

    public InvalidTokenException(String message) {
        super(message);
    }
}
