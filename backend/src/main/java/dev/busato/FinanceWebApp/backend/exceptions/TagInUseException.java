package dev.busato.FinanceWebApp.backend.exceptions;

public class TagInUseException extends RuntimeException {
  public TagInUseException(String tagName) {
    super(
        String.format(
            "Impossibile eliminare il tag '%s' perché è attualmente utilizzato in una o più transazioni.",
            tagName));
  }

  /** Overload for a guard other than the transaction one (e.g. a budget still references it). */
  public TagInUseException(String tagName, String reason) {
    super(String.format("Cannot delete tag '%s': %s.", tagName, reason));
  }
}
