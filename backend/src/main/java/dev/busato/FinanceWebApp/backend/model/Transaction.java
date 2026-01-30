package dev.busato.FinanceWebApp.backend.model;


import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@NoArgsConstructor
@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id ;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;

    // Se nullo, è una transazione senza categoria (da categorizzare)
    @ManyToOne
    @JoinColumn(name = "tag_id")
    private Tag tag;

    @Column(nullable = false)
    private BigDecimal amount; // In wallet Value (EUR)

    private BigDecimal originalAmount; // Es. 10.50
    private String originalCurrency;   // Es. USD

    @Enumerated(EnumType.STRING)
    private Type type; // INCOME, EXPENSE

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private LocalDate transactionDate;

    @PrePersist
    void onCreate() {
        if (transactionDate == null)
            transactionDate = LocalDate.now();
    }


    public enum Type { INCOME, EXPENSE }
}
