package dev.busato.FinanceWebApp.backend.config;

import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.openbanking.BankSyncService;
import dev.busato.FinanceWebApp.backend.repository.TagRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

  @Value("${application.security.admin.username}")
  private String ADMIN_USERNAME;

  @Value("${application.security.admin.email}")
  private String ADMIN_EMAIL;

  @Value("${application.security.admin.password}")
  private String ADMIN_PASSWORD;

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final TagRepository tagRepository;

  @Override
  public void run(String... args) throws Exception {
    // shortcut: idempotent no-op once every legacy review tag is upgraded; drop after rollout.
    try {
      tagRepository.upgradeLegacyPlaceholders(
          BankSyncService.LEGACY_REVIEW_TAG, BankSyncService.REVIEW_TAG);
    } catch (RuntimeException e) {
      // A wallet already holding both names would hit the unique key; never block boot on it.
      System.out.println("Skipped legacy review-tag upgrade: " + e.getMessage());
    }
    if (userRepository.count() == 0) {
      System.out.println("No users found in the database. Creating default ADMIN user...");

      User admin = new User();
      admin.setUsername(ADMIN_USERNAME);
      admin.setEmail(ADMIN_EMAIL);
      admin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
      admin.setRole(User.Role.ADMIN);
      userRepository.save(admin);
      System.out.println("Admin user created, username and password taken from the .env file");
    }
  }
}
