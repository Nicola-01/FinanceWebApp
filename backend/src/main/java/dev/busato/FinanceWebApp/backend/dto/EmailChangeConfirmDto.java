package dev.busato.FinanceWebApp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Body for confirming an email change: the codes received at the current and new addresses. */
@Data
public class EmailChangeConfirmDto {
  @NotBlank private String currentEmailCode;
  @NotBlank private String newEmailCode;
}
