package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.BankConnection;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface BankConnectionRepository extends JpaRepository<BankConnection, UUID> {
  Optional<BankConnection> findByState(String state);

  /** Row lock that serializes concurrent syncs of one connection (cron + on-open). */
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select c from BankConnection c where c.id = :id")
  Optional<BankConnection> findByIdForUpdate(UUID id);

  List<BankConnection> findByWalletId(UUID walletId);

  List<BankConnection> findByCreatedById(UUID userId);

  List<BankConnection> findByStatus(BankConnection.Status status);
}
