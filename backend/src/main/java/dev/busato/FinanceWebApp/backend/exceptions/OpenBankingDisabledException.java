package dev.busato.FinanceWebApp.backend.exceptions;

/** Open Banking is not configured on this server or not enabled for the user. */
public class OpenBankingDisabledException extends RuntimeException {
  public OpenBankingDisabledException() {
    super("Open Banking is not enabled for this account");
  }
}
