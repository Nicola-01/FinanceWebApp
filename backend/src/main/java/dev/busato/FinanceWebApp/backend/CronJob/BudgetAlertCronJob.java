package dev.busato.FinanceWebApp.backend.CronJob;

import dev.busato.FinanceWebApp.backend.dto.BudgetStatusResponse;
import dev.busato.FinanceWebApp.backend.model.Budget;
import dev.busato.FinanceWebApp.backend.model.BudgetAlertLog;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.BudgetAlertLogRepository;
import dev.busato.FinanceWebApp.backend.repository.BudgetRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
import dev.busato.FinanceWebApp.backend.scheduling.ManagedJob;
import dev.busato.FinanceWebApp.backend.service.BudgetPeriods;
import dev.busato.FinanceWebApp.backend.service.BudgetService;
import dev.busato.FinanceWebApp.backend.service.SendEmailService;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Emails wallet members when a budget crosses one of its alert thresholds. One email per (budget,
 * period, threshold), deduplicated via {@link BudgetAlertLog}. Default schedule: hourly (editable
 * in the admin System tab).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BudgetAlertCronJob implements ManagedJob {

  private final BudgetRepository budgetRepository;
  private final BudgetAlertLogRepository alertLogRepository;
  private final WalletAccessRepository walletAccessRepository;
  private final BudgetService budgetService;
  private final SendEmailService sendEmailService;

  @Override
  public String key() {
    return "budget-alerts";
  }

  @Override
  public String displayName() {
    return "Budget Alerts";
  }

  @Override
  public ScheduleDefaults defaults() {
    return new ScheduleDefaults(JobFrequency.HOURLY, 0, 0, null);
  }

  @Override
  public String run() {
    LocalDate today = LocalDate.now();
    int sent = 0;
    int failed = 0;
    for (Budget budget : budgetRepository.findAllWithWalletAndTag()) {
      BudgetResolution resolution;
      try {
        resolution = resolveBudget(budget, today);
      } catch (Exception e) {
        log.warn("[BudgetAlertCronJob] Failed to resolve budget {}", budget.getId(), e);
        failed++;
        continue;
      }
      if (resolution == null) continue;

      for (int threshold : resolution.status().getCrossedThresholds()) {
        if (alertLogRepository.existsByBudgetIdAndPeriodKeyAndThreshold(
            budget.getId(), resolution.periodKey(), threshold)) continue;
        try {
          sendEmailService.sendBudgetAlert(
              budget.getWallet(), resolution.status(), threshold, resolution.recipients());
          alertLogRepository.save(
              BudgetAlertLog.builder()
                  .budget(budget)
                  .periodKey(resolution.periodKey())
                  .threshold(threshold)
                  .sentAt(Instant.now())
                  .build());
          sent++;
        } catch (Exception e) {
          log.warn(
              "[BudgetAlertCronJob] Failed to send alert for budget {} threshold {}",
              budget.getId(),
              threshold,
              e);
          failed++;
        }
      }
    }
    return sent + " budget alert(s) sent" + (failed > 0 ? ", " + failed + " alert(s) failed" : "");
  }

  /**
   * Resolves everything needed to alert on a budget: its computed status, the accepted members to
   * notify, and the current period key. Returns {@code null} when there is nothing to send
   * (inactive, no crossed thresholds, or no recipients) rather than throwing.
   */
  private BudgetResolution resolveBudget(Budget budget, LocalDate today) throws Exception {
    BudgetStatusResponse status = budgetService.computeStatus(budget, today);
    if (!status.isActive() || status.getCrossedThresholds().isEmpty()) return null;

    List<String> recipients = acceptedMemberEmails(budget.getWallet().getId());
    if (recipients.isEmpty()) return null;

    String periodKey = BudgetPeriods.currentPeriod(budget, today).key();
    return new BudgetResolution(status, recipients, periodKey);
  }

  private record BudgetResolution(
      BudgetStatusResponse status, List<String> recipients, String periodKey) {}

  private List<String> acceptedMemberEmails(UUID walletId) {
    return walletAccessRepository.findAllByWalletId(walletId).stream()
        .filter(a -> a.getStatus() == WalletAccess.InvitationStatus.ACCEPTED)
        .map(a -> a.getUser().getEmail())
        .toList();
  }
}
