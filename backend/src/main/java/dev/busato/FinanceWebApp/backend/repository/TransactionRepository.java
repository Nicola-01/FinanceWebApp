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

  /** Bank imports still "To categorise" (on the wallet's placeholder tag). */
  List<Transaction> findAllByWalletIdAndImportedTrueAndTagPlaceholderTrue(UUID walletId);

  Optional<Transaction> findByIdAndWalletId(UUID id, UUID walletId);

  /** Manual (or subscription-generated) rows a bank import may merge into. */
  List<Transaction> findAllByWalletIdAndTransactionDateAndTypeAndImportedFalse(
      UUID walletId, LocalDate transactionDate, Transaction.Type type);

  List<Transaction> findAllBySubscriptionIdAndTransactionDateBetween(
      UUID subscriptionId, LocalDate from, LocalDate to);

  boolean existsByIdAndWalletId(UUID id, UUID walletId);

  long countByWalletId(UUID walletId);

  long countByBankRuleId(UUID bankRuleId);

  /** Per-rule transaction counts for one wallet; rules with no rows are absent from the result. */
  @Query(
      """
      SELECT t.bankRuleId AS ruleId, COUNT(t) AS total
      FROM Transaction t
      WHERE t.wallet.id = :walletId
        AND t.bankRuleId IS NOT NULL
      GROUP BY t.bankRuleId
      """)
  List<Object[]> countByBankRule(@Param("walletId") UUID walletId);

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
