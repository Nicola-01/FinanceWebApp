package dev.busato.FinanceWebApp.backend.model;

import dev.busato.FinanceWebApp.backend.model.Notification.NotificationType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Stores {@link NotificationType} as its plain name via a converter rather than
 * {@code @Enumerated(STRING)}, so Hibernate does not generate a CHECK constraint that {@code
 * ddl-auto=update} would never widen when new types are added (same reasoning as {@code
 * JobFrequencyConverter}). The constraint already created on existing databases is dropped at
 * startup by {@code config.NotificationTypeConstraintCleanup}.
 */
@Converter(autoApply = true)
public class NotificationTypeConverter implements AttributeConverter<NotificationType, String> {

  @Override
  public String convertToDatabaseColumn(NotificationType attribute) {
    return attribute == null ? null : attribute.name();
  }

  @Override
  public NotificationType convertToEntityAttribute(String dbData) {
    return dbData == null ? null : NotificationType.valueOf(dbData);
  }
}
