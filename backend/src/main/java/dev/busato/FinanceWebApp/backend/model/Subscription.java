package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.persistence.AssignableUuidV7;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "subscriptions") // Corretto il typo
public class Subscription {

  @Id @AssignableUuidV7 private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "wallet_id", nullable = false)
  private Wallet wallet;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "tag_id")
  private Tag tag;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false, precision = 19, scale = 2)
  private BigDecimal amount;

  private String encryptedAmount;

  @Column(nullable = false, precision = 19, scale = 2)
  private BigDecimal originalAmount;

  @Column(precision = 19, scale = 6)
  private BigDecimal exchangeValue;

  private String originalCurrency;

  private boolean autoExchangeRate;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Type type;

  public enum Type {
    INCOME,
    EXPENSE
  }

  @Column(columnDefinition = "TEXT")
  private String notes;

  // --- REGOLE DI SCHEDULAZIONE (Core del Cron Job) ---

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Status status; // Per poter mettere in pausa un abbonamento

  public enum Status {
    ACTIVE,
    PAUSED,
    COMPLETED
  }

  @Column(nullable = false)
  private LocalDate startDate; // Quando inizia

  @Column(nullable = false)
  private LocalDate nextExecutionDate; // IL CAMPO PIÙ IMPORTANTE: Il job legge questo!

  private LocalDate lastExecutionDate; // Per lo storico

  // --- REGOLE DI FREQUENZA ---

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Frequency frequencyType;

  public enum Frequency {
    DAILY,
    WEEKLY,
    MONTHLY,
    YEARLY
  }

  @Column(nullable = false)
  @Builder.Default
  private int frequencyInterval = 1; // "Ogni N" (es. 1 = ogni mese, 2 = ogni 2 settimane)

  // Opzioni avanzate (popolate solo se la logica lo richiede)
  private Integer monthlySpecificDay; // es. 24 (esegui il 24 di ogni mese)
  private boolean lastWorkingDayOfMonth; // es. true (esegui l'ultimo giorno feriale del mese)

  // --- LIMITI DI DURATA (Ottima la tua intuizione qui!) ---

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Duration duration;

  public enum Duration {
    FOREVER,
    TIMES,
    UNTIL
  }

  private Integer durationTimes; // Es: ripeti per 12 volte

  @Builder.Default private int executedTimes = 0; // Contatore: quante volte è GIA' stato eseguito

  private LocalDate durationUntil; // Es: ripeti fino al 31-12-2026

  @OneToMany(mappedBy = "subscription", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
  @OrderBy("transactionDate DESC")
  @Builder.Default
  private List<Transaction> history = new ArrayList<>();

  /** Server-side last-write timestamp; optimistic precondition for offline replays. */
  @UpdateTimestamp @Column private Instant updatedAt;
}
