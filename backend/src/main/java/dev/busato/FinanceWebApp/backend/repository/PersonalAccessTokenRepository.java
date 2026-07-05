package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.PersonalAccessToken;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PersonalAccessTokenRepository extends JpaRepository<PersonalAccessToken, UUID> {

  /**
   * Lookup by SHA-256 hash for token validation — eagerly loads the User to avoid
   * LazyInitializationException
   */
  @EntityGraph(attributePaths = {"user"})
  Optional<PersonalAccessToken> findByTokenHash(String tokenHash);

  /** List all tokens belonging to a user */
  List<PersonalAccessToken> findAllByUserId(UUID userId);

  /** Revoke a specific token owned by a specific user */
  void deleteByIdAndUserId(UUID id, UUID userId);

  /** Fetch a specific token by ID and User ID for secure updating */
  Optional<PersonalAccessToken> findByIdAndUserId(UUID id, UUID userId);

  /** Revoke all tokens owned by a specific user */
  void deleteAllByUserId(UUID userId);

  /** Bulk-revoke tokens by ID, restricted to those owned by the given user. */
  void deleteAllByIdInAndUserId(Collection<UUID> ids, UUID userId);

  /** Fetch tokens by ID, restricted to those owned by the given user, for bulk operations. */
  List<PersonalAccessToken> findAllByIdInAndUserId(Collection<UUID> ids, UUID userId);
}
