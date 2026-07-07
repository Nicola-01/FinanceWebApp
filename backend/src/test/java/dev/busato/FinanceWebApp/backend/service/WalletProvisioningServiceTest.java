package dev.busato.FinanceWebApp.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import dev.busato.FinanceWebApp.backend.dto.SubscriptionBulkResponse;
import dev.busato.FinanceWebApp.backend.dto.SubscriptionRequest;
import dev.busato.FinanceWebApp.backend.dto.TagBulkResponse;
import dev.busato.FinanceWebApp.backend.dto.TagRequest;
import dev.busato.FinanceWebApp.backend.dto.TransactionBulkResponse;
import dev.busato.FinanceWebApp.backend.dto.TransactionRequest;
import dev.busato.FinanceWebApp.backend.dto.WalletFullRequest;
import dev.busato.FinanceWebApp.backend.dto.WalletFullResponse;
import dev.busato.FinanceWebApp.backend.dto.WalletRequest;
import dev.busato.FinanceWebApp.backend.dto.WalletResponse;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WalletProvisioningServiceTest {

  @Mock private WalletService walletService;
  @Mock private TagService tagService;
  @Mock private SubscriptionService subscriptionService;
  @Mock private TransactionService transactionService;

  @InjectMocks private WalletProvisioningService walletProvisioningService;

  private final UUID userId = UUID.randomUUID();
  private final UUID walletId = UUID.randomUUID();

  private WalletFullRequest request;
  private WalletResponse walletResponse;

  @BeforeEach
  void setUp() {
    request =
        WalletFullRequest.builder()
            .wallet(WalletRequest.builder().name("Trip").currency("EUR").build())
            .tags(List.of(TagRequest.builder().name("Food").build()))
            .subscriptions(List.of(SubscriptionRequest.builder().name("Netflix").build()))
            .transactions(List.of(TransactionRequest.builder().name("Groceries").build()))
            .build();
    walletResponse = WalletResponse.builder().id(walletId).name("Trip").build();
  }

  @Test
  void createWalletFull_RunsStagesInOrderAndAggregatesResponse() {
    TagBulkResponse tags = TagBulkResponse.builder().created(List.of()).updated(List.of()).build();
    SubscriptionBulkResponse subscriptions =
        SubscriptionBulkResponse.builder()
            .created(List.of())
            .updated(List.of())
            .autoCreatedTags(List.of())
            .build();
    TransactionBulkResponse transactions =
        TransactionBulkResponse.builder()
            .created(List.of())
            .updated(List.of())
            .autoCreatedTags(List.of())
            .build();

    when(walletService.createWallet(request.getWallet(), userId)).thenReturn(walletResponse);
    when(tagService.createTagsBulkInternal(request.getTags(), walletId)).thenReturn(tags);
    when(subscriptionService.createSubscriptionsBulkInternal(request.getSubscriptions(), walletId))
        .thenReturn(subscriptions);
    when(transactionService.createTransactionsBulkInternal(request.getTransactions(), walletId))
        .thenReturn(transactions);

    WalletFullResponse response = walletProvisioningService.createWalletFull(request, userId);

    assertSame(walletResponse, response.getWallet());
    assertSame(tags, response.getTags());
    assertSame(subscriptions, response.getSubscriptions());
    assertSame(transactions, response.getTransactions());

    // Tags must be persisted before the stages that reference them by name, so the user's
    // styled tags win over auto-created defaults.
    InOrder inOrder = inOrder(walletService, tagService, subscriptionService, transactionService);
    inOrder.verify(walletService).createWallet(request.getWallet(), userId);
    inOrder.verify(tagService).createTagsBulkInternal(request.getTags(), walletId);
    inOrder
        .verify(subscriptionService)
        .createSubscriptionsBulkInternal(request.getSubscriptions(), walletId);
    inOrder
        .verify(transactionService)
        .createTransactionsBulkInternal(request.getTransactions(), walletId);
  }

  @Test
  void createWalletFull_TagStageFails_PrefixesResourceAndSkipsLaterStages() {
    when(walletService.createWallet(request.getWallet(), userId)).thenReturn(walletResponse);
    when(tagService.createTagsBulkInternal(request.getTags(), walletId))
        .thenThrow(new IllegalArgumentException("Row 1: bad name"));

    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () -> walletProvisioningService.createWalletFull(request, userId));

    assertEquals("Tags: Row 1: bad name", ex.getMessage());
    verifyNoInteractions(subscriptionService, transactionService);
  }

  @Test
  void createWalletFull_SubscriptionStageFails_PrefixesResourceAndSkipsTransactions() {
    when(walletService.createWallet(request.getWallet(), userId)).thenReturn(walletResponse);
    when(tagService.createTagsBulkInternal(request.getTags(), walletId))
        .thenReturn(TagBulkResponse.builder().created(List.of()).updated(List.of()).build());
    when(subscriptionService.createSubscriptionsBulkInternal(request.getSubscriptions(), walletId))
        .thenThrow(new IllegalArgumentException("Row 0: bad frequency"));

    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () -> walletProvisioningService.createWalletFull(request, userId));

    assertEquals("Subscriptions: Row 0: bad frequency", ex.getMessage());
    verifyNoInteractions(transactionService);
  }

  @Test
  void createWalletFull_TransactionStageFails_PrefixesResource() {
    when(walletService.createWallet(request.getWallet(), userId)).thenReturn(walletResponse);
    when(tagService.createTagsBulkInternal(request.getTags(), walletId))
        .thenReturn(TagBulkResponse.builder().created(List.of()).updated(List.of()).build());
    when(subscriptionService.createSubscriptionsBulkInternal(request.getSubscriptions(), walletId))
        .thenReturn(
            SubscriptionBulkResponse.builder()
                .created(List.of())
                .updated(List.of())
                .autoCreatedTags(List.of())
                .build());
    when(transactionService.createTransactionsBulkInternal(request.getTransactions(), walletId))
        .thenThrow(new IllegalArgumentException("Row 2: invalid type"));

    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () -> walletProvisioningService.createWalletFull(request, userId));

    assertEquals("Transactions: Row 2: invalid type", ex.getMessage());
  }

  @Test
  void createWalletFull_WalletCreationFails_RunsNoStagesAndKeepsMessage() {
    when(walletService.createWallet(request.getWallet(), userId))
        .thenThrow(
            new IllegalArgumentException("The name must be between 3 and 25 characters long."));

    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () -> walletProvisioningService.createWalletFull(request, userId));

    // The wallet stage is not a bulk stage, so its message carries no resource prefix.
    assertEquals("The name must be between 3 and 25 characters long.", ex.getMessage());
    verifyNoInteractions(tagService, subscriptionService, transactionService);
  }

  @Test
  void createWalletFull_NonRowErrors_PropagateUnwrapped() {
    when(walletService.createWallet(request.getWallet(), userId)).thenReturn(walletResponse);
    when(tagService.createTagsBulkInternal(request.getTags(), walletId))
        .thenThrow(new IllegalStateException("boom"));

    IllegalStateException ex =
        assertThrows(
            IllegalStateException.class,
            () -> walletProvisioningService.createWalletFull(request, userId));

    assertEquals("boom", ex.getMessage());
  }

  @Test
  void createWalletFull_EmptyStages_ForwardsNullListsToInternals() {
    WalletFullRequest bare =
        WalletFullRequest.builder().wallet(WalletRequest.builder().name("Trip").build()).build();
    when(walletService.createWallet(bare.getWallet(), userId)).thenReturn(walletResponse);
    when(tagService.createTagsBulkInternal(eq(null), any(UUID.class)))
        .thenReturn(TagBulkResponse.builder().created(List.of()).updated(List.of()).build());
    when(subscriptionService.createSubscriptionsBulkInternal(eq(null), any(UUID.class)))
        .thenReturn(
            SubscriptionBulkResponse.builder()
                .created(List.of())
                .updated(List.of())
                .autoCreatedTags(List.of())
                .build());
    when(transactionService.createTransactionsBulkInternal(eq(null), any(UUID.class)))
        .thenReturn(
            TransactionBulkResponse.builder()
                .created(List.of())
                .updated(List.of())
                .autoCreatedTags(List.of())
                .build());

    WalletFullResponse response = walletProvisioningService.createWalletFull(bare, userId);

    // The bulk internals treat null lists as empty batches, so every section still reports.
    assertNotNull(response.getTags());
    assertNotNull(response.getSubscriptions());
    assertNotNull(response.getTransactions());
  }
}
