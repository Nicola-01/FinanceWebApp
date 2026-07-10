package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.PushSubscription;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, UUID> {

  /** All subscriptions belonging to a user (fan-out target when sending a push). */
  List<PushSubscription> findAllByUserId(UUID userId);

  /** Lookup by browser endpoint — used to upsert a re-registered device. */
  Optional<PushSubscription> findByEndpoint(String endpoint);

  /** Remove a specific endpoint, but only if it belongs to the given user. */
  void deleteByEndpointAndUserId(String endpoint, UUID userId);

  /** Remove every subscription owned by a user (account deletion). */
  void deleteAllByUserId(UUID userId);
}
