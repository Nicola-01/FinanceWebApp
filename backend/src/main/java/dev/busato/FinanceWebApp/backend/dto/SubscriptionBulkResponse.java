package dev.busato.FinanceWebApp.backend.dto;

import java.util.List;
import lombok.Builder;
import lombok.Data;

/**
 * Structured result of a bulk subscription upsert. Newly inserted rows are reported in {@code
 * created}; rows that matched an existing subscription (same tag + start date) and overwrote its
 * mutable fields are reported in {@code updated}. Any tags that had to be auto-created to satisfy a
 * row's tag reference are reported once each in {@code autoCreatedTags}.
 */
@Data
@Builder
public class SubscriptionBulkResponse {
  private List<SubscriptionResponse> created;
  private List<SubscriptionResponse> updated;
  private List<TagResponse> autoCreatedTags;
}
