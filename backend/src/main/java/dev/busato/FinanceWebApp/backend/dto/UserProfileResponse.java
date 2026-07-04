package dev.busato.FinanceWebApp.backend.dto;

import java.time.LocalDate;
import java.util.UUID;
import lombok.Builder;
import lombok.Data;

/**
 * Current-user profile for the account settings page. The {@code email} is masked server-side (see
 * {@code UserMapper#toProfileResponse}) so the full address is never sent to the client.
 */
@Data
@Builder
public class UserProfileResponse {
  private UUID id;
  private String username;
  private String email; // masked (e.g. n***a@example.com)
  private String role;
  private LocalDate createdAt;
}
