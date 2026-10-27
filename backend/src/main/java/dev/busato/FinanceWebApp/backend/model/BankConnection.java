package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.persistence.UuidV7Generator;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

/** An Open Banking (EnableBanking) session linking a wallet to a bank. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bank_connections")
public class BankConnection {

  @Id
  @UuidGenerator(algorithm = UuidV7Generator.class)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "wallet_id", nullable = false)
  @ToString.Exclude
  private Wallet wallet;

  @ManyToOne(optional = false)
  @JoinColumn(name = "created_by", nullable = false)
  @ToString.Exclude
  private User createdBy;

  private String aspspName;
  private String aspspCountry;

  /** Null while PENDING. */
  private String sessionId;

  /** Random UUID for the authorization round-trip. */
  @Column(unique = true)
  private String state;

  private Instant validUntil;

  /** Import start date chosen by the user; copied to each link once the session is created. */
  private LocalDate importFrom;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Status status;

  private String lastError;
  private Instant expiryWarnedAt;

  @CreationTimestamp
  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @Builder.Default
  @OneToMany(mappedBy = "connection", cascade = CascadeType.ALL, orphanRemoval = true)
  @ToString.Exclude
  @EqualsAndHashCode.Exclude
  private List<BankAccountLink> accounts = new ArrayList<>();

  public enum Status {
    PENDING,
    ACTIVE,
    EXPIRED,
    PAUSED,
    ERROR
  }
}
