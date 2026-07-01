package dev.busato.FinanceWebApp.backend.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.busato.FinanceWebApp.backend.dto.TransactionRequest;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import dev.busato.FinanceWebApp.backend.security.JwtService;
import java.math.BigDecimal;
import java.util.HashMap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

public class IdorIntegrationTest extends BaseIntegrationTest {

  @Autowired private JwtService jwtService;

  @Autowired private UserRepository userRepository;

  @Autowired private WalletRepository walletRepository;

  @Autowired private WalletAccessRepository walletAccessRepository;

  private User testUser;
  private Wallet testWallet;
  private String validJwt;

  @BeforeEach
  void setUp() {
    // Clear DB for clean state since we're using real H2
    walletAccessRepository.deleteAll();
    walletRepository.deleteAll();
    userRepository.deleteAll();

    // 1. Create a real user
    testUser = new User();
    testUser.setUsername("testuser@example.com");
    testUser.setEmail("testuser@example.com");
    testUser.setPassword("password");
    testUser.setRole(User.Role.USER);
    testUser.setTokenVersion(1);
    testUser = userRepository.save(testUser);

    // 2. Create a real wallet
    testWallet = new Wallet();
    testWallet.setName("Test Wallet");
    testWallet.setCurrency("EUR");
    testWallet = walletRepository.save(testWallet);

    // 3. Generate real JWT for user
    validJwt = jwtService.generateToken(new HashMap<>(), testUser);
  }

  @Test
  void getTransactions_WithoutWalletAccess_Returns404() throws Exception {
    // User has NO access to testWallet in DB
    mockMvc
        .perform(
            get("/api/transactions/" + testWallet.getId())
                .header("Authorization", "Bearer " + validJwt))
        .andExpect(status().isNotFound()); // WalletSecurity throws WalletNotFoundException
  }

  @Test
  void getTransactions_WithViewerAccess_Returns200() throws Exception {
    // Grant VIEWER access
    WalletAccess access = new WalletAccess();
    access.setId(new WalletAccess.WalletAccessId(testUser.getId(), testWallet.getId()));
    access.setRole(WalletAccess.WalletRole.VIEWER);
    access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    access.setUser(testUser);
    access.setWallet(testWallet);
    walletAccessRepository.save(access);

    mockMvc
        .perform(
            get("/api/transactions/" + testWallet.getId())
                .header("Authorization", "Bearer " + validJwt))
        .andExpect(status().isOk());
  }

