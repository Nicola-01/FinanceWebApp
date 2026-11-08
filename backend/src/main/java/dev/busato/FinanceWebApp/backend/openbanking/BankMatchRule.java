package dev.busato.FinanceWebApp.backend.openbanking;

import dev.busato.FinanceWebApp.backend.model.BankRule;
import java.util.Locale;
import java.util.regex.Pattern;
import java.util.regex.PatternSyntaxException;
import lombok.extern.slf4j.Slf4j;

/** Matches a bank-imported transaction name against a subscription's Open Banking rule. */
@Slf4j
public final class BankMatchRule {

  static final int MAX_TEXT_LENGTH = 200;
  static final int MAX_NAME_LENGTH = 50;
  static final int MAX_RENAME_LENGTH = 100;

  /** A user regex gets this long per bank row; past it the row is treated as no match. */
  static final long REGEX_BUDGET_NANOS = 50_000_000L;

  private BankMatchRule() {}

  /** Thrown from charAt once the regex budget is spent (stops catastrophic backtracking). */
  private static final class RegexTimeout extends RuntimeException {
    RegexTimeout() {
      super(null, null, false, false);
    }
  }

  private record Deadline(CharSequence s, long until) implements CharSequence {
    @Override
    public char charAt(int i) {
      if (System.nanoTime() > until) throw new RegexTimeout();
      return s.charAt(i);
    }

    @Override
    public int length() {
      return s.length();
    }

    @Override
    public CharSequence subSequence(int start, int end) {
      return new Deadline(s.subSequence(start, end), until);
    }

    @Override
    public String toString() {
      return s.toString();
    }
  }

  public static boolean matches(BankRule rule, String bankName) {
    return matches(
        rule.getMatchText(), rule.isRegex(), rule.isIgnoreCase(), bankName, rule.getId());
  }

  private static boolean matches(
      String text, boolean regex, boolean ignoreCase, String bankName, Object owner) {
    if (text == null || text.isBlank() || bankName == null) return false;
    if (!regex)
      return ignoreCase
          ? bankName.toLowerCase(Locale.ROOT).contains(text.toLowerCase(Locale.ROOT))
          : bankName.contains(text);
    try {
      return compile(text, ignoreCase)
          .matcher(new Deadline(bankName, System.nanoTime() + REGEX_BUDGET_NANOS))
          .find();
    } catch (RegexTimeout e) {
      log.warn("Bank match regex timed out on {}", owner);
      return false;
    } catch (PatternSyntaxException e) {
      // Validated at save time; a bad pattern must never break the sync.
      log.warn("Invalid bank match regex on {}", owner);
      return false;
    }
  }

  /** Trims and normalises a rule, rejecting an invalid one. */
  public static void validate(BankRule rule) {
    String name = rule.getName() == null ? "" : rule.getName().trim();
    if (name.isEmpty() || name.length() > MAX_NAME_LENGTH)
      throw new IllegalArgumentException("Rule name must be 1-" + MAX_NAME_LENGTH + " characters");
    rule.setName(name);
    String text = rule.getMatchText() == null ? "" : rule.getMatchText().trim();
    if (text.isEmpty()) throw new IllegalArgumentException("Bank match text is required");
    if (text.length() > MAX_TEXT_LENGTH)
      throw new IllegalArgumentException(
          "Bank match text must be at most " + MAX_TEXT_LENGTH + " characters");
    rule.setMatchText(text);
    String rename = rule.getRenameTo() == null ? "" : rule.getRenameTo().trim();
    if (rename.length() > MAX_RENAME_LENGTH)
      throw new IllegalArgumentException(
          "Rename must be at most " + MAX_RENAME_LENGTH + " characters");
    rule.setRenameTo(rename.isEmpty() ? null : rename);
    if (rule.isRegex()) {
      try {
        compile(text, rule.isIgnoreCase());
      } catch (PatternSyntaxException e) {
        throw new IllegalArgumentException("Invalid bank match regex: " + e.getDescription());
      }
    }
  }

  private static Pattern compile(String text, boolean ignoreCase) {
    return Pattern.compile(text, ignoreCase ? Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE : 0);
  }
}
