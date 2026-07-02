package dev.busato.FinanceWebApp.backend.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import dev.busato.FinanceWebApp.backend.model.Registrations;
import dev.busato.FinanceWebApp.backend.repository.RegistrationsRepository;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Verifies the {@code @UuidGenerator(algorithm = UuidV7Generator.class)} wiring end-to-end: an
 * entity persisted with a Hibernate-generated {@code @Id} receives a UUID version 7.
 */
@DataJpaTest
@ActiveProfiles("test")
class UuidV7WiringTest {

  @Autowired private RegistrationsRepository registrationsRepository;

  @Test
  void persistedEntityGetsVersion7Id() {
    Registrations reg = new Registrations();
    reg.setEmail("uuid-v7@example.com");
    reg.setToken("token-v7");
    reg.setStatus(Registrations.InvitationStatus.PENDING);
    reg.setExpiresAt(LocalDateTime.now().plusDays(1));

    Registrations saved = registrationsRepository.save(reg);

    assertNotNull(saved.getId());
    assertEquals(7, saved.getId().version(), "generated primary key must be UUID v7");
  }
}
