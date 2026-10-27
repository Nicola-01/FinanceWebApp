package dev.busato.FinanceWebApp.backend.openbanking;

import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.EbTransaction;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

/** Pure mapping from EnableBanking transaction rows to app transactions. */
@Component
public class BankTransactionMapper {

  public record MappedTx(
      String externalId,
      String name,
      String notes,
      BigDecimal amount,
      String currency,
      Transaction.Type type,
      LocalDate date) {}

  /**
   * Drops non-BOOK rows; order preserved. Callers pass whole days so occurrence indexes are stable.
   */
  public List<MappedTx> map(List<EbTransaction> rows) {
    Map<String, Integer> seen = new HashMap<>();
    List<MappedTx> out = new ArrayList<>();
    for (EbTransaction r : rows) {
      if (!"BOOK".equals(r.status())) continue;
      boolean debit = "DBIT".equals(r.creditDebitIndicator());
      LocalDate date = r.bookingDate() != null ? r.bookingDate() : r.valueDate();
      List<String> rem = r.remittanceInformation() == null ? List.of() : r.remittanceInformation();
      String notes = rem.isEmpty() ? null : String.join("\n", rem);

      String id = r.entryReference() != null ? r.entryReference() : r.transactionId();
      if (id == null) {
        String h =
            sha256(
                String.join(
                    "|",
                    String.valueOf(date == null ? "" : date),
                    r.amount() == null ? "" : r.amount().stripTrailingZeros().toPlainString(),
                    nz(r.currency()),
                    nz(debit ? r.creditorName() : r.debtorName()),
                    String.join(",", rem)));
        id = "h:" + h + ":" + (seen.merge(h, 1, Integer::sum) - 1);
      }

      String name = (debit ? r.creditorName() : r.debtorName());
      if (name == null || name.isBlank()) name = rem.isEmpty() ? null : rem.get(0);
      name = name == null || name.isBlank() ? "Bank transaction" : name.trim();
      if (name.length() > 255) name = name.substring(0, 255);

      out.add(
          new MappedTx(
              id,
              name,
              notes,
              r.amount() == null ? null : r.amount().abs(),
              r.currency(),
              debit ? Transaction.Type.EXPENSE : Transaction.Type.INCOME,
              date));
    }
    return out;
  }

  private static String nz(String s) {
    return s == null ? "" : s;
  }

  private static String sha256(String s) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }
}
