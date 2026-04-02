package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.UserInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserInvitationRepository extends JpaRepository<UserInvitation, UUID> {
    Optional<UserInvitation> findByToken(String token);
    Optional<UserInvitation> findByEmailIgnoreCase(String email);
    List<UserInvitation> findAllByStatusNot(UserInvitation.InvitationStatus status);
    boolean existsByEmailIgnoreCase(String email);
    void deleteByEmailIgnoreCase(String email);

    @Modifying
    @Query("DELETE FROM UserInvitation u WHERE u.expiresAt < :cutoffDate")
    void deleteExpiredInvitations(@Param("cutoffDate") LocalDateTime cutoffDate);
}