package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.BankConnection;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface BankConnectionRepository extends JpaRepository<BankConnection, UUID> {
  Optional<BankConnection> findByState(String state);

  /** Row lock that serializes concurrent syncs of one connection (cron + on-open). */
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select c from BankConnection c where c.id = :id")
  Optional<BankConnection> findByIdForUpdate(UUID id);

  /** Single-use consumption of an authorization state; returns the number of rows cleared. */
  @Modifying
  @Query("update BankConnection c set c.state = null where c.id = :id and c.state = :state")
  int clearState(UUID id, String state);

  List<BankConnection> findByWalletId(UUID walletId);

  List<BankConnection> findByCreatedById(UUID userId);

  List<BankConnection> findByStatus(BankConnection.Status status);

  /** Eagerly loads what the cron job reads, since it runs outside any transaction. */
  @EntityGraph(attributePaths = {"accounts", "wallet", "createdBy"})
  List<BankConnection> findDetailedByStatus(BankConnection.Status status);

  @Modifying
  @Transactional
  @Query("update BankConnection c set c.expiryWarnedAt = :at where c.id = :id")
  void markExpiryWarned(UUID id, Instant at);
}
