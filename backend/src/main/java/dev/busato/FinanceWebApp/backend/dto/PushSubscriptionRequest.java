package dev.busato.FinanceWebApp.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** A browser push subscription registered for THIS device. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PushSubscriptionRequest {

  @NotBlank private String endpoint;

  @NotBlank private String p256dh;

  @NotBlank private String auth;

  private String userAgent;
}
