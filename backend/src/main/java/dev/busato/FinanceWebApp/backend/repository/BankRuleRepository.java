package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.BankRule;
import dev.busato.FinanceWebApp.backend.model.Tag;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BankRuleRepository extends JpaRepository<BankRule, UUID> {
  List<BankRule> findAllByWalletIdOrderByNameAsc(UUID walletId);

  Optional<BankRule> findByIdAndWalletId(UUID id, UUID walletId);

  Optional<BankRule> findByWalletIdAndNameIgnoreCase(UUID walletId, String name);

  boolean existsByTag(Tag tag);

  void deleteAllByWalletId(UUID walletId);
}
