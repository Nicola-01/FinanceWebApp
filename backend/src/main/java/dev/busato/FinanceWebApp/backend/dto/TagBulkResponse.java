package dev.busato.FinanceWebApp.backend.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

/**
 * Structured result of a bulk tag upsert. Tags that did not previously exist (matched by
 * case-insensitive name within the wallet) are reported in {@code created}; tags whose name already
 * existed and whose attributes were refreshed are reported in {@code updated}.
 */
@Data
@Builder
public class TagBulkResponse {
  private List<TagResponse> created;
  private List<TagResponse> updated;
}
