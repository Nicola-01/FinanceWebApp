package dev.busato.FinanceWebApp.backend.exceptions;

public class BudgetConflictException extends RuntimeException {
  public BudgetConflictException(String message) {
    super(message);
  }
}
