package dev.busato.FinanceWebApp.backend.dto;

import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TagResponse {
  private String name;
  private String icon;
  private String colorHex;
  //    private String description;
  private String parentName;
  private Instant updatedAt;
}
