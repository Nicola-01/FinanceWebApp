package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.EmailChangeRequest;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public interface EmailChangeRequestRepository extends JpaRepository<EmailChangeRequest, UUID> {

  /** Loads the (single) pending email change for a user, if any. */
  Optional<EmailChangeRequest> findByUserId(UUID userId);

  /**
   * Removes any pending email change for a user. Annotated so the derived delete runs in its own
   * read-write transaction even when called from a non-transactional service method.
   */
  @Transactional
  void deleteByUserId(UUID userId);
}
