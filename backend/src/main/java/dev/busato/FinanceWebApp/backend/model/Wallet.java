package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.persistence.UuidV7Generator;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "wallets")
public class Wallet {

  @Id
  @UuidGenerator(algorithm = UuidV7Generator.class)
  private UUID id;

  @Column(nullable = false)
  private String name;

  private String color;
  private String icon;

  @OneToMany(mappedBy = "wallet", cascade = CascadeType.ALL, orphanRemoval = true)
  @Builder.Default
  private List<WalletAccess> accesses = new ArrayList<>();

  @OneToMany(mappedBy = "wallet", cascade = CascadeType.ALL, orphanRemoval = true)
  @Builder.Default
  private List<Tag> tags = new ArrayList<>();

  @OneToMany(mappedBy = "wallet", cascade = CascadeType.ALL, orphanRemoval = true)
  @Builder.Default
  private List<Transaction> transactions = new ArrayList<>();

  @Builder.Default private String currency = "EUR";

  @CreationTimestamp
  @Column(updatable = false)
  private LocalDate createdAt;

  private boolean encryptedWallet = false;
}
