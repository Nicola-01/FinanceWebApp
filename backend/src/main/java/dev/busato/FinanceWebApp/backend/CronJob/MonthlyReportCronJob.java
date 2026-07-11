package dev.busato.FinanceWebApp.backend.CronJob;

import dev.busato.FinanceWebApp.backend.report.ReportService;
import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
import dev.busato.FinanceWebApp.backend.scheduling.ManagedJob;
import java.time.YearMonth;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Emails every opted-in user the monthly summary report. Covers the previous calendar month,
 * derived from the execution date — so the admin "Run now" re-sends the last closed month.
 */
@Component
@RequiredArgsConstructor
public class MonthlyReportCronJob implements ManagedJob {

  private final ReportService reportService;

  @Override
  public String key() {
    return "monthly-report";
  }

  @Override
  public String displayName() {
    return "Monthly Report Email";
  }

  @Override
  public ScheduleDefaults defaults() {
    return new ScheduleDefaults(JobFrequency.MONTHLY, 7, 0, null, 1, null);
  }

  @Override
  public String run() {
    return reportService.sendMonthlyReports(YearMonth.now().minusMonths(1));
  }
}
