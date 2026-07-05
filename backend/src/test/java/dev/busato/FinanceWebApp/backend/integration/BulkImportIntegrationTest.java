package dev.busato.FinanceWebApp.backend.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.busato.FinanceWebApp.backend.dto.TagRequest;
import dev.busato.FinanceWebApp.backend.dto.TransactionRequest;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

/** End-to-end tests for the bulk-import endpoints against the real (H2) persistence layer. */
public class BulkImportIntegrationTest extends BaseIntegrationTest {

  @Autowired private JwtService jwtService;
  @Autowired private UserRepository userRepository;
  @Autowired private WalletRepository walletRepository;
  @Autowired private WalletAccessRepository walletAccessRepository;
  @Autowired private TagRepository tagRepository;
  @Autowired private TransactionRepository transactionRepository;

  private User testUser;
  private Wallet testWallet;
  private String validJwt;

  @BeforeEach
  void setUp() {
    testUser = new User();
    testUser.setUsername("bulkuser@example.com");
    testUser.setEmail("bulkuser@example.com");
    testUser.setPassword("password");
    testUser.setRole(User.Role.USER);
    testUser.setTokenVersion(1);
    testUser = userRepository.save(testUser);

    testWallet = new Wallet();
    testWallet.setName("Bulk Wallet");
    testWallet.setCurrency("EUR");
    testWallet = walletRepository.save(testWallet);

    // Grant EDITOR (write) access so the whole batch is authorized once.
    WalletAccess access = new WalletAccess();
    access.setId(new WalletAccess.WalletAccessId(testUser.getId(), testWallet.getId()));
    access.setRole(WalletAccess.WalletRole.EDITOR);
    access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    access.setUser(testUser);
    access.setWallet(testWallet);
    walletAccessRepository.save(access);

    validJwt = jwtService.generateToken(new HashMap<>(), testUser);
  }

