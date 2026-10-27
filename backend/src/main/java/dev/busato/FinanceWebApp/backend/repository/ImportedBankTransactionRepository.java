package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.ImportedBankTransaction;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ImportedBankTransactionRepository
    extends JpaRepository<ImportedBankTransaction, UUID> {
  @Query("select i.externalId from ImportedBankTransaction i where i.link.id = :linkId")
  Set<String> findExternalIdsByLinkId(UUID linkId);
}
