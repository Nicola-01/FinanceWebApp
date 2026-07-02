package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.persistence.UuidV7Generator;
import jakarta.persistence.*;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
    name = "tags",
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uk_tag_wallet_name",
          columnNames = {"wallet_id", "name"})
    })
public class Tag {

  @Id
  @UuidGenerator(algorithm = UuidV7Generator.class)
  private UUID id;

  @Column(nullable = false)
  private String name;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "wallet_id", nullable = false)
  private Wallet wallet;

  private String icon;
  private String colorHex;

  //    private String description;

  @ManyToOne
  @JoinColumn(name = "parent_id")
  private Tag parent;
}
