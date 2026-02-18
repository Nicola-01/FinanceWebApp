package dev.busato.FinanceWebApp.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "wallets")
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id ;

    @Column(nullable = false)
    private String name;

    private String color;
    private String icon;

    @OneToMany(mappedBy = "wallet", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WalletAccess> accesses = new ArrayList<>();

    @OneToMany(mappedBy = "wallet")
    @Builder.Default
    private List<Tag> tags = new ArrayList<>();

    @Builder.Default
    private String currency = "EUR"; // Default

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDate createdAt;
}