package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> getAllByWalletId(UUID walletID);
}
