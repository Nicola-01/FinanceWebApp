package dev.busato.FinanceWebApp.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WalletTagsResponse {
  private WalletResponse wallet;
  private java.util.List<TagResponse> tags;
}
