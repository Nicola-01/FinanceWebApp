package dev.busato.FinanceWebApp.backend.report;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.model.Notification.NotificationType;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.model.WalletAccess.InvitationStatus;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.service.NotificationService;
import dev.busato.FinanceWebApp.backend.service.SendEmailService;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

  @Mock private UserRepository userRepository;
  @Mock private WalletAccessRepository walletAccessRepository;
  @Mock private TransactionRepository transactionRepository;
  @Mock private ReportAggregator aggregator;
  @Mock private ReportHtmlBuilder htmlBuilder;
  @Mock private ReportPdfRenderer pdfRenderer;
  @Mock private SendEmailService sendEmailService;
  @Mock private NotificationService notificationService;

  @InjectMocks private ReportService reportService;

  private final YearMonth period = YearMonth.of(2026, 6);
  private User user;
  private Wallet wallet;

  @BeforeEach
  void setUp() {
    user =
        User.builder()
            .id(UUID.randomUUID())
            .username("nicola")
            .email("n@x.com")
            .password("p")
            .build();
    wallet = Wallet.builder().id(UUID.randomUUID()).name("Main").currency("EUR").build();
  }

  private void wireHappyPath(int txCount) {
    WalletAccess access = new WalletAccess();
    access.setWallet(wallet);
    when(userRepository.findAll()).thenReturn(List.of(user));
    when(walletAccessRepository.findAllByUserIdAndStatus(user.getId(), InvitationStatus.ACCEPTED))
        .thenReturn(List.of(access));
    when(transactionRepository.getAllByWalletId(wallet.getId())).thenReturn(List.of());
    when(aggregator.monthly(eq(wallet), anyList(), eq(period)))
        .thenReturn(
            new WalletMonthlyReport(
                "Main",
                null,
                "EUR",
                period,
                new PeriodTotals(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO),
                null,
                BigDecimal.ZERO,
                List.of(),
                List.of(),
                txCount));
  }

  @Test
  void sendMonthlyReports_SendsEmailWithPdf() throws Exception {
    wireHappyPath(3);
    when(htmlBuilder.monthlyEmailBody(eq("nicola"), eq(period), anyList())).thenReturn("<body/>");
    when(htmlBuilder.monthlyPdfHtml(eq("nicola"), eq(period), anyList())).thenReturn("<pdf/>");
    when(pdfRenderer.render("<pdf/>")).thenReturn("%PDF".getBytes());

    String summary = reportService.sendMonthlyReports(period);

    assertEquals("sent 1, skipped 0 (no data), failed 0", summary);
    verify(sendEmailService)
        .sendReportEmail(
            eq("n@x.com"),
            eq("Your FinanceWebApp report for June 2026"),
            eq("<body/>"),
            eq("FinanceWebApp-Report-2026-06.pdf"),
            any(byte[].class));
    verify(notificationService)
        .notifyUser(eq(user), eq(NotificationType.MONTHLY_REPORT), isNull(), any());
  }

  @Test
  void sendMonthlyReports_PushFailureStillCountsAsSent() throws Exception {
    wireHappyPath(3);
    when(htmlBuilder.monthlyEmailBody(any(), any(), anyList())).thenReturn("<body/>");
    when(htmlBuilder.monthlyPdfHtml(any(), any(), anyList())).thenReturn("<pdf/>");
    when(pdfRenderer.render(any())).thenReturn("%PDF".getBytes());
    doThrow(new RuntimeException("push down"))
        .when(notificationService)
        .notifyUser(any(), any(), any(), any());

    String summary = reportService.sendMonthlyReports(period);

    // Email went out; a failing report-ready push must not flip it to failed.
    assertEquals("sent 1, skipped 0 (no data), failed 0", summary);
    verify(sendEmailService).sendReportEmail(any(), any(), any(), any(), any());
  }

  @Test
  void sendMonthlyReports_SkipsUserWithNoData() throws Exception {
    wireHappyPath(0); // wallet exists but empty period

    String summary = reportService.sendMonthlyReports(period);

    assertEquals("sent 0, skipped 1 (no data), failed 0", summary);
    verify(sendEmailService, never()).sendReportEmail(any(), any(), any(), any(), any());
  }

  @Test
  void sendMonthlyReports_IgnoresDemoAndOptedOutUsers() throws Exception {
    User demo =
        User.builder()
            .id(UUID.randomUUID())
            .username("d")
            .email("d@x.com")
            .password("p")
            .demo(true)
            .build();
    User optedOut =
        User.builder()
            .id(UUID.randomUUID())
            .username("o")
            .email("o@x.com")
            .password("p")
            .monthlyReportEnabled(false)
            .build();
    when(userRepository.findAll()).thenReturn(List.of(demo, optedOut));

    String summary = reportService.sendMonthlyReports(period);

    assertEquals("sent 0, skipped 0 (no data), failed 0", summary);
    verifyNoInteractions(sendEmailService);
  }

  @Test
  void sendMonthlyReports_OneFailureDoesNotAbortBatch() throws Exception {
    wireHappyPath(3);
    when(htmlBuilder.monthlyEmailBody(any(), any(), anyList())).thenReturn("<body/>");
    when(htmlBuilder.monthlyPdfHtml(any(), any(), anyList())).thenReturn("<pdf/>");
    when(pdfRenderer.render(any())).thenReturn("%PDF".getBytes());
    doThrow(new RuntimeException("smtp down"))
        .when(sendEmailService)
        .sendReportEmail(any(), any(), any(), any(), any());

    String summary = reportService.sendMonthlyReports(period);

    assertEquals("sent 0, skipped 0 (no data), failed 1", summary);
  }

  @Test
  void sendYearlyReports_SendsWrapEmail() throws Exception {
    WalletAccess access = new WalletAccess();
    access.setWallet(wallet);
    when(userRepository.findAll()).thenReturn(List.of(user));
    when(walletAccessRepository.findAllByUserIdAndStatus(user.getId(), InvitationStatus.ACCEPTED))
        .thenReturn(List.of(access));
    when(transactionRepository.getAllByWalletId(wallet.getId())).thenReturn(List.of());
    when(aggregator.yearly(eq(wallet), anyList(), eq(2025)))
        .thenReturn(
            new WalletYearlyReport(
                "Main",
                null,
                "EUR",
                2025,
                new PeriodTotals(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO),
                null,
                List.of(),
                null,
                null,
                List.of(),
                List.of(),
                new YearRecords(null, null, null, null, null, null, 0, 5, null, null),
                5));
    when(htmlBuilder.yearlyEmailBody(eq("nicola"), eq(2025), anyList())).thenReturn("<body/>");
    when(htmlBuilder.yearlyPdfHtml(eq("nicola"), eq(2025), anyList())).thenReturn("<pdf/>");
    when(pdfRenderer.render("<pdf/>")).thenReturn("%PDF".getBytes());

    String summary = reportService.sendYearlyReports(2025);

    assertEquals("sent 1, skipped 0 (no data), failed 0", summary);
    verify(sendEmailService)
        .sendReportEmail(
            eq("n@x.com"),
            eq("Your 2025 FinanceWebApp wrap-up"),
            eq("<body/>"),
            eq("FinanceWebApp-Wrap-2025.pdf"),
            any(byte[].class));
    verify(notificationService)
        .notifyUser(eq(user), eq(NotificationType.YEARLY_REPORT), isNull(), any());
  }
}
