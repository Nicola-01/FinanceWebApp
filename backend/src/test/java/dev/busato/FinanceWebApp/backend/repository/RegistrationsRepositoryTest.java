package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.Registrations;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@ActiveProfiles("test")
class RegistrationsRepositoryTest {
    @Autowired
    private RegistrationsRepository registrationsRepository;

    @Test
    void deleteExpiredInvitations_ShouldDeleteOnlyExpired() {
        // Arrange
        Registrations expiredReg = new Registrations();
        expiredReg.setEmail("expired@example.com");
        expiredReg.setToken("token1");
        expiredReg.setStatus(Registrations.InvitationStatus.PENDING);
        expiredReg.setExpiresAt(LocalDateTime.now().minusDays(5));
        registrationsRepository.save(expiredReg);
        Registrations validReg = new Registrations();
        validReg.setEmail("valid@example.com");
        validReg.setToken("token2");
        validReg.setStatus(Registrations.InvitationStatus.PENDING);
        validReg.setExpiresAt(LocalDateTime.now().plusDays(2));
        registrationsRepository.save(validReg);
        // Act
        LocalDateTime cutoff = LocalDateTime.now();
        registrationsRepository.deleteExpiredInvitations(cutoff);
        // Assert
        Optional<Registrations> foundExpired = registrationsRepository.findByEmailIgnoreCase("expired@example.com");
        assertTrue(foundExpired.isEmpty());
        Optional<Registrations> foundValid = registrationsRepository.findByEmailIgnoreCase("valid@example.com");
        assertTrue(foundValid.isPresent());
    }
}