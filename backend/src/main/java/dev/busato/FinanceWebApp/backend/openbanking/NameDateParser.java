package dev.busato.FinanceWebApp.backend.openbanking;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Reads the real purchase date some banks write in the description (day first, Italian order). */
public final class NameDateParser {

  private static final Pattern DATE =
      Pattern.compile("(?<!\\d)(\\d{1,2})[./-](\\d{1,2})[./-](\\d{4}|\\d{2})(?!\\d)");

  /** A late booking is plausible up to this many days after the purchase. */
  static final int MAX_DAYS_BEFORE = 31;

  private NameDateParser() {}

  /** First valid date in {@code name} within [bookingDate - 31 days, bookingDate]. */
  public static Optional<LocalDate> parse(String name, LocalDate bookingDate) {
    if (name == null || name.isBlank()) return Optional.empty();
    Matcher m = DATE.matcher(name);
    while (m.find()) {
      int year = Integer.parseInt(m.group(3));
      if (m.group(3).length() == 2) year += 2000;
      LocalDate d;
      try {
        d = LocalDate.of(year, Integer.parseInt(m.group(2)), Integer.parseInt(m.group(1)));
      } catch (DateTimeException e) {
        continue; // e.g. 31.02
      }
      if (!d.isAfter(bookingDate) && !d.isBefore(bookingDate.minusDays(MAX_DAYS_BEFORE)))
        return Optional.of(d);
    }
    return Optional.empty();
  }
}