  @Test
  void createTransaction_WithViewerAccess_Returns403() throws Exception {
    // Grant VIEWER access
    WalletAccess access = new WalletAccess();
    access.setId(new WalletAccess.WalletAccessId(testUser.getId(), testWallet.getId()));
    access.setRole(WalletAccess.WalletRole.VIEWER);
    access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    access.setUser(testUser);
    access.setWallet(testWallet);
    walletAccessRepository.save(access);

    TransactionRequest request = TransactionRequest.builder().build();
    request.setName("Test Transaction");
    request.setAmount(new BigDecimal("10.00"));
    request.setType("EXPENSE");

    mockMvc
        .perform(
            post("/api/transactions/" + testWallet.getId())
                .header("Authorization", "Bearer " + validJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isForbidden());
  }

  @Test
  void createTransaction_WithPendingInvite_Returns403() throws Exception {
    // Grant EDITOR access but PENDING status
    WalletAccess access = new WalletAccess();
    access.setId(new WalletAccess.WalletAccessId(testUser.getId(), testWallet.getId()));
    access.setRole(WalletAccess.WalletRole.EDITOR);
    access.setStatus(WalletAccess.InvitationStatus.PENDING);
    access.setUser(testUser);
    access.setWallet(testWallet);
    walletAccessRepository.save(access);

    TransactionRequest request = TransactionRequest.builder().build();
    request.setName("Test Transaction");
    request.setAmount(new BigDecimal("10.00"));
    request.setType("EXPENSE");

    mockMvc
        .perform(
            post("/api/transactions/" + testWallet.getId())
                .header("Authorization", "Bearer " + validJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isForbidden());
  }

  @Test
  void updateTransaction_WithViewerAccess_Returns403() throws Exception {
    // Grant VIEWER access
    WalletAccess access = new WalletAccess();
    access.setId(new WalletAccess.WalletAccessId(testUser.getId(), testWallet.getId()));
    access.setRole(WalletAccess.WalletRole.VIEWER);
    access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    access.setUser(testUser);
    access.setWallet(testWallet);
    walletAccessRepository.save(access);

    TransactionRequest request = TransactionRequest.builder().build();
    request.setName("Updated Transaction");
    request.setAmount(new BigDecimal("20.00"));
    request.setType("EXPENSE");

    mockMvc
        .perform(
            put("/api/transactions/" + testWallet.getId() + "/" + java.util.UUID.randomUUID())
                .header("Authorization", "Bearer " + validJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isForbidden());
  }

  @Test
  void deleteTransaction_WithViewerAccess_Returns403() throws Exception {
    // Grant VIEWER access
    WalletAccess access = new WalletAccess();
    access.setId(new WalletAccess.WalletAccessId(testUser.getId(), testWallet.getId()));
    access.setRole(WalletAccess.WalletRole.VIEWER);
    access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    access.setUser(testUser);
    access.setWallet(testWallet);
    walletAccessRepository.save(access);

    mockMvc
        .perform(
            delete("/api/transactions/" + testWallet.getId() + "/" + java.util.UUID.randomUUID())
                .header("Authorization", "Bearer " + validJwt))
        .andExpect(status().isForbidden());
  }

  // =================================================================================================
  // TAG CONTROLLER TESTS
  // =================================================================================================

  @Test
  void getTags_WithoutWalletAccess_Returns404() throws Exception {
    // User has NO access to testWallet in DB
    mockMvc
        .perform(
            get("/api/tags/" + testWallet.getId()).header("Authorization", "Bearer " + validJwt))
        .andExpect(status().isNotFound());
  }

  @Test
  void getTags_WithViewerAccess_Returns200() throws Exception {
    // Grant VIEWER access
    WalletAccess access = new WalletAccess();
    access.setId(new WalletAccess.WalletAccessId(testUser.getId(), testWallet.getId()));
    access.setRole(WalletAccess.WalletRole.VIEWER);
    access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    access.setUser(testUser);
    access.setWallet(testWallet);
    walletAccessRepository.save(access);

    mockMvc
        .perform(
            get("/api/tags/" + testWallet.getId()).header("Authorization", "Bearer " + validJwt))
        .andExpect(status().isOk());
  }

  @Test
  void createTag_WithViewerAccess_Returns403() throws Exception {
    // Grant VIEWER access
    WalletAccess access = new WalletAccess();
    access.setId(new WalletAccess.WalletAccessId(testUser.getId(), testWallet.getId()));
    access.setRole(WalletAccess.WalletRole.VIEWER);
    access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    access.setUser(testUser);
    access.setWallet(testWallet);
    walletAccessRepository.save(access);

    dev.busato.FinanceWebApp.backend.dto.TagRequest request =
        dev.busato.FinanceWebApp.backend.dto.TagRequest.builder().build();
    request.setName("New Tag");
    request.setIcon("icon");
    request.setColorHex("#000000");

    mockMvc
        .perform(
            post("/api/tags/" + testWallet.getId())
                .header("Authorization", "Bearer " + validJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isForbidden());
  }

  @Test
  void updateTag_WithViewerAccess_Returns403() throws Exception {
    // Grant VIEWER access
    WalletAccess access = new WalletAccess();
    access.setId(new WalletAccess.WalletAccessId(testUser.getId(), testWallet.getId()));
    access.setRole(WalletAccess.WalletRole.VIEWER);
    access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    access.setUser(testUser);
    access.setWallet(testWallet);
    walletAccessRepository.save(access);

    dev.busato.FinanceWebApp.backend.dto.TagRequest request =
        dev.busato.FinanceWebApp.backend.dto.TagRequest.builder().build();
    request.setName("Updated Tag");
    request.setIcon("icon");
    request.setColorHex("#FFFFFF");

    mockMvc
        .perform(
            put("/api/tags/" + testWallet.getId() + "/SomeTag")
                .header("Authorization", "Bearer " + validJwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isForbidden());
  }

  @Test
  void deleteTag_WithViewerAccess_Returns403() throws Exception {
    // Grant VIEWER access
    WalletAccess access = new WalletAccess();
    access.setId(new WalletAccess.WalletAccessId(testUser.getId(), testWallet.getId()));
    access.setRole(WalletAccess.WalletRole.VIEWER);
    access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    access.setUser(testUser);
    access.setWallet(testWallet);
    walletAccessRepository.save(access);

    mockMvc
        .perform(
            delete("/api/tags/" + testWallet.getId() + "/SomeTag")
                .header("Authorization", "Bearer " + validJwt))
        .andExpect(status().isForbidden());
  }
}
