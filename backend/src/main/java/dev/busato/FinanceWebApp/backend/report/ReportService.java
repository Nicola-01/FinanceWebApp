package dev.busato.FinanceWebApp.backend.report;

import dev.busato.FinanceWebApp.backend.model.Notification.NotificationType;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.model.WalletAccess.InvitationStatus;
import dev.busato.FinanceWebApp.backend.push.NotificationCopy;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.service.NotificationService;
import dev.busato.FinanceWebApp.backend.service.SendEmailService;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Builds and sends the periodic summary reports (one email per user, one section per ACCEPTED
 * wallet with data). Per-user failures are counted, logged and never abort the batch; the returned
 * string becomes the JobRun history message.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

  private final UserRepository userRepository;
  private final WalletAccessRepository walletAccessRepository;
  private final TransactionRepository transactionRepository;
  private final ReportAggregator aggregator;
  private final ReportHtmlBuilder htmlBuilder;
  private final ReportPdfRenderer pdfRenderer;
  private final SendEmailService sendEmailService;
  private final NotificationService notificationService;

  public String sendMonthlyReports(YearMonth period) {
    return sendAll(
        User::isMonthlyReportEnabled,
        user -> {
          List<WalletMonthlyReport> reports = new ArrayList<>();
          for (Wallet wallet : acceptedWallets(user)) {
            WalletMonthlyReport r =
                aggregator.monthly(
                    wallet, transactionRepository.getAllByWalletId(wallet.getId()), period);
            if (r.transactionCount() > 0) reports.add(r);
          }
          if (reports.isEmpty()) return false;
          byte[] pdf =
              pdfRenderer.render(htmlBuilder.monthlyPdfHtml(user.getUsername(), period, reports));
          sendEmailService.sendReportEmail(
              user.getEmail(),
              "Your FinanceWebApp report for " + ReportHtmlBuilder.monthLabel(period),
              htmlBuilder.monthlyEmailBody(user.getUsername(), period, reports),
              "FinanceWebApp-Report-" + period + ".pdf",
              pdf);
          notifyReportReady(
              user,
              NotificationType.MONTHLY_REPORT,
              NotificationCopy.monthlyReportReady(ReportHtmlBuilder.monthLabel(period)));
          return true;
        });
  }

  public String sendYearlyReports(int year) {
    return sendAll(
        User::isYearlyReportEnabled,
        user -> {
          List<WalletYearlyReport> reports = new ArrayList<>();
          for (Wallet wallet : acceptedWallets(user)) {
            WalletYearlyReport r =
                aggregator.yearly(
                    wallet, transactionRepository.getAllByWalletId(wallet.getId()), year);
            if (r.transactionCount() > 0) reports.add(r);
          }
          if (reports.isEmpty()) return false;
          byte[] pdf =
              pdfRenderer.render(htmlBuilder.yearlyPdfHtml(user.getUsername(), year, reports));
          sendEmailService.sendReportEmail(
              user.getEmail(),
              "Your " + year + " FinanceWebApp wrap-up",
              htmlBuilder.yearlyEmailBody(user.getUsername(), year, reports),
              "FinanceWebApp-Wrap-" + year + ".pdf",
              pdf);
          notifyReportReady(
              user, NotificationType.YEARLY_REPORT, NotificationCopy.yearlyReportReady(year));
          return true;
        });
  }

  /**
   * Best-effort report-ready notification (persisted row + Web Push) gated by the same opt-in as
   * the email. A push/notification failure must never flip an already-sent report to failed, so it
   * is swallowed here rather than propagated to the batch loop.
   */
  private void notifyReportReady(User user, NotificationType type, NotificationCopy.Copy copy) {
    try {
      notificationService.notifyUser(user, type, null, copy);
    } catch (Exception e) {
      log.warn(
          "[Reports] report-ready notification failed for user {}: {}",
          user.getId(),
          e.getMessage());
    }
  }

  /** Shared batch loop: opt-in filter → build+send (true = sent, false = no data). */
  private String sendAll(Predicate<User> optedIn, SendForUser sender) {
    int sent = 0;
    int skipped = 0;
    int failed = 0;
    for (User user : userRepository.findAll()) {
      if (user.isDemo() || !optedIn.test(user)) continue;
      try {
        if (sender.send(user)) sent++;
        else skipped++;
      } catch (Exception e) {
        failed++;
        log.error("[Reports] report failed for user {}: {}", user.getId(), e.getMessage(), e);
      }
    }
    return "sent %d, skipped %d (no data), failed %d".formatted(sent, skipped, failed);
  }

  private List<Wallet> acceptedWallets(User user) {
    return walletAccessRepository
        .findAllByUserIdAndStatus(user.getId(), InvitationStatus.ACCEPTED)
        .stream()
        .map(WalletAccess::getWallet)
        .toList();
  }

  @FunctionalInterface
  private interface SendForUser {
    boolean send(User user) throws Exception;
  }
}
