package dev.busato.FinanceWebApp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TagRequest {
  @NotBlank(message = "Name is required")
  private String name;

  private String icon;
  private String colorHex;
  //    private String description;
  private String parentName;

  /** updatedAt the offline edit was based on; server rejects with 409 if newer. */
  private Instant baseUpdatedAt;
}
