package dev.busato.FinanceWebApp.backend.dto;

import jakarta.validation.constraints.NotBlank;
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
}
