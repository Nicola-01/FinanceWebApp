package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findByNameIgnoreCaseAndWalletId(String tagName,  UUID walletID);
}
