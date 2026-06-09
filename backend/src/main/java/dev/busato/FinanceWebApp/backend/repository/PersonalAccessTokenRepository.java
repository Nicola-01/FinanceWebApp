package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.PersonalAccessToken;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PersonalAccessTokenRepository extends JpaRepository<PersonalAccessToken, UUID> {

    /** Lookup by SHA-256 hash for token validation — eagerly loads the User to avoid LazyInitializationException */
    @EntityGraph(attributePaths = {"user"})
    Optional<PersonalAccessToken> findByTokenHash(String tokenHash);

    /** List all tokens belonging to a user */
    List<PersonalAccessToken> findAllByUserId(UUID userId);

    /** Revoke a specific token owned by a specific user */
    void deleteByIdAndUserId(UUID id, UUID userId);
}
