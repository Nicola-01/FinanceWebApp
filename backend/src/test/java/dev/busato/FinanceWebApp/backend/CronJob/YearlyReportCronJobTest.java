package dev.busato.FinanceWebApp.backend.CronJob;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.report.ReportService;
import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
import java.time.Year;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class YearlyReportCronJobTest {

  @Mock private ReportService reportService;

  @InjectMocks private YearlyReportCronJob job;

  @Test
  void run_CoversPreviousYear_ReturnsServiceSummary() {
    int previousYear = Year.now().getValue() - 1;
    when(reportService.sendYearlyReports(previousYear))
        .thenReturn("sent 1, skipped 0 (no data), failed 0");

    assertEquals("sent 1, skipped 0 (no data), failed 0", job.run());
    verify(reportService).sendYearlyReports(previousYear);
  }

  @Test
  void metadata_IsStable() {
    assertEquals("yearly-report", job.key());
    assertEquals("Yearly Wrap-up Email", job.displayName());
    assertEquals(JobFrequency.YEARLY, job.defaults().frequency());
    assertEquals(7, job.defaults().hour());
    assertEquals(30, job.defaults().minute());
    assertEquals(1, job.defaults().dayOfMonth());
    assertEquals(1, job.defaults().monthOfYear());
  }
}
