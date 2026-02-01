package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WalletAccessRepository extends JpaRepository<WalletAccess, WalletAccess.WalletAccessId> {

    List<WalletAccess> findByUserId(UUID uuid);
}