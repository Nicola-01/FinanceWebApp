package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.Subscription;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
  List<Subscription> findAllByWalletId(UUID walletId);

  Optional<Subscription> findByIdAndWalletId(UUID id, UUID walletId);

  boolean existsByIdAndWalletId(UUID id, UUID walletId);

  List<Subscription> findAllByStatusAndNextExecutionDateLessThanEqual(
      Subscription.Status status, LocalDate date);

  List<Subscription> findAllByStatusInAndNextExecutionDateLessThanEqual(
      List<Subscription.Status> statuses, LocalDate date);

  /**
   * Deletes every subscription of a wallet (subscriptions are not part of the {@code Wallet} entity
   * cascade, so they must be removed explicitly before the wallet is deleted).
   */
  void deleteAllByWalletId(UUID walletId);
}
