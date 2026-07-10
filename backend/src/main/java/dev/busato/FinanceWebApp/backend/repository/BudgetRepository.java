package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.Budget;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, UUID> {
  List<Budget> findAllByWalletId(UUID walletId);

  Optional<Budget> findByIdAndWalletId(UUID id, UUID walletId);

  /** All budgets with wallet and tag eagerly loaded — used by the alerts cron job. */
  @Query("SELECT b FROM Budget b JOIN FETCH b.wallet LEFT JOIN FETCH b.tag")
  List<Budget> findAllWithWalletAndTag();
}
