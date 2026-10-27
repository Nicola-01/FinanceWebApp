package dev.busato.FinanceWebApp.backend.openbanking;

import static org.junit.jupiter.api.Assertions.*;

import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.openbanking.BankTransactionMapper.MappedTx;
import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.EbTransaction;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class BankTransactionMapperTest {

  private final BankTransactionMapper mapper = new BankTransactionMapper();

  private EbTransaction row(
      String entry, String tid, String ind, String status, String creditor, List<String> rem) {
    return new EbTransaction(
        entry,
        tid,
        new BigDecimal("12.50"),
        "EUR",
        ind,
        status,
        LocalDate.of(2026, 1, 5),
        null,
        creditor,
        "Mario",
        rem);
  }

  @Test
  void pendingRowsDropped() {
    var out =
        mapper.map(
            List.of(
                row("A", null, "DBIT", "BOOK", "X", null),
                row("B", null, "DBIT", "PDNG", "X", null)));
    assertEquals(1, out.size());
  }

  @Test
  void prefersEntryReference() {
    assertEquals(
        "E1", mapper.map(List.of(row("E1", "T1", "DBIT", "BOOK", "X", null))).get(0).externalId());
  }

  @Test
  void occurrenceIndexDistinguishesIdenticalRows() {
    var rows =
        List.of(
            row(null, null, "DBIT", "BOOK", "X", List.of("a")),
            row(null, null, "DBIT", "BOOK", "X", List.of("a")));
    var out = mapper.map(rows);
    assertNotEquals(out.get(0).externalId(), out.get(1).externalId());
    assertTrue(out.get(0).externalId().endsWith(":0"));
    assertTrue(out.get(1).externalId().endsWith(":1"));
    assertEquals(out, mapper.map(rows));
  }

  @Test
  void debitUsesCreditorAsName() {
    MappedTx t =
        mapper.map(List.of(row("A", null, "DBIT", "BOOK", " ESSELUNGA MILANO ", null))).get(0);
    assertEquals("ESSELUNGA MILANO", t.name());
    assertEquals(Transaction.Type.EXPENSE, t.type());
    assertEquals(new BigDecimal("12.50"), t.amount());
    assertEquals(LocalDate.of(2026, 1, 5), t.date());
  }

  @Test
  void creditUsesDebtorAndAbsAmount() {
    var r =
        new EbTransaction(
            "A",
            null,
            new BigDecimal("-3"),
            "EUR",
            "CRDT",
            "BOOK",
            null,
            LocalDate.of(2026, 2, 1),
            "C",
            "Mario",
            null);
    MappedTx t = mapper.map(List.of(r)).get(0);
    assertEquals("Mario", t.name());
    assertEquals(Transaction.Type.INCOME, t.type());
    assertEquals(new BigDecimal("3"), t.amount());
    assertEquals(LocalDate.of(2026, 2, 1), t.date());
  }

  @Test
  void fallsBackToRemittanceThenDefault() {
    assertEquals(
        "line1",
        mapper
            .map(List.of(row("A", null, "DBIT", "BOOK", null, List.of("line1", "line2"))))
            .get(0)
            .name());
    assertEquals(
        "line1\nline2",
        mapper
            .map(List.of(row("A", null, "DBIT", "BOOK", null, List.of("line1", "line2"))))
            .get(0)
            .notes());
    MappedTx t = mapper.map(List.of(row("A", null, "DBIT", "BOOK", " ", null))).get(0);
    assertEquals("Bank transaction", t.name());
    assertNull(t.notes());
  }

  @Test
  void hashIgnoresAmountScale() {
    var a = row(null, null, "DBIT", "BOOK", "X", null);
    var b =
        new EbTransaction(
            null,
            null,
            new BigDecimal("12.5"),
            "EUR",
            "DBIT",
            "BOOK",
            LocalDate.of(2026, 1, 5),
            null,
            "X",
            "Mario",
            null);
    assertEquals(
        mapper.map(List.of(a)).get(0).externalId(), mapper.map(List.of(b)).get(0).externalId());
  }
}
