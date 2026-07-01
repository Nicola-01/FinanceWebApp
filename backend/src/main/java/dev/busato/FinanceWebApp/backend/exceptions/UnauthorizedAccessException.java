package dev.busato.FinanceWebApp.backend.exceptions;

public class UnauthorizedAccessException extends RuntimeException {

  public UnauthorizedAccessException(String message) {
    super(message);
  }
}
