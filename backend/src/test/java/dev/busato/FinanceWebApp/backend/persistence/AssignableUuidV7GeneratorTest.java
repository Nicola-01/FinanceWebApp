package dev.busato.FinanceWebApp.backend.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class AssignableUuidV7GeneratorTest {

  @Autowired private WalletRepository walletRepository;
  @Autowired private TransactionRepository transactionRepository;

  private Wallet wallet;

  @BeforeEach
  void setUp() {
    wallet = new Wallet();
    wallet.setName("W");
    wallet.setCurrency("EUR");
    wallet = walletRepository.save(wallet);
  }

  private Transaction.TransactionBuilder tx() {
    return Transaction.builder()
        .wallet(wallet)
        .name("t")
        .amount(new BigDecimal("1.00"))
        .originalAmount(new BigDecimal("1.00"))
        .type(Transaction.Type.EXPENSE)
        .transactionDate(LocalDate.of(2026, 7, 8));
  }

  @Test
  void honorsClientAssignedId() {
    UUID clientId = UUID.randomUUID();
    Transaction saved = transactionRepository.saveAndFlush(tx().id(clientId).build());
    assertEquals(clientId, saved.getId());
  }

  @Test
  void generatesUuidV7WhenIdAbsent() {
    Transaction saved = transactionRepository.saveAndFlush(tx().build());
    assertNotNull(saved.getId());
    assertEquals(7, saved.getId().version());
  }
}
