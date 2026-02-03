package dev.busato.FinanceWebApp.backend.exceptions;

public class InvalidPasswordException extends RuntimeException {
    public InvalidPasswordException() {
        super("The password is incorrect");
    }
}
