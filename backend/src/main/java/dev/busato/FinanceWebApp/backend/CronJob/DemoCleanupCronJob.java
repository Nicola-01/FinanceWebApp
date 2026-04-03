package dev.busato.FinanceWebApp.backend.CronJob;

import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DemoCleanupCronJob {

    private final UserRepository userRepository;
    private final WalletAccessRepository walletAccessRepository;
    private final WalletRepository walletRepository;

    // Run every day at 3:00 AM
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupDemoUsers() {
        List<User> demoUsers = userRepository.findAllByDemoTrue();

        if (demoUsers.isEmpty()) {
            System.out.println("Demo cleanup: no demo users to delete.");
            return;
        }

        System.out.println("Demo cleanup: deleting " + demoUsers.size() + " demo user(s)...");

        for (User demoUser : demoUsers) {
            // 1. Find all wallets owned by this demo user
            List<WalletAccess> accesses = walletAccessRepository.findAllByUserId(demoUser.getId());
            List<UUID> walletIds = accesses.stream()
                    .filter(a -> a.getRole() == WalletAccess.WalletRole.OWNER)
                    .map(a -> a.getWallet().getId())
                    .toList();

            // 2. Delete the user (cascades to wallet_access entries)
            userRepository.delete(demoUser);

            // 3. Delete owned wallets (cascades to tags, transactions, and remaining accesses)
            walletRepository.deleteAllById(walletIds);
        }

        System.out.println("Demo cleanup: done.");
    }
}
