package dev.busato.FinanceWebApp.backend.exceptions;

public class TagInUseException extends RuntimeException {
  public TagInUseException(String tagName) {
    super(
        String.format(
            "Impossibile eliminare il tag '%s' perché è attualmente utilizzato in una o più transazioni.",
            tagName));
  }
}