  @Test
  void createTransactionsBulk_WithEditorAccess_PersistsAllRows() throws Exception {
    TransactionRequest r1 = TransactionRequest.builder().build();
    r1.setName("Groceries");
    r1.setAmount(new BigDecimal("50.00"));
    r1.setOriginalAmount(new BigDecimal("50.00"));
    r1.setType("EXPENSE");

    TransactionRequest r2 = TransactionRequest.builder().build();
    r2.setName("Salary");
    r2.setAmount(new BigDecimal("2000.00"));
    r2.setOriginalAmount(new BigDecimal("2000.00"));
    r2.setType("INCOME");

    mockMvc
        .perform(
            post("/api/transactions/" + testWallet.getId() + "/bulk")
                .header("Authorization", "Bearer " + validJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(List.of(r1, r2))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.created.length()").value(2))
        .andExpect(jsonPath("$.updated.length()").value(0))
        .andExpect(jsonPath("$.autoCreatedTags.length()").value(0))
        .andExpect(jsonPath("$.created[0].name").value("Groceries"))
        .andExpect(jsonPath("$.created[1].name").value("Salary"));

    assertEquals(2, transactionRepository.getAllByWalletId(testWallet.getId()).size());
  }

  @Test
  void createTagsBulk_ChildBeforeParent_ResolvesParentEndToEnd() throws Exception {
    // The child references its parent, which appears LATER in the input list. Naive input-order
    // insertion would fail (parent not yet created); the parent-safe two-pass ordering must
    // succeed.
    TagRequest child = TagRequest.builder().build();
    child.setName("SubFood");
    child.setParentName("Food");

    TagRequest parent = TagRequest.builder().build();
    parent.setName("Food");

    mockMvc
        .perform(
            post("/api/tags/" + testWallet.getId() + "/bulk")
                .header("Authorization", "Bearer " + validJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(List.of(child, parent))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.created.length()").value(2));

    Tag savedChild =
        tagRepository.findByNameIgnoreCaseAndWalletId("SubFood", testWallet.getId()).orElseThrow();
    assertNotNull(savedChild.getParent(), "Child tag should have its in-batch parent resolved");
    assertEquals("Food", savedChild.getParent().getName());
  }

  @Test
  void createTagsBulk_ExistingName_UpsertsInPlace() throws Exception {
    // Seed an existing tag, then bulk-import a row with the same name (different case) that carries
    // fresh styling. It must be reported as UPDATED and mutated in place, not duplicated.
    Tag seeded = new Tag();
    seeded.setName("Food");
    seeded.setIcon("old");
    seeded.setColorHex("#000000");
    seeded.setWallet(testWallet);
    tagRepository.save(seeded);

    TagRequest upsert = TagRequest.builder().build();
    upsert.setName("food");
    upsert.setIcon("burger");
    upsert.setColorHex("#ff0000");

    mockMvc
        .perform(
            post("/api/tags/" + testWallet.getId() + "/bulk")
                .header("Authorization", "Bearer " + validJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(List.of(upsert))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.created.length()").value(0))
        .andExpect(jsonPath("$.updated.length()").value(1))
        .andExpect(jsonPath("$.updated[0].icon").value("burger"));

    // Still exactly one "Food" tag, now carrying the refreshed styling.
    assertEquals(1, tagRepository.getTagsByWalletId(testWallet.getId()).size());
    Tag reloaded =
        tagRepository.findByNameIgnoreCaseAndWalletId("Food", testWallet.getId()).orElseThrow();
    assertEquals("burger", reloaded.getIcon());
    assertEquals("#ff0000", reloaded.getColorHex());
  }

  @Test
  void createTransactionsBulk_AutoCreatesTag_ThenDedupUpdatesOnSecondCall() throws Exception {
    // First import: the referenced tag does not exist, so it is auto-created and reported.
    TransactionRequest first = TransactionRequest.builder().build();
    first.setName("Coffee");
    first.setAmount(new BigDecimal("3.00"));
    first.setOriginalAmount(new BigDecimal("3.00"));
    first.setType("EXPENSE");
    first.setTag("Cafe");
    first.setTransactionDate(LocalDate.of(2024, 1, 1));

    mockMvc
        .perform(
            post("/api/transactions/" + testWallet.getId() + "/bulk")
                .header("Authorization", "Bearer " + validJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(List.of(first))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.created.length()").value(1))
        .andExpect(jsonPath("$.updated.length()").value(0))
        .andExpect(jsonPath("$.autoCreatedTags.length()").value(1))
        .andExpect(jsonPath("$.autoCreatedTags[0].name").value("Cafe"))
        .andExpect(jsonPath("$.created[0].tag.name").value("Cafe"));

    assertNotNull(
        tagRepository.findByNameIgnoreCaseAndWalletId("Cafe", testWallet.getId()).orElse(null),
        "The referenced tag should have been auto-created");
    assertEquals(1, transactionRepository.getAllByWalletId(testWallet.getId()).size());

    // Second import: same name + tag + date but a new amount → dedup UPDATE (no new row, no new
    // tag).
    TransactionRequest second = TransactionRequest.builder().build();
    second.setName("Coffee");
    second.setAmount(new BigDecimal("9.99"));
    second.setOriginalAmount(new BigDecimal("9.99"));
    second.setType("EXPENSE");
    second.setTag("Cafe");
    second.setTransactionDate(LocalDate.of(2024, 1, 1));

    mockMvc
        .perform(
            post("/api/transactions/" + testWallet.getId() + "/bulk")
                .header("Authorization", "Bearer " + validJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(List.of(second))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.created.length()").value(0))
        .andExpect(jsonPath("$.updated.length()").value(1))
        .andExpect(jsonPath("$.autoCreatedTags.length()").value(0));

    // Still a single transaction, now carrying the overwritten amount.
    var all = transactionRepository.getAllByWalletId(testWallet.getId());
    assertEquals(1, all.size());
    assertEquals(0, new BigDecimal("9.99").compareTo(all.get(0).getAmount()));
  }
}
