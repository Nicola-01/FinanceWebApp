package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.BankConnection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BankConnectionRepository extends JpaRepository<BankConnection, UUID> {
  Optional<BankConnection> findByState(String state);

  List<BankConnection> findByWalletId(UUID walletId);

  List<BankConnection> findByCreatedById(UUID userId);

  List<BankConnection> findByStatus(BankConnection.Status status);
}
