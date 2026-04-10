package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.Registrations;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RegistrationsRepository extends JpaRepository<Registrations, UUID> {
    Optional<Registrations> findByToken(String token);
    Optional<Registrations> findByEmailIgnoreCase(String email);
    Optional<Registrations> findByEmailIgnoreCaseAndStatus(String email, Registrations.InvitationStatus status);
    List<Registrations> findAllByStatusNot(Registrations.InvitationStatus status);
    void deleteByEmailIgnoreCaseAndStatus(String email, Registrations.InvitationStatus status);
    boolean existsByEmailIgnoreCase(String email);
    void deleteByEmailIgnoreCase(String email);

    @Modifying
    @Query("DELETE FROM Registrations u WHERE u.expiresAt < :cutoffDate")
    void deleteExpiredInvitations(@Param("cutoffDate") LocalDateTime cutoffDate);
}