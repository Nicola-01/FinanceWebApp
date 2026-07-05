package dev.busato.FinanceWebApp.backend.dto;

import lombok.Data;

/** Password confirmation body for the irreversible self-service account deletion. */
@Data
public class DeleteAccountRequest {
  private String password;
}
