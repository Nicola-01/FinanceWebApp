package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.Tag;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {
  List<Tag> getTagsByWalletId(UUID walletId);

  List<Tag> getTagsByWalletIdIn(List<UUID> walletIds);

  Optional<Tag> findByNameIgnoreCaseAndWalletId(String tagName, UUID walletID);

  boolean existsByNameIgnoreCaseAndWalletId(String name, UUID walletId);

  boolean existsByParent(Tag parent);
}
