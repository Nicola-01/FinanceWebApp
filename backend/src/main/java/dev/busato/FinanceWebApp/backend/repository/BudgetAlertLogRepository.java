package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.BudgetAlertLog;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetAlertLogRepository extends JpaRepository<BudgetAlertLog, UUID> {
  boolean existsByBudgetIdAndPeriodKeyAndThreshold(UUID budgetId, String periodKey, int threshold);

  void deleteAllByBudgetId(UUID budgetId);
}
