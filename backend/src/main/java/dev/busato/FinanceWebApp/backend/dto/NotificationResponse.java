package dev.busato.FinanceWebApp.backend.dto;

import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** A notification as shown in the in-app notification center. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
  private UUID id;
  private String type;
  private UUID walletId;
  private String title;
  private String body;
  private String url;
  private Instant createdAt;
  private boolean read;
}
