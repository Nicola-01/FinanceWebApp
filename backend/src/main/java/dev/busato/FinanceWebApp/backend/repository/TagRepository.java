package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.Tag;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface TagRepository extends JpaRepository<Tag, UUID> {
  List<Tag> getTagsByWalletId(UUID walletId);

  List<Tag> getTagsByWalletIdAndPlaceholderFalse(UUID walletId);

  List<Tag> getTagsByWalletIdIn(List<UUID> walletIds);

  Optional<Tag> findByNameIgnoreCaseAndWalletId(String tagName, UUID walletID);

  boolean existsByNameIgnoreCaseAndWalletId(String name, UUID walletId);

  boolean existsByParent(Tag parent);

  /** One-shot upgrade of the review tags auto-created before the placeholder flag existed. */
  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Transactional
  @Query(
      "update Tag t set t.placeholder = true, t.name = :name"
          + " where lower(t.name) = lower(:legacyName) and t.placeholder = false")
  int upgradeLegacyPlaceholders(String legacyName, String name);
}
