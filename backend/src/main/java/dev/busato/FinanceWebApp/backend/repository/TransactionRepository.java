package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
  List<Transaction> getAllByWalletId(UUID walletID);

  boolean existsByTag(Tag tag);

  Optional<Transaction> findByIdAndWalletId(UUID id, UUID walletId);

  boolean existsByIdAndWalletId(UUID id, UUID walletId);

  long countByWalletId(UUID walletId);

  @Query(
      """
      SELECT COALESCE(SUM(t.amount), 0)
      FROM Transaction t
      WHERE t.wallet.id = :walletId
        AND t.type = :type
        AND t.transactionDate BETWEEN :from AND :to
      """)
  BigDecimal sumAmountByWalletAndDateRange(
      @Param("walletId") UUID walletId,
      @Param("type") Transaction.Type type,
      @Param("from") LocalDate from,
      @Param("to") LocalDate to);

  @Query(
      """
      SELECT COALESCE(SUM(t.amount), 0)
      FROM Transaction t
      WHERE t.wallet.id = :walletId
        AND t.type = :type
        AND t.transactionDate BETWEEN :from AND :to
        AND t.tag.id IN :tagIds
      """)
  BigDecimal sumAmountByWalletAndDateRangeAndTags(
      @Param("walletId") UUID walletId,
      @Param("type") Transaction.Type type,
      @Param("from") LocalDate from,
      @Param("to") LocalDate to,
      @Param("tagIds") Collection<UUID> tagIds);
}
