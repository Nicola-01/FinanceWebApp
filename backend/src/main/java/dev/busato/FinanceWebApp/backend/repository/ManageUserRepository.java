package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ManageUserRepository extends JpaRepository<User, Long> {}
