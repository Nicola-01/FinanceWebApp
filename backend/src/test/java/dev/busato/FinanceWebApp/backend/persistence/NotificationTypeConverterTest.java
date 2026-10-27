package dev.busato.FinanceWebApp.backend.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import dev.busato.FinanceWebApp.backend.model.Notification.NotificationType;
import dev.busato.FinanceWebApp.backend.model.NotificationTypeConverter;
import org.junit.jupiter.api.Test;

class NotificationTypeConverterTest {

  private final NotificationTypeConverter converter = new NotificationTypeConverter();

  @Test
  void roundTripsEveryTypeAndNull() {
    for (NotificationType t : NotificationType.values())
      assertThat(converter.convertToEntityAttribute(converter.convertToDatabaseColumn(t)))
          .isEqualTo(t);
    assertThat(converter.convertToDatabaseColumn(NotificationType.BANK_CONNECTION))
        .isEqualTo("BANK_CONNECTION");
    assertThat(converter.convertToDatabaseColumn(null)).isNull();
    assertThat(converter.convertToEntityAttribute(null)).isNull();
  }
}
