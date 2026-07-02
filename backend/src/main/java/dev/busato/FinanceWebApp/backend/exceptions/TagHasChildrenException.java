package dev.busato.FinanceWebApp.backend.exceptions;

public class TagHasChildrenException extends RuntimeException {

  public TagHasChildrenException(String tagName) {
    super(
        String.format(
            "Unable to delete tag '%s': it contains sub-tags. Delete the children first.",
            tagName));
  }
}
