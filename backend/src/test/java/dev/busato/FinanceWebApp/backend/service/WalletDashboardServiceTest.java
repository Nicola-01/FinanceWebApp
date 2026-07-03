package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import dev.busato.FinanceWebApp.backend.dto.SubscriptionResponse;
import dev.busato.FinanceWebApp.backend.dto.TagResponse;
import dev.busato.FinanceWebApp.backend.dto.TransactionResponse;
import dev.busato.FinanceWebApp.backend.dto.WalletDashboardResponse;
import dev.busato.FinanceWebApp.backend.dto.WalletResponse;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

@ExtendWith(MockitoExtension.class)
class WalletDashboardServiceTest {

  @Mock private WalletService walletService;
  @Mock private TransactionService transactionService;
  @Mock private SubscriptionService subscriptionService;
  @Mock private TagService tagService;

  @InjectMocks private WalletDashboardService walletDashboardService;

  @Test
  void getDashboard_composesAllFourSources_withCorrectParamOrder() {
    UUID walletId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();

    WalletResponse wallet = WalletResponse.builder().name("Main").build();
    List<TransactionResponse> txs = List.of(TransactionResponse.builder().name("tx").build());
    List<SubscriptionResponse> subs = List.of(SubscriptionResponse.builder().name("sub").build());
    List<TagResponse> tags = List.of(TagResponse.builder().name("tag").build());

    when(walletService.getWallet(userId, walletId)).thenReturn(wallet);
    when(transactionService.getTransactionsByWalletID(walletId, userId)).thenReturn(txs);
    when(subscriptionService.getSubscriptionsByWalletID(walletId, userId)).thenReturn(subs);
    when(tagService.getTags(walletId, userId)).thenReturn(tags);

    WalletDashboardResponse result = walletDashboardService.getDashboard(walletId, userId);

    assertSame(wallet, result.getWallet());
    assertSame(txs, result.getTransactions());
    assertSame(subs, result.getSubscriptions());
    assertSame(tags, result.getTags());
    assertEquals("Main", result.getWallet().getName());

    // Param order is intentionally inconsistent across services — verify exactly.
    verify(walletService).getWallet(userId, walletId);
    verify(transactionService).getTransactionsByWalletID(walletId, userId);
    verify(subscriptionService).getSubscriptionsByWalletID(walletId, userId);
    verify(tagService).getTags(walletId, userId);
  }

  @Test
  void getDashboard_propagatesAccessDenied_andSkipsRemainingDelegates() {
    UUID walletId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();

    when(walletService.getWallet(userId, walletId))
        .thenThrow(new AccessDeniedException("no read access"));

    assertThrows(
        AccessDeniedException.class, () -> walletDashboardService.getDashboard(walletId, userId));

    // Short-circuit: once the first guarded delegate denies, we never touch the rest.
    verifyNoInteractions(transactionService, subscriptionService, tagService);
  }
}
