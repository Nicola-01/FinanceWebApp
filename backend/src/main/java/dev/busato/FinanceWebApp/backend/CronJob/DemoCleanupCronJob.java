package dev.busato.FinanceWebApp.backend.CronJob;

import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import dev.busato.FinanceWebApp.backend.scheduling.JobFrequency;
import dev.busato.FinanceWebApp.backend.scheduling.ManagedJob;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Deletes demo users and their owned wallets. Only available when demo mode is on ({@code
 * application.demo.enabled=true}); otherwise it is neither scheduled nor listed. Default schedule:
 * daily at 03:00 (editable in the admin System tab).
 */
@Component
@RequiredArgsConstructor
public class DemoCleanupCronJob implements ManagedJob {

  private final UserRepository userRepository;
  private final WalletAccessRepository walletAccessRepository;
  private final WalletRepository walletRepository;

  @Value("${application.demo.enabled:false}")
  private boolean demoEnabled;

  @Override
  public String key() {
    return "demo-cleanup";
  }

  @Override
  public String displayName() {
    return "Demo Cleanup";
  }

  @Override
  public boolean available() {
    return demoEnabled;
  }

  @Override
  public ScheduleDefaults defaults() {
    return new ScheduleDefaults(JobFrequency.DAILY, 3, 0, null);
  }

  @Override
  @Transactional
  public String run() {
    List<User> demoUsers = userRepository.findAllByDemoTrue();

    if (demoUsers.isEmpty()) {
      return "No demo users to delete";
    }

    int count = demoUsers.size();

    for (User demoUser : demoUsers) {
      // 1. Find all wallets owned by this demo user
      List<WalletAccess> accesses = walletAccessRepository.findAllByUserId(demoUser.getId());
      List<UUID> walletIds =
          accesses.stream()
              .filter(a -> a.getRole() == WalletAccess.WalletRole.OWNER)
              .map(a -> a.getWallet().getId())
              .toList();

      // 2. Delete the user (cascades to wallet_access entries)
      userRepository.delete(demoUser);

      // 3. Delete owned wallets (cascades to tags, transactions, and remaining accesses)
      walletRepository.deleteAllById(walletIds);
    }

    return "Deleted " + count + " demo user(s)";
  }
}
