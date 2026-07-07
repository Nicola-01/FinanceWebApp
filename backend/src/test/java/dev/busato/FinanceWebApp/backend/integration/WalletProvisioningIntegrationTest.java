package dev.busato.FinanceWebApp.backend.integration;

import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.busato.FinanceWebApp.backend.dto.SubscriptionRequest;
import dev.busato.FinanceWebApp.backend.dto.TagRequest;
import dev.busato.FinanceWebApp.backend.dto.TransactionRequest;
import dev.busato.FinanceWebApp.backend.dto.WalletFullRequest;
import dev.busato.FinanceWebApp.backend.dto.WalletRequest;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.SubscriptionRepository;
import dev.busato.FinanceWebApp.backend.repository.TagRepository;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import dev.busato.FinanceWebApp.backend.security.JwtService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * End-to-end atomicity tests for {@code POST /api/wallets/full}. The inherited test-managed
 * transaction is suspended ({@code NOT_SUPPORTED}): asserting that the endpoint's own transaction
 * rolled back is only meaningful when the test does not wrap it, so persisted data is cleaned up
 * manually in {@link #tearDown()} instead.
 */
@Transactional(propagation = Propagation.NOT_SUPPORTED)
public class WalletProvisioningIntegrationTest extends BaseIntegrationTest {

  @Autowired private JwtService jwtService;
  @Autowired private UserRepository userRepository;
  @Autowired private WalletRepository walletRepository;
  @Autowired private WalletAccessRepository walletAccessRepository;
  @Autowired private TagRepository tagRepository;
  @Autowired private TransactionRepository transactionRepository;
  @Autowired private SubscriptionRepository subscriptionRepository;
  @Autowired private PlatformTransactionManager transactionManager;

  private static final String WALLET_NAME = "ProvisionTestWallet";

  private User testUser;
  private String validJwt;

  @BeforeEach
  void setUp() {
    testUser = new User();
    testUser.setUsername("provisionuser@example.com");
    testUser.setEmail("provisionuser@example.com");
    testUser.setPassword("password");
    testUser.setRole(User.Role.USER);
    testUser.setTokenVersion(1);
    testUser = userRepository.save(testUser);

    validJwt = jwtService.generateToken(new HashMap<>(), testUser);
  }

  @AfterEach
  void tearDown() {
    // Committed data must be removed by hand (no test transaction to roll back), inside an
    // explicit transaction because the class suspends the test-managed one. Same ordering as
    // WalletService.removeWallet: subscriptions first (outside the entity cascade), then the
    // wallet, which cascades tags, transactions and access rows.
    new TransactionTemplate(transactionManager)
        .executeWithoutResult(
            status -> {
              walletRepository.findAll().stream()
                  .filter(w -> WALLET_NAME.equals(w.getName()))
                  .forEach(
                      w -> {
                        subscriptionRepository.deleteAllByWalletId(w.getId());
                        walletRepository.delete(w);
                      });
              userRepository.delete(testUser);
            });
  }

  private WalletFullRequest fullDraft() {
    TagRequest food = TagRequest.builder().build();
    food.setName("Food");
    food.setIcon("burger");
    food.setColorHex("#ff0000");

    // Child listed before its parent: the tags stage must resolve in-batch parents.
    TagRequest subFood = TagRequest.builder().build();
    subFood.setName("SubFood");
    subFood.setParentName("Food");

    SubscriptionRequest netflix = SubscriptionRequest.builder().build();
    netflix.setName("Netflix");
    netflix.setTag("Streaming"); // not staged as a tag → auto-created
    netflix.setAmount(new BigDecimal("12.99"));
    netflix.setType("EXPENSE");
    netflix.setFrequencyType("MONTHLY");
    netflix.setFrequencyInterval(1);
    netflix.setDuration("FOREVER");
    netflix.setStartDate(LocalDate.now().plusDays(10)); // future → nothing materializes yet

    TransactionRequest groceries = TransactionRequest.builder().build();
    groceries.setName("Groceries");
    groceries.setAmount(new BigDecimal("50.00"));
    groceries.setOriginalAmount(new BigDecimal("50.00"));
    groceries.setType("EXPENSE");
    groceries.setTag("Food");
    groceries.setTransactionDate(LocalDate.of(2024, 1, 1));

    return WalletFullRequest.builder()
        .wallet(WalletRequest.builder().name(WALLET_NAME).currency("EUR").build())
        .tags(List.of(subFood, food))
        .subscriptions(List.of(netflix))
        .transactions(List.of(groceries))
        .build();
  }

  private Wallet findProvisionedWallet() {
    return walletRepository.findAll().stream()
        .filter(w -> WALLET_NAME.equals(w.getName()))
        .findFirst()
        .orElse(null);
  }

  @Test
  void createWalletFull_FullDraft_PersistsEverything() throws Exception {
    mockMvc
        .perform(
            post("/api/wallets/full")
                .header("Authorization", "Bearer " + validJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(fullDraft())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.wallet.id").isNotEmpty())
        .andExpect(jsonPath("$.wallet.name").value(WALLET_NAME))
        .andExpect(jsonPath("$.tags.created.length()").value(2))
        .andExpect(jsonPath("$.subscriptions.created.length()").value(1))
        .andExpect(jsonPath("$.subscriptions.autoCreatedTags.length()").value(1))
        .andExpect(jsonPath("$.subscriptions.autoCreatedTags[0].name").value("Streaming"))
        .andExpect(jsonPath("$.transactions.created.length()").value(1))
        .andExpect(jsonPath("$.transactions.created[0].tag.name").value("Food"));

    Wallet wallet = findProvisionedWallet();
    assertNotNull(wallet, "The wallet should have been persisted");

    WalletAccess access =
        walletAccessRepository
            .findByUserIdAndWalletId(testUser.getId(), wallet.getId())
            .orElseThrow();
    assertEquals(WalletAccess.WalletRole.OWNER, access.getRole());
    assertEquals(WalletAccess.InvitationStatus.ACCEPTED, access.getStatus());

    // Staged tags + the auto-created "Streaming" one; the in-batch parent is resolved.
    assertEquals(3, tagRepository.getTagsByWalletId(wallet.getId()).size());
    Tag subFood =
        tagRepository.findByNameIgnoreCaseAndWalletId("SubFood", wallet.getId()).orElseThrow();
    assertNotNull(subFood.getParent());
    assertEquals("Food", subFood.getParent().getName());

    assertEquals(1, transactionRepository.getAllByWalletId(wallet.getId()).size());
    assertEquals(1, subscriptionRepository.findAllByWalletId(wallet.getId()).size());
  }

  @Test
  void createWalletFull_InvalidTransactionRow_RollsBackEverything() throws Exception {
    long walletsBefore = walletRepository.count();
    long tagsBefore = tagRepository.count();
    long transactionsBefore = transactionRepository.count();
    long subscriptionsBefore = subscriptionRepository.count();

    WalletFullRequest draft = fullDraft();
    draft.getTransactions().get(0).setType("NOPE"); // invalid enum → row error in the last stage

    mockMvc
        .perform(
            post("/api/wallets/full")
                .header("Authorization", "Bearer " + validJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(draft)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.detail", startsWith("Transactions: Row 0:")));

    // The failing stage ran last: wallet, tags and subscription were already inserted in the
    // same transaction, and all of them must be gone.
    assertEquals(walletsBefore, walletRepository.count());
    assertEquals(tagsBefore, tagRepository.count());
    assertEquals(transactionsBefore, transactionRepository.count());
    assertEquals(subscriptionsBefore, subscriptionRepository.count());
  }

  @Test
  void createWalletFull_UnresolvableTagParent_RollsBackWallet() throws Exception {
    long walletsBefore = walletRepository.count();
    long tagsBefore = tagRepository.count();

    TagRequest orphan = TagRequest.builder().build();
    orphan.setName("Orphan");
    orphan.setParentName("Ghost"); // never staged, never resolvable

    WalletFullRequest draft =
        WalletFullRequest.builder()
            .wallet(WalletRequest.builder().name(WALLET_NAME).currency("EUR").build())
            .tags(List.of(orphan))
            .build();

    mockMvc
        .perform(
            post("/api/wallets/full")
                .header("Authorization", "Bearer " + validJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(draft)))
        .andExpect(status().isConflict())
        .andExpect(jsonPath("$.detail", startsWith("Tags: Row 0:")));

    assertEquals(walletsBefore, walletRepository.count());
    assertEquals(tagsBefore, tagRepository.count());
  }
}
