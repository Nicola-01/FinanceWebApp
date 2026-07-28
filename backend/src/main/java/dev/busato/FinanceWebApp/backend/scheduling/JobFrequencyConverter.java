package dev.busato.FinanceWebApp.backend.scheduling;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Stores {@link JobFrequency} as its plain name, via a converter rather than
 * {@code @Enumerated(STRING)}. Hibernate 6 auto-generates a DB CHECK constraint restricting the
 * column to whatever enum constants existed when the column was first created, and never widens it
 * on later {@code ddl-auto=update} runs — a converter opts the column out of that check-constraint
 * generation, so adding new {@link JobFrequency} values in the future doesn't require a manual prod
 * migration (see the {@code scheduled_job_config_frequency_check} incident: adding MONTHLY left
 * prod's constraint stuck at HOURLY/DAILY/WEEKLY and crashed the app on boot).
 */
@Converter(autoApply = true)
public class JobFrequencyConverter implements AttributeConverter<JobFrequency, String> {

  @Override
  public String convertToDatabaseColumn(JobFrequency attribute) {
    return attribute == null ? null : attribute.name();
  }

  @Override
  public JobFrequency convertToEntityAttribute(String dbData) {
    return dbData == null ? null : JobFrequency.valueOf(dbData);
  }
}
