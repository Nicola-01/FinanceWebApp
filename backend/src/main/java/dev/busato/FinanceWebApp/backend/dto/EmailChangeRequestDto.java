package dev.busato.FinanceWebApp.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Body for starting an email change: the address the user wants to switch to. */
@Data
public class EmailChangeRequestDto {
  @NotBlank @Email private String newEmail;
}
