package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WalletAccessRepository
    extends JpaRepository<WalletAccess, WalletAccess.WalletAccessId> {
  @EntityGraph(attributePaths = {"wallet"})
  List<WalletAccess> findAllByUserId(UUID uuid);

  List<WalletAccess> findAllByWalletId(UUID walletId);

  Optional<WalletAccess> findByUserIdAndWalletId(UUID userID, UUID walletID);

  List<WalletAccess> findAllByUserIdAndStatus(
      UUID userId, WalletAccess.InvitationStatus invitationStatus);

  Optional<WalletAccess> findByWalletIdAndUserIdAndRole(
      UUID walletId, UUID userId, WalletAccess.WalletRole role);

  Optional<WalletAccess> findByWalletIdAndUserId(UUID walletId, UUID userId);

  boolean existsByWalletIdAndUserId(UUID walletId, UUID userId);

  boolean existsByWalletIdAndUserIdAndStatusIn(
      UUID walletId, UUID userId, WalletAccess.InvitationStatus[] statuses);

  boolean existsByWalletIdAndUserIdAndStatusInAndUpdatedAtAfter(
      UUID walletId,
      UUID userId,
      Collection<WalletAccess.InvitationStatus> statuses,
      LocalDate date);

  Optional<WalletAccess> findByWalletIdAndRole(UUID walletId, WalletAccess.WalletRole role);
}
