package dev.busato.FinanceWebApp.backend.repository;

import static org.junit.jupiter.api.Assertions.*;

import dev.busato.FinanceWebApp.backend.model.BankAccountLink;
import dev.busato.FinanceWebApp.backend.model.BankConnection;
import dev.busato.FinanceWebApp.backend.model.ImportedBankTransaction;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class BankRepositoriesTest {

  @Autowired private TestEntityManager em;
  @Autowired private BankConnectionRepository connections;
  @Autowired private BankAccountLinkRepository links;
  @Autowired private ImportedBankTransactionRepository ledger;

  private Wallet wallet;
  private BankConnection connection;
  private BankAccountLink link;

  @BeforeEach
  void setUp() {
    wallet = new Wallet();
    wallet.setName("W");
    wallet.setCurrency("EUR");
    wallet = em.persistAndFlush(wallet);
    User user =
        em.persistAndFlush(User.builder().username("u").email("u@x.it").password("p").build());
    connection =
        BankConnection.builder()
            .wallet(wallet)
            .createdBy(user)
            .aspspName("Bank")
            .aspspCountry("IT")
            .state(UUID.randomUUID().toString())
            .status(BankConnection.Status.PENDING)
            .importFrom(LocalDate.of(2026, 1, 1))
            .build();
    link =
        BankAccountLink.builder()
            .connection(connection)
            .accountUid("acc-1")
            .currency("EUR")
            .importFrom(LocalDate.of(2026, 1, 1))
            .build();
    connection.getAccounts().add(link);
    connection = em.persistAndFlush(connection);
  }

  @Test
  void findByState_findsPendingConnection() {
    var found = connections.findByState(connection.getState());
    assertTrue(found.isPresent());
    assertEquals(BankConnection.Status.PENDING, found.get().getStatus());
    assertNotNull(found.get().getCreatedAt());
    assertEquals(1, connections.findByWalletId(wallet.getId()).size());
    assertEquals(1, connections.findByStatus(BankConnection.Status.PENDING).size());
    assertEquals(1, connections.findByCreatedById(connection.getCreatedBy().getId()).size());
    assertEquals(1, links.findByConnectionWalletId(wallet.getId()).size());
  }

  @Test
  void ledgerUniquePerLink() {
    ledger.saveAndFlush(entry("ext-1"));
    ledger.saveAndFlush(entry("ext-2"));
    assertEquals(Set.of("ext-1", "ext-2"), ledger.findExternalIdsByLinkId(link.getId()));
    assertThrows(DataIntegrityViolationException.class, () -> ledger.saveAndFlush(entry("ext-1")));
  }

  @Test
  void deletingConnectionCascadesLinksAndLedger() {
    ledger.saveAndFlush(entry("ext-1"));
    em.clear();
    connections.deleteAll(connections.findByWalletId(wallet.getId()));
    connections.flush();
    assertEquals(0, links.count());
    assertEquals(0, ledger.count());
  }

  private ImportedBankTransaction entry(String externalId) {
    return ImportedBankTransaction.builder()
        .link(link)
        .externalId(externalId)
        .importedAt(Instant.now())
        .build();
  }
}
