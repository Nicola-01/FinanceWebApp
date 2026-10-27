package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.persistence.UuidV7Generator;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

/** One bank account exposed by a {@link BankConnection}. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bank_account_links")
public class BankAccountLink {

  @Id
  @UuidGenerator(algorithm = UuidV7Generator.class)
  private UUID id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "connection_id", nullable = false)
  @ToString.Exclude
  @EqualsAndHashCode.Exclude
  private BankConnection connection;

  /** Session-scoped: replaced on every renew. */
  private String accountUid;

  /** Stable across sessions; the key used to re-match the account on renew. */
  private String identificationHash;

  private String displayName;

  /** Masked for display, e.g. "IT•••• 1234". */
  private String maskedIban;

  private String currency;
  private LocalDate importFrom;
  private Instant lastSyncedAt;

  /** Last bank call for this link, successful or not: the base of every sync throttle. */
  private Instant lastAttemptAt;

  /** Earliest date of rows skipped for a missing FX rate; the next sync refetches from here. */
  private LocalDate retryFrom;

  @Builder.Default private int importedCount = 0;
}
