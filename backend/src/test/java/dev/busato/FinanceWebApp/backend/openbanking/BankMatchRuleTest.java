package dev.busato.FinanceWebApp.backend.openbanking;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;
import static org.junit.jupiter.api.Assertions.assertTrue;

import dev.busato.FinanceWebApp.backend.model.Subscription;
import java.time.Duration;
import org.junit.jupiter.api.Test;

class BankMatchRuleTest {

  private static Subscription rule(String text, boolean regex, boolean ignoreCase) {
    return Subscription.builder()
        .bankMatchText(text)
        .bankMatchRegex(regex)
        .bankMatchIgnoreCase(ignoreCase)
        .build();
  }

  @Test
  void matches_plainContains_ignoreCase() {
    assertTrue(BankMatchRule.matches(rule("netflix", false, true), "NETFLIX.COM 123"));
  }

  @Test
  void matches_plain_caseSensitive() {
    assertFalse(BankMatchRule.matches(rule("netflix", false, false), "NETFLIX.COM 123"));
    assertTrue(BankMatchRule.matches(rule("NETFLIX", false, false), "NETFLIX.COM 123"));
  }

  @Test
  void matches_regex_find() {
    assertTrue(BankMatchRule.matches(rule("^SPOTIFY\\s+P\\d+", true, true), "SPOTIFY P3A9"));
  }

  @Test
  void matches_regex_caseSensitive_false() {
    assertFalse(BankMatchRule.matches(rule("^spotify", true, false), "SPOTIFY P3A9"));
  }

  @Test
  void matches_dotStar_matchesAnyName() {
    assertTrue(BankMatchRule.matches(rule(".*", true, true), "anything"));
  }

  @Test
  void matches_nullName_false() {
    assertFalse(BankMatchRule.matches(rule("x", false, true), null));
    assertFalse(BankMatchRule.matches(rule(".*", true, true), null));
  }

  @Test
  void matches_blankText_false() {
    assertFalse(BankMatchRule.matches(rule("  ", false, true), "NETFLIX"));
    assertFalse(BankMatchRule.matches(rule(null, false, true), "NETFLIX"));
  }

  @Test
  void matches_invalidRegex_false() {
    assertFalse(BankMatchRule.matches(rule("([", true, true), "NETFLIX"));
  }

  @Test
  void validate_invalidRegex_throws() {
    IllegalArgumentException e =
        assertThrows(
            IllegalArgumentException.class, () -> BankMatchRule.validate(rule("([", true, true)));
    assertTrue(e.getMessage().startsWith("Invalid bank match regex"));
  }

  @Test
  void validate_bankDrivenWithoutText_throws() {
    Subscription s = rule("  ", false, true);
    s.setBankDriven(true);
    IllegalArgumentException e =
        assertThrows(IllegalArgumentException.class, () -> BankMatchRule.validate(s));
    assertEquals("Date from bank requires a bank match text", e.getMessage());
    assertNull(s.getBankMatchText());
  }

  @Test
  void validate_validRule_ok() {
    Subscription s = rule("NETFLIX", true, true);
    BankMatchRule.validate(s);
    assertEquals("NETFLIX", s.getBankMatchText());
  }

  @Test
  void matches_catastrophicRegex_givesUpAsNoMatch() {
    String name = "a".repeat(40) + "!";
    assertTimeoutPreemptively(
        Duration.ofSeconds(2),
        () -> assertFalse(BankMatchRule.matches(rule("(.*a){12}$", true, true), name)));
  }

  @Test
  void validate_tooLongText_throws() {
    IllegalArgumentException e =
        assertThrows(
            IllegalArgumentException.class,
            () -> BankMatchRule.validate(rule("x".repeat(201), false, true)));
    assertEquals("Bank match text must be at most 200 characters", e.getMessage());
  }
}
