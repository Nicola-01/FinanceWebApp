package dev.busato.FinanceWebApp.backend.dto;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

/** Body of the fill-amount call for a pending transaction ({@code amountPending = true}). */
@Data
@Builder
public class TransactionFillRequest {
  /** Amount in the transaction's original currency (wallet currency when none is set). */
  private BigDecimal originalAmount;
}
