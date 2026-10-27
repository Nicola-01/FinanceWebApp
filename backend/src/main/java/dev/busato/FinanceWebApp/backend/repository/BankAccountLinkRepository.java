package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.BankAccountLink;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BankAccountLinkRepository extends JpaRepository<BankAccountLink, UUID> {
  List<BankAccountLink> findByConnectionWalletId(UUID walletId);
}
