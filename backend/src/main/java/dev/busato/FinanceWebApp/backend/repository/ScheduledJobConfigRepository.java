package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.ScheduledJobConfig;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduledJobConfigRepository extends JpaRepository<ScheduledJobConfig, String> {}
