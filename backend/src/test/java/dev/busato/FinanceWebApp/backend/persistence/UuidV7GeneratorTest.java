package dev.busato.FinanceWebApp.backend.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.UUID;
import org.junit.jupiter.api.Test;

class UuidV7GeneratorTest {

  private final UuidV7Generator generator = new UuidV7Generator();

  @Test
  void generatesVersion7WithRfcVariant() {
    UUID id = generator.generateUuid(null);
    assertEquals(7, id.version(), "must be a UUID version 7");
    assertEquals(2, id.variant(), "must use the RFC 4122/9562 variant");
  }

  @Test
  void generatesDistinctValues() {
    UUID a = generator.generateUuid(null);
    UUID b = generator.generateUuid(null);
    assertNotEquals(a, b);
  }

  @Test
  void generatesTimeOrderedValues() {
    // v7 embeds a 48-bit Unix-millis prefix in the most significant bits, so sequentially
    // generated ids are non-decreasing when compared unsigned.
    UUID a = generator.generateUuid(null);
    UUID b = generator.generateUuid(null);
    assertTrue(
        Long.compareUnsigned(a.getMostSignificantBits(), b.getMostSignificantBits()) <= 0,
        "later id should sort at or after the earlier one");
  }
}
