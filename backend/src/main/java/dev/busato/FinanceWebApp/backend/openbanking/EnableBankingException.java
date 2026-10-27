package dev.busato.FinanceWebApp.backend.openbanking;

public class EnableBankingException extends RuntimeException {
  private final int status;

  public EnableBankingException(int status, String message) {
    super(message);
    this.status = status;
  }

  public int status() {
    return status;
  }
}
