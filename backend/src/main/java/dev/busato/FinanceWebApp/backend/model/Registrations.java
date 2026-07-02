package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.persistence.UuidV7Generator;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

@Entity
@Table(name = "registrations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Registrations {

  @Id
  @UuidGenerator(algorithm = UuidV7Generator.class)
  private UUID id;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(nullable = false, unique = true)
  private String token;

  @Column(nullable = false)
  private LocalDateTime expiresAt;

  private String note;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private InvitationStatus status;

  @CreationTimestamp
  @Column(updatable = false)
  private LocalDateTime createdAt;

  public enum InvitationStatus {
    PENDING,
    ACCEPTED,
    REVOKED,
    FORGOTPASSWORD
  }
}
