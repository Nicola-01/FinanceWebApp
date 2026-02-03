package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletAccessRepository extends JpaRepository<WalletAccess, WalletAccess.WalletAccessId> {
    List<WalletAccess> findAllByUserId(UUID uuid);
    Optional<WalletAccess> findByUserIdAndWalletId(UUID userID, UUID walletID);
}