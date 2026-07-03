package dev.busato.FinanceWebApp.backend.CronJob;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class DemoCleanupCronJobTest {

  @Mock private UserRepository userRepository;
  @Mock private WalletAccessRepository walletAccessRepository;
  @Mock private WalletRepository walletRepository;

  @InjectMocks private DemoCleanupCronJob demoCleanupCronJob;

  private User demoUser;
  private Wallet demoWallet;

  @BeforeEach
  void setUp() {
    demoUser = new User();
    demoUser.setId(UUID.randomUUID());
    demoUser.setDemo(true);

    demoWallet = new Wallet();
    demoWallet.setId(UUID.randomUUID());
  }

  @Test
  void run_NoDemoUsers_DoesNothingAndReportsIt() {
    when(userRepository.findAllByDemoTrue()).thenReturn(Collections.emptyList());

    String message = demoCleanupCronJob.run();

    assertEquals("No demo users to delete", message);
    verify(userRepository, never()).delete(any());
    verify(walletRepository, never()).deleteAllById(any());
  }

  @Test
  void run_DeletesUsersAndOwnedWallets() {
    when(userRepository.findAllByDemoTrue()).thenReturn(List.of(demoUser));

    WalletAccess access = new WalletAccess();
    access.setRole(WalletAccess.WalletRole.OWNER);
    access.setWallet(demoWallet);
    when(walletAccessRepository.findAllByUserId(demoUser.getId())).thenReturn(List.of(access));

    String message = demoCleanupCronJob.run();

    assertEquals("Deleted 1 demo user(s)", message);
    verify(userRepository, times(1)).delete(demoUser);
    verify(walletRepository, times(1)).deleteAllById(List.of(demoWallet.getId()));
  }

  @Test
  void run_DoesNotDeleteWalletsWhereUserIsNotOwner() {
    when(userRepository.findAllByDemoTrue()).thenReturn(List.of(demoUser));

    WalletAccess access = new WalletAccess();
    access.setRole(WalletAccess.WalletRole.VIEWER); // Not OWNER
    access.setWallet(demoWallet);
    when(walletAccessRepository.findAllByUserId(demoUser.getId())).thenReturn(List.of(access));

    demoCleanupCronJob.run();

    verify(userRepository, times(1)).delete(demoUser);
    verify(walletRepository, times(1)).deleteAllById(Collections.emptyList());
  }

  @Test
  void available_ReflectsDemoEnabledFlag() {
    ReflectionTestUtils.setField(demoCleanupCronJob, "demoEnabled", false);
    assertFalse(demoCleanupCronJob.available());

    ReflectionTestUtils.setField(demoCleanupCronJob, "demoEnabled", true);
    assertTrue(demoCleanupCronJob.available());

    assertEquals("demo-cleanup", demoCleanupCronJob.key());
    assertEquals("Demo Cleanup", demoCleanupCronJob.displayName());
  }
}
