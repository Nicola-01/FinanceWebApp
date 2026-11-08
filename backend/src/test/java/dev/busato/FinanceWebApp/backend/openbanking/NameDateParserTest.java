package dev.busato.FinanceWebApp.backend.openbanking;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class NameDateParserTest {

  static final LocalDate BOOKED = LocalDate.of(2026, 11, 6);

  @Test
  void dottedFourDigitYear() {
    assertThat(NameDateParser.parse("PAGAMENTO POS 12,30 EUR DEL 03.11.2026 A ESSELUNGA", BOOKED))
        .contains(LocalDate.of(2026, 11, 3));
  }

  @Test
  void slashedTwoDigitYear() {
    assertThat(NameDateParser.parse("POS 3/11/26 SHOP", BOOKED))
        .contains(LocalDate.of(2026, 11, 3));
  }

  @Test
  void dashedFourDigitYear() {
    assertThat(NameDateParser.parse("CARD 01-11-2026", BOOKED)).contains(LocalDate.of(2026, 11, 1));
  }

  @Test
  void invalidDateIsSkipped() {
    assertThat(NameDateParser.parse("REF 31.02.2026 PAID 02.11.2026", BOOKED))
        .contains(LocalDate.of(2026, 11, 2));
  }

  @Test
  void dateAfterBookingIsIgnored() {
    assertThat(NameDateParser.parse("POS 07.11.2026", BOOKED)).isEmpty();
  }

  @Test
  void dateMoreThan31DaysBeforeIsIgnored() {
    assertThat(NameDateParser.parse("POS 05.10.2026", BOOKED)).isEmpty();
    assertThat(NameDateParser.parse("POS 06.10.2026", BOOKED)).contains(LocalDate.of(2026, 10, 6));
  }

  @Test
  void firstPlausibleOfSeveral() {
    assertThat(NameDateParser.parse("DUE 10.12.2026 BOUGHT 04.11.2026 AND 05.11.2026", BOOKED))
        .contains(LocalDate.of(2026, 11, 4));
  }

  @Test
  void noDate() {
    assertThat(NameDateParser.parse("ESSELUNGA MILANO", BOOKED)).isEmpty();
    assertThat(NameDateParser.parse(null, BOOKED)).isEmpty();
    assertThat(NameDateParser.parse("  ", BOOKED)).isEmpty();
  }
}
