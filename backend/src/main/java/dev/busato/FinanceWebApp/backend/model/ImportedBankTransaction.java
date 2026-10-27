package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.persistence.UuidV7Generator;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.UuidGenerator;

/**
 * Dedup ledger of bank transactions already imported. References the link only (not the
 * Transaction), so deleting a transaction never makes it re-import.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
    name = "imported_bank_transactions",
    uniqueConstraints = @UniqueConstraint(columnNames = {"link_id", "external_id"}))
public class ImportedBankTransaction {

  @Id
  @UuidGenerator(algorithm = UuidV7Generator.class)
  private UUID id;

  @ManyToOne(optional = false)
  @JoinColumn(name = "link_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  @ToString.Exclude
  private BankAccountLink link;

  @Column(name = "external_id", nullable = false)
  private String externalId;

  @Column(nullable = false)
  private Instant importedAt;
}
