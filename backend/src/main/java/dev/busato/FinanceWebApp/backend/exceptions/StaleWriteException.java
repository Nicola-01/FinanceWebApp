package dev.busato.FinanceWebApp.backend.exceptions;

/**
 * Thrown when an offline replay's {@code baseUpdatedAt} precondition fails: the entity was modified
 * on the server after the client's offline edit was based on it. Mapped to HTTP 409 by {@link
 * dev.busato.FinanceWebApp.backend.controller.GlobalExceptionHandler}.
 */
public class StaleWriteException extends RuntimeException {
  public StaleWriteException(String entityKind) {
    super("This " + entityKind + " changed on the server after your offline edit was made.");
  }
}
