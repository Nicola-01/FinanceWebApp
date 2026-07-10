package dev.busato.FinanceWebApp.backend.exceptions;

import java.util.UUID;

public class BudgetNotFoundException extends RuntimeException {
  public BudgetNotFoundException(UUID budgetId) {
    super("Budget not found: " + budgetId);
  }
}
