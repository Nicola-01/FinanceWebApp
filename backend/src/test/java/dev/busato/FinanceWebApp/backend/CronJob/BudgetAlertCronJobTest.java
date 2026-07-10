package dev.busato.FinanceWebApp.backend.CronJob;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.dto.BudgetStatusResponse;
import dev.busato.FinanceWebApp.backend.model.Budget;
import dev.busato.FinanceWebApp.backend.model.BudgetAlertLog;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.BudgetAlertLogRepository;
import dev.busato.FinanceWebApp.backend.repository.BudgetRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.service.BudgetService;
import dev.busato.FinanceWebApp.backend.service.SendEmailService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BudgetAlertCronJobTest {

  @Mock private BudgetRepository budgetRepository;
  @Mock private BudgetAlertLogRepository alertLogRepository;
  @Mock private WalletAccessRepository walletAccessRepository;
  @Mock private BudgetService budgetService;
  @Mock private SendEmailService sendEmailService;

  private BudgetAlertCronJob job;
  private Budget budget;
  private Wallet wallet;

  @BeforeEach
  void setUp() {
    job =
        new BudgetAlertCronJob(
            budgetRepository,
            alertLogRepository,
            walletAccessRepository,
            budgetService,
            sendEmailService);
    wallet = new Wallet();
    wallet.setId(UUID.randomUUID());
    wallet.setName("W");
    wallet.setCurrency("EUR");
    budget =
        Budget.builder()
            .id(UUID.randomUUID())
            .wallet(wallet)
            .name("Food budget")
            .limitAmount(new BigDecimal("100.00"))
            .periodType(Budget.PeriodType.MONTHLY)
            .startDate(LocalDate.now().withDayOfMonth(1))
            .alertThresholds("[80,100]")
            .build();
  }

  private BudgetStatusResponse status(List<Integer> crossed, boolean active) {
    return BudgetStatusResponse.builder()
        .id(budget.getId())
        .name(budget.getName())
        .spent(new BigDecimal("85.00"))
        .effectiveLimit(new BigDecimal("100.00"))
        .percentUsed(85)
        .status("WARNING")
        .crossedThresholds(crossed)
        .active(active)
        .periodStart(LocalDate.now().withDayOfMonth(1))
        .periodEnd(LocalDate.now().withDayOfMonth(28))
        .alertThresholds(List.of(80, 100))
        .build();
  }

  private void memberWithEmail(String email, WalletAccess.InvitationStatus status) {
    User u = new User();
    u.setEmail(email);
    u.setUsername(email);
    WalletAccess a = new WalletAccess();
    a.setUser(u);
    a.setWallet(wallet);
    a.setStatus(status);
    a.setRole(WalletAccess.WalletRole.EDITOR);
    when(walletAccessRepository.findAllByWalletId(wallet.getId())).thenReturn(List.of(a));
  }

  @Test
  void crossedThreshold_sendsOnceAndLogs() throws Exception {
    when(budgetRepository.findAllWithWalletAndTag()).thenReturn(List.of(budget));
    when(budgetService.computeStatus(eq(budget), any())).thenReturn(status(List.of(80), true));
    when(alertLogRepository.existsByBudgetIdAndPeriodKeyAndThreshold(
            eq(budget.getId()), anyString(), eq(80)))
        .thenReturn(false);
    memberWithEmail("owner@example.com", WalletAccess.InvitationStatus.ACCEPTED);

    String result = job.run();

    verify(sendEmailService)
        .sendBudgetAlert(eq(wallet), any(), eq(80), eq(List.of("owner@example.com")));
    verify(alertLogRepository).save(any(BudgetAlertLog.class));
    assertTrue(result.startsWith("1 budget alert(s) sent"));
  }

  @Test
  void alreadyLogged_isIdempotent() throws Exception {
    when(budgetRepository.findAllWithWalletAndTag()).thenReturn(List.of(budget));
    when(budgetService.computeStatus(eq(budget), any())).thenReturn(status(List.of(80), true));
    when(alertLogRepository.existsByBudgetIdAndPeriodKeyAndThreshold(
            eq(budget.getId()), anyString(), eq(80)))
        .thenReturn(true);
    memberWithEmail("owner@example.com", WalletAccess.InvitationStatus.ACCEPTED);

    job.run();

    verify(sendEmailService, never()).sendBudgetAlert(any(), any(), anyInt(), anyList());
    verify(alertLogRepository, never()).save(any());
  }

  @Test
  void inactiveOrUncrossed_skipped() throws Exception {
    when(budgetRepository.findAllWithWalletAndTag()).thenReturn(List.of(budget));
    when(budgetService.computeStatus(eq(budget), any())).thenReturn(status(List.of(), true));

    job.run();
    verify(sendEmailService, never()).sendBudgetAlert(any(), any(), anyInt(), anyList());
  }

  @Test
  void pendingMembers_getNoEmail() throws Exception {
    when(budgetRepository.findAllWithWalletAndTag()).thenReturn(List.of(budget));
    when(budgetService.computeStatus(eq(budget), any())).thenReturn(status(List.of(80), true));
    memberWithEmail("pending@example.com", WalletAccess.InvitationStatus.PENDING);

    job.run();
    verify(sendEmailService, never()).sendBudgetAlert(any(), any(), anyInt(), anyList());
  }

  @Test
  void emailFailure_doesNotLog_andDoesNotBlockOtherBudgets() throws Exception {
    Budget second =
        Budget.builder()
            .id(UUID.randomUUID())
            .wallet(wallet)
            .name("Other budget")
            .limitAmount(new BigDecimal("100.00"))
            .periodType(Budget.PeriodType.MONTHLY)
            .startDate(LocalDate.now().withDayOfMonth(1))
            .alertThresholds("[80,100]")
            .build();
    when(budgetRepository.findAllWithWalletAndTag()).thenReturn(List.of(budget, second));
    when(budgetService.computeStatus(any(), any())).thenReturn(status(List.of(80), true));
    when(alertLogRepository.existsByBudgetIdAndPeriodKeyAndThreshold(any(), anyString(), eq(80)))
        .thenReturn(false);
    memberWithEmail("owner@example.com", WalletAccess.InvitationStatus.ACCEPTED);
    doThrow(new RuntimeException("smtp down"))
        .doNothing()
        .when(sendEmailService)
        .sendBudgetAlert(any(), any(), anyInt(), anyList());

    String result = job.run();

    // First budget failed (nothing logged for it), second one still went out.
    verify(alertLogRepository, times(1)).save(any(BudgetAlertLog.class));
    assertTrue(result.contains("1 budget alert(s) sent"));
    assertTrue(result.contains("1 alert(s) failed"));
  }

  @Test
  void partialThresholdFailure_countsAndLogsPerThreshold() throws Exception {
    when(budgetRepository.findAllWithWalletAndTag()).thenReturn(List.of(budget));
    when(budgetService.computeStatus(eq(budget), any())).thenReturn(status(List.of(80, 100), true));
    when(alertLogRepository.existsByBudgetIdAndPeriodKeyAndThreshold(
            eq(budget.getId()), anyString(), eq(80)))
        .thenReturn(false);
    when(alertLogRepository.existsByBudgetIdAndPeriodKeyAndThreshold(
            eq(budget.getId()), anyString(), eq(100)))
        .thenReturn(false);
    memberWithEmail("owner@example.com", WalletAccess.InvitationStatus.ACCEPTED);
    // Thresholds are processed in sorted order [80, 100]: the 80 send succeeds, the 100 send
    // throws — each threshold must be counted/logged independently.
    doNothing()
        .doThrow(new RuntimeException("smtp down"))
        .when(sendEmailService)
        .sendBudgetAlert(any(), any(), anyInt(), anyList());

    String result = job.run();

    // Only the successful (80) send is logged; the failed (100) send is not, so it is retried
    // next run.
    verify(alertLogRepository, times(1)).save(any(BudgetAlertLog.class));
    assertTrue(result.contains("1 budget alert(s) sent"));
    assertTrue(result.contains("1 alert(s) failed"));
  }
}
