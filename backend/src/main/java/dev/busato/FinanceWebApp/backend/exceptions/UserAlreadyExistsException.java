package dev.busato.FinanceWebApp.backend.exceptions;

public class UserAlreadyExistsException extends RuntimeException {

  public UserAlreadyExistsException(String username) {
    super("Username '" + username + "' already in use!");
  }
}
