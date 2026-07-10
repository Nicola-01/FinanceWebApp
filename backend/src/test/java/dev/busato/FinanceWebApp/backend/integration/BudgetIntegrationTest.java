package dev.busato.FinanceWebApp.backend.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import dev.busato.FinanceWebApp.backend.dto.BudgetRequest;
import dev.busato.FinanceWebApp.backend.model.Budget;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

/** End-to-end budget CRUD + computed status + per-wallet RBAC on the real (H2) stack. */
public class BudgetIntegrationTest extends BaseIntegrationTest {

  @Autowired private JwtService jwtService;
  @Autowired private UserRepository userRepository;
  @Autowired private WalletRepository walletRepository;
  @Autowired private WalletAccessRepository walletAccessRepository;
  @Autowired private TagRepository tagRepository;
  @Autowired private TransactionRepository transactionRepository;

  private Wallet wallet;
  private Tag food;
  private String editorJwt;
  private String viewerJwt;
  private final LocalDate today = LocalDate.now();

  @BeforeEach
  void setUp() {
    User editor = user("budget-editor@example.com");
    User viewer = user("budget-viewer@example.com");

    wallet = new Wallet();
    wallet.setName("Budget Wallet");
    wallet.setCurrency("EUR");
    wallet = walletRepository.save(wallet);

    access(editor, WalletAccess.WalletRole.EDITOR);
    access(viewer, WalletAccess.WalletRole.VIEWER);

    food = tagRepository.save(Tag.builder().name("Food").wallet(wallet).build());
    Tag restaurants =
        tagRepository.save(Tag.builder().name("Restaurants").wallet(wallet).parent(food).build());

    // 50 (Food) + 30 (Restaurants child) this period; income and old rows must not count.
    tx("Groceries", "50.00", Transaction.Type.EXPENSE, food, today);
    tx("Dinner", "30.00", Transaction.Type.EXPENSE, restaurants, today);
    tx("Salary", "2000.00", Transaction.Type.INCOME, null, today);
    tx("Old", "99.00", Transaction.Type.EXPENSE, food, today.minusMonths(2));

    editorJwt = jwtService.generateToken(new HashMap<>(), editor);
    viewerJwt = jwtService.generateToken(new HashMap<>(), viewer);
  }

  private User user(String email) {
    User u = new User();
    u.setUsername(email);
    u.setEmail(email);
    u.setPassword("password");
    u.setRole(User.Role.USER);
    u.setTokenVersion(1);
    return userRepository.save(u);
  }

  private void access(User user, WalletAccess.WalletRole role) {
    WalletAccess a = new WalletAccess();
    a.setId(new WalletAccess.WalletAccessId(user.getId(), wallet.getId()));
    a.setRole(role);
    a.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    a.setUser(user);
    a.setWallet(wallet);
    walletAccessRepository.save(a);
  }

  private void tx(String name, String amount, Transaction.Type type, Tag tag, LocalDate date) {
    transactionRepository.save(
        Transaction.builder()
            .wallet(wallet)
            .name(name)
            .amount(new BigDecimal(amount))
            .originalAmount(new BigDecimal(amount))
            .type(type)
            .tag(tag)
            .transactionDate(date)
            .build());
  }

  private BudgetRequest monthlyFoodBudget() {
    return BudgetRequest.builder()
        .name("Food budget")
        .tagName("Food")
        .limitAmount(new BigDecimal("100.00"))
        .periodType(Budget.PeriodType.MONTHLY)
        .startDate(today.withDayOfMonth(1))
        .build();
  }

  @Test
  void createAndList_computesSubtreeSpentAndStatus() throws Exception {
    mockMvc
        .perform(
            post("/api/budgets/" + wallet.getId())
                .header("Authorization", "Bearer " + editorJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(monthlyFoodBudget())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.spent").value(80.0)) // 50 + 30 (child tag), not 99 (old month)
        .andExpect(jsonPath("$.percentUsed").value(80))
        .andExpect(jsonPath("$.status").value("WARNING"))
        .andExpect(jsonPath("$.crossedThresholds[0]").value(80))
        .andExpect(jsonPath("$.active").value(true));

    mockMvc
        .perform(
            get("/api/budgets/" + wallet.getId()).header("Authorization", "Bearer " + viewerJwt))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].name").value("Food budget"))
        .andExpect(jsonPath("$[0].tagName").value("Food"))
        .andExpect(jsonPath("$[0].alertThresholds[0]").value(80));
  }

  @Test
  void viewer_cannotWrite() throws Exception {
    mockMvc
        .perform(
            post("/api/budgets/" + wallet.getId())
                .header("Authorization", "Bearer " + viewerJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(monthlyFoodBudget())))
        .andExpect(status().isForbidden());
  }

  @Test
  void nonMember_getsNotFound() throws Exception {
    User outsider = user("outsider@example.com");
    String outsiderJwt = jwtService.generateToken(new HashMap<>(), outsider);
    mockMvc
        .perform(
            get("/api/budgets/" + wallet.getId()).header("Authorization", "Bearer " + outsiderJwt))
        .andExpect(status().isNotFound());
  }

  @Test
  void duplicateRecurring_conflicts_customMissingEndDate_isConflict() throws Exception {
    mockMvc
        .perform(
            post("/api/budgets/" + wallet.getId())
                .header("Authorization", "Bearer " + editorJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(monthlyFoodBudget())))
        .andExpect(status().isOk());

    mockMvc
        .perform(
            post("/api/budgets/" + wallet.getId())
                .header("Authorization", "Bearer " + editorJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(monthlyFoodBudget())))
        .andExpect(status().isConflict());

    // Service-level validation (CUSTOM requires an end date) also surfaces as
    // IllegalArgumentException,
    // which this codebase's GlobalExceptionHandler maps to 409 CONFLICT (not 400) — same as every
    // other service-level IllegalArgumentException in the app (see e.g. UserService,
    // WalletService).
    BudgetRequest custom = monthlyFoodBudget();
    custom.setPeriodType(Budget.PeriodType.CUSTOM);
    custom.setEndDate(null);
    mockMvc
        .perform(
            post("/api/budgets/" + wallet.getId())
                .header("Authorization", "Bearer " + editorJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(custom)))
        .andExpect(status().isConflict());
  }

  @Test
  void updateAndDelete_roundTrip() throws Exception {
    String body =
        mockMvc
            .perform(
                post("/api/budgets/" + wallet.getId())
                    .header("Authorization", "Bearer " + editorJwt)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(monthlyFoodBudget())))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse()
            .getContentAsString();
    String id = objectMapper.readTree(body).get("id").asText();

    BudgetRequest update = monthlyFoodBudget();
    update.setLimitAmount(new BigDecimal("500.00"));
    mockMvc
        .perform(
            put("/api/budgets/" + wallet.getId() + "/" + id)
                .header("Authorization", "Bearer " + editorJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(update)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.percentUsed").value(16)) // 80/500 floored
        .andExpect(jsonPath("$.status").value("OK"));

    mockMvc
        .perform(
            delete("/api/budgets/" + wallet.getId() + "/" + id)
                .header("Authorization", "Bearer " + editorJwt))
        .andExpect(status().isNoContent());

    mockMvc
        .perform(
            get("/api/budgets/" + wallet.getId()).header("Authorization", "Bearer " + editorJwt))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));
  }
}
