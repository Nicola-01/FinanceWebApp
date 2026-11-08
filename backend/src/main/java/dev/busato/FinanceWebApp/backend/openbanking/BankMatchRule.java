package dev.busato.FinanceWebApp.backend.openbanking;

import dev.busato.FinanceWebApp.backend.model.Subscription;
import java.util.Locale;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;
import lombok.extern.slf4j.Slf4j;

/** Matches a bank-imported transaction name against a subscription's Open Banking rule. */
@Slf4j
public final class BankMatchRule {

  private BankMatchRule() {}

  public static boolean matches(Subscription sub, String bankName) {
    String text = sub.getBankMatchText();
    if (text == null || text.isBlank() || bankName == null) return false;
    boolean ignoreCase = sub.isBankMatchIgnoreCase();
    if (!sub.isBankMatchRegex())
      return ignoreCase
          ? bankName.toLowerCase(Locale.ROOT).contains(text.toLowerCase(Locale.ROOT))
          : bankName.contains(text);
    try {
      return compile(text, ignoreCase).matcher(bankName).find();
    } catch (PatternSyntaxException e) {
      // Validated at save time; a bad pattern must never break the sync.
      log.warn("Invalid bank match regex on subscription {}", sub.getId());
      return false;
    }
  }

  /** Normalises a blank text to null and rejects an invalid rule (400 via the handler). */
  public static void validate(Subscription sub) {
    String text = sub.getBankMatchText();
    if (text != null && text.isBlank()) sub.setBankMatchText(text = null);
    if (sub.isBankDriven() && text == null)
      throw new IllegalArgumentException("Date from bank requires a bank match text");
    if (text != null && sub.isBankMatchRegex()) {
      try {
        compile(text, sub.isBankMatchIgnoreCase());
      } catch (PatternSyntaxException e) {
        throw new IllegalArgumentException("Invalid bank match regex: " + e.getDescription());
      }
    }
  }

  private static Pattern compile(String text, boolean ignoreCase) {
    return Pattern.compile(text, ignoreCase ? Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE : 0);
  }
}
