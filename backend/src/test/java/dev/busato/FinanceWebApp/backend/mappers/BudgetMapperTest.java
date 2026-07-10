package dev.busato.FinanceWebApp.backend.mappers;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.busato.FinanceWebApp.backend.model.Budget;
import dev.busato.FinanceWebApp.backend.model.Tag;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;

class BudgetMapperTest {

  private final BudgetMapper mapper = new BudgetMapper(new ObjectMapper());

  @Test
  void thresholds_roundTrip_sortedAndDeduped() {
    assertEquals("[50,80,100]", mapper.thresholdsToJson(List.of(100, 50, 80, 50)));
    assertEquals(List.of(50, 80, 100), mapper.thresholdsFromJson("[50,80,100]"));
  }

  @Test
  void thresholds_nullMeansDefault_emptyStays() {
    assertEquals("[80,100]", mapper.thresholdsToJson(null));
    assertEquals("[]", mapper.thresholdsToJson(List.of()));
    assertEquals(List.of(), mapper.thresholdsFromJson(null));
  }

  @Test
  void thresholds_invalidValuesRejected() {
    assertThrows(IllegalArgumentException.class, () -> mapper.thresholdsToJson(List.of(0)));
    assertThrows(IllegalArgumentException.class, () -> mapper.thresholdsToJson(List.of(201)));
    assertThrows(
        IllegalArgumentException.class,
        () -> mapper.thresholdsToJson(List.of(10, 20, 30, 40, 50, 60)));
  }

  @Test
  void thresholds_nullElementRejected() {
    assertThrows(
        IllegalArgumentException.class,
        () -> mapper.thresholdsToJson(Arrays.asList(50, null, 100)));
  }

  @Test
  void baseResponse_mapsEntityFields() {
    Budget b =
        Budget.builder()
            .name("Food budget")
            .tag(Tag.builder().name("Food").build())
            .limitAmount(new BigDecimal("300.00"))
            .periodType(Budget.PeriodType.MONTHLY)
            .startDate(LocalDate.of(2026, 7, 1))
            .rollover(true)
            .alertThresholds("[80,100]")
            .build();

    var response = mapper.baseResponse(b).build();
    assertEquals("Food budget", response.getName());
    assertEquals("Food", response.getTagName());
    assertEquals(Budget.PeriodType.MONTHLY, response.getPeriodType());
    assertTrue(response.isRollover());
    assertEquals(List.of(80, 100), response.getAlertThresholds());
  }

  @Test
  void baseResponse_nullTagMeansWholeWallet() {
    Budget b =
        Budget.builder()
            .name("Everything")
            .limitAmount(new BigDecimal("1000.00"))
            .periodType(Budget.PeriodType.MONTHLY)
            .startDate(LocalDate.of(2026, 7, 1))
            .alertThresholds("[80,100]")
            .build();
    assertNull(mapper.baseResponse(b).build().getTagName());
  }
}
