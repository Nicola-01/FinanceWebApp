package dev.busato.FinanceWebApp.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.report.ReportService;
import dev.busato.FinanceWebApp.backend.repository.TagRepository;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import dev.busato.FinanceWebApp.backend.service.NotificationService;
import dev.busato.FinanceWebApp.backend.service.SendEmailService;
import java.math.BigDecimal;
import java.time.YearMonth;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

/**
 * Runs the report batch WITHOUT a surrounding transaction, like the scheduler thread does in prod.
 * Guards the regression where the lazy {@code WalletAccess.wallet} proxy threw
 * LazyInitializationException for every user ("sent 0, failed N").
 */
@SpringBootTest
@ActiveProfiles("test")
class ReportServiceIntegrationTest {

  @MockitoBean SendEmailService sendEmailService;
  @MockitoBean NotificationService notificationService;

  @Autowired ReportService reportService;
  @Autowired UserRepository userRepository;
  @Autowired WalletRepository walletRepository;
  @Autowired WalletAccessRepository walletAccessRepository;
  @Autowired TagRepository tagRepository;
  @Autowired TransactionRepository transactionRepository;

  private final YearMonth period = YearMonth.of(2026, 10);
  private User user;
  private Wallet wallet;

  @BeforeEach
  void setUp() {
    user = new User();
    user.setUsername("report-it@example.com");
    user.setEmail("report-it@example.com");
    user.setPassword("password");
    user.setRole(User.Role.USER);
    user.setTokenVersion(1);
    user = userRepository.save(user);

    wallet = new Wallet();
    wallet.setName("Report Wallet");
    wallet.setCurrency("EUR");
    wallet = walletRepository.save(wallet);

    WalletAccess a = new WalletAccess();
    a.setId(new WalletAccess.WalletAccessId(user.getId(), wallet.getId()));
    a.setRole(WalletAccess.WalletRole.OWNER);
    a.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    a.setUser(user);
    a.setWallet(wallet);
    walletAccessRepository.save(a);

    Tag food = tagRepository.save(Tag.builder().name("Food").wallet(wallet).build());
    transactionRepository.save(
        Transaction.builder()
            .wallet(wallet)
            .name("Groceries")
            .amount(new BigDecimal("42.00"))
            .originalAmount(new BigDecimal("42.00"))
            .type(Transaction.Type.EXPENSE)
            .tag(food)
            .transactionDate(period.atDay(10))
            .build());
  }

  @AfterEach
  void tearDown() {
    transactionRepository.deleteAll(transactionRepository.getAllByWalletId(wallet.getId()));
    tagRepository.deleteAll(
        tagRepository.findAll().stream()
            .filter(t -> t.getWallet().getId().equals(wallet.getId()))
            .toList());
    walletAccessRepository.deleteAll(walletAccessRepository.findAllByWalletId(wallet.getId()));
    walletRepository.deleteById(wallet.getId());
    userRepository.deleteById(user.getId());
  }

  @Test
  void monthlyReportIsSentOutsideATransaction() throws Exception {
    String result = reportService.sendMonthlyReports(period);

    assertThat(result).contains("failed 0");
    verify(sendEmailService)
        .sendReportEmail(eq("report-it@example.com"), anyString(), anyString(), anyString(), any());
  }
}
