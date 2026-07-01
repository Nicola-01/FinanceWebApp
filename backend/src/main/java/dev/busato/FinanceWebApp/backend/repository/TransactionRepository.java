package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
  List<Transaction> getAllByWalletId(UUID walletID);

  boolean existsByTag(Tag tag);

  Optional<Transaction> findByIdAndWalletId(UUID id, UUID walletId);

  long countByWalletId(UUID walletId);
}
