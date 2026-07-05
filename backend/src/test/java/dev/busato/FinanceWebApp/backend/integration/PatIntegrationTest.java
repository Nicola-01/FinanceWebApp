package dev.busato.FinanceWebApp.backend.integration;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.busato.FinanceWebApp.backend.dto.TransactionRequest;
import dev.busato.FinanceWebApp.backend.model.PersonalAccessToken;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.PersonalAccessTokenRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import dev.busato.FinanceWebApp.backend.service.PatService;
import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

public class PatIntegrationTest extends BaseIntegrationTest {

  @Autowired private UserRepository userRepository;

  @Autowired private WalletRepository walletRepository;

  @Autowired private WalletAccessRepository walletAccessRepository;

  @Autowired private PersonalAccessTokenRepository patRepository;

  @Autowired private PatService patService;

  private User testUser;
  private Wallet testWallet;
  private String readOnlyPatPlain;
  private String readWritePatPlain;

  @BeforeEach
  void setUp() {
    walletAccessRepository.deleteAll();
    patRepository.deleteAll();
    walletRepository.deleteAll();
    userRepository.deleteAll();

    // 1. Create a real user
    testUser = new User();
    testUser.setUsername("patuser@example.com");
    testUser.setEmail("patuser@example.com");
    testUser.setPassword("password");
    testUser.setRole(User.Role.USER);
    testUser.setTokenVersion(1);
    testUser = userRepository.save(testUser);

    // 2. Create a real wallet
    testWallet = new Wallet();
    testWallet.setName("PAT Wallet");
    testWallet.setCurrency("EUR");
    testWallet = walletRepository.save(testWallet);

    // Grant OWNER access to user
    WalletAccess access = new WalletAccess();
    access.setId(new WalletAccess.WalletAccessId(testUser.getId(), testWallet.getId()));
    access.setRole(WalletAccess.WalletRole.OWNER);
    access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    access.setUser(testUser);
    access.setWallet(testWallet);
    walletAccessRepository.save(access);

    // 3. Create a READ-ONLY PAT
    readOnlyPatPlain = "fin_pat_read_" + UUID.randomUUID().toString();
    PersonalAccessToken readOnlyPat = new PersonalAccessToken();
    readOnlyPat.setName("Read Only Token");
    readOnlyPat.setTokenHash(PatService.hashToken(readOnlyPatPlain));
    readOnlyPat.setTokenPrefix("fin_pat_read");
    readOnlyPat.setUser(testUser);
    readOnlyPat.setWalletPermissions(
        "[{\"walletId\":\"" + testWallet.getId() + "\",\"permissions\":[\"READ\"]}]");
    patRepository.save(readOnlyPat);

    // 4. Create a READ-WRITE PAT
    readWritePatPlain = "fin_pat_writ_" + UUID.randomUUID().toString();
    PersonalAccessToken readWritePat = new PersonalAccessToken();
    readWritePat.setName("Read Write Token");
    readWritePat.setTokenHash(PatService.hashToken(readWritePatPlain));
    readWritePat.setTokenPrefix("fin_pat_writ");
    readWritePat.setUser(testUser);
    readWritePat.setWalletPermissions(
        "[{\"walletId\":\"" + testWallet.getId() + "\",\"permissions\":[\"READ\",\"WRITE\"]}]");
    patRepository.save(readWritePat);
  }

  @Test
  void getTransactions_WithReadOnlyPat_Returns200() throws Exception {
    mockMvc
        .perform(
            get("/api/transactions/" + testWallet.getId())
                .header("Authorization", "Bearer " + readOnlyPatPlain))
        .andExpect(status().isOk());
  }

  @Test
  void getTransactions_WithPausedPat_Returns401() throws Exception {
    // Create a paused PAT that otherwise grants READ access to the wallet
    String pausedPatPlain = "fin_pat_paus_" + UUID.randomUUID();
    PersonalAccessToken pausedPat = new PersonalAccessToken();
    pausedPat.setName("Paused Token");
    pausedPat.setTokenHash(PatService.hashToken(pausedPatPlain));
    pausedPat.setTokenPrefix("fin_pat_paus");
    pausedPat.setUser(testUser);
    pausedPat.setWalletPermissions(
        "[{\"walletId\":\"" + testWallet.getId() + "\",\"permissions\":[\"READ\"]}]");
    pausedPat.setPaused(true);
    patRepository.save(pausedPat);

    mockMvc
        .perform(
            get("/api/transactions/" + testWallet.getId())
                .header("Authorization", "Bearer " + pausedPatPlain))
        .andExpect(status().isUnauthorized());
  }

  @Test
  void bulkDelete_RemovesOnlyCallerOwnedTokens() {
    // Create a second user who owns a token
    User user2 = new User();
    user2.setUsername("patuser2@example.com");
    user2.setEmail("patuser2@example.com");
    user2.setPassword("password");
    user2.setRole(User.Role.USER);
    user2.setTokenVersion(1);
    user2 = userRepository.save(user2);

    PersonalAccessToken otherUsersToken = new PersonalAccessToken();
    otherUsersToken.setName("Other User Token");
    otherUsersToken.setTokenHash(PatService.hashToken("fin_pat_other_" + UUID.randomUUID()));
    otherUsersToken.setTokenPrefix("fin_pat_othe");
    otherUsersToken.setUser(user2);
    otherUsersToken.setWalletPermissions("[]");
    otherUsersToken = patRepository.save(otherUsersToken);

    // testUser owns readOnlyPat + readWritePat (from setUp)
    java.util.List<PersonalAccessToken> testUserTokens =
        patRepository.findAllByUserId(testUser.getId());
    java.util.List<UUID> idsToDelete = new java.util.ArrayList<>();
    for (PersonalAccessToken t : testUserTokens) {
      idsToDelete.add(t.getId());
    }
    // Also ask to delete the other user's token — must be ignored (not owned by testUser)
    idsToDelete.add(otherUsersToken.getId());

    patService.bulkDeleteTokens(idsToDelete, testUser.getId());

    // testUser's tokens are gone
    org.junit.jupiter.api.Assertions.assertTrue(
        patRepository.findAllByUserId(testUser.getId()).isEmpty());
    // The other user's token survives despite being in the id list
    org.junit.jupiter.api.Assertions.assertTrue(
        patRepository.findById(otherUsersToken.getId()).isPresent());
  }

  @Test
  void bulkSetPaused_PausesOnlyCallerOwnedTokensAndReturnsThem() {
    // Create a second user who owns a token
    User user2 = new User();
    user2.setUsername("patuser2@example.com");
    user2.setEmail("patuser2@example.com");
    user2.setPassword("password");
    user2.setRole(User.Role.USER);
    user2.setTokenVersion(1);
    user2 = userRepository.save(user2);

    PersonalAccessToken otherUsersToken = new PersonalAccessToken();
    otherUsersToken.setName("Other User Token");
    otherUsersToken.setTokenHash(PatService.hashToken("fin_pat_other_" + UUID.randomUUID()));
    otherUsersToken.setTokenPrefix("fin_pat_othe");
    otherUsersToken.setUser(user2);
    otherUsersToken.setWalletPermissions("[]");
    otherUsersToken = patRepository.save(otherUsersToken);

    // testUser owns readOnlyPat + readWritePat (from setUp)
    java.util.List<PersonalAccessToken> testUserTokens =
        patRepository.findAllByUserId(testUser.getId());
    java.util.List<UUID> idsToPause = new java.util.ArrayList<>();
    for (PersonalAccessToken t : testUserTokens) {
      idsToPause.add(t.getId());
    }
    // Also ask to pause the other user's token — must be ignored (not owned by testUser)
    idsToPause.add(otherUsersToken.getId());

    java.util.List<dev.busato.FinanceWebApp.backend.dto.PatResponse> updated =
        patService.bulkSetPaused(idsToPause, testUser.getId(), true);

    // Only the caller-owned tokens are returned (foreign id silently ignored)
    org.junit.jupiter.api.Assertions.assertEquals(testUserTokens.size(), updated.size());
    for (dev.busato.FinanceWebApp.backend.dto.PatResponse r : updated) {
      org.junit.jupiter.api.Assertions.assertTrue(r.isPaused());
    }

    // testUser's tokens are paused in the DB
    for (PersonalAccessToken t : testUserTokens) {
      org.junit.jupiter.api.Assertions.assertTrue(
          patRepository.findById(t.getId()).orElseThrow().isPaused());
    }
    // The other user's token is untouched (not paused)
    org.junit.jupiter.api.Assertions.assertFalse(
        patRepository.findById(otherUsersToken.getId()).orElseThrow().isPaused());
  }

  @Test
  void bulkSetPaused_Resume_ClearsPausedFlagOnCallerTokens() {
    java.util.List<PersonalAccessToken> testUserTokens =
        patRepository.findAllByUserId(testUser.getId());
    java.util.List<UUID> ids = new java.util.ArrayList<>();
    for (PersonalAccessToken t : testUserTokens) {
      ids.add(t.getId());
    }

    // Pause them all, then resume via bulk
    patService.bulkSetPaused(ids, testUser.getId(), true);
    java.util.List<dev.busato.FinanceWebApp.backend.dto.PatResponse> resumed =
        patService.bulkSetPaused(ids, testUser.getId(), false);

    org.junit.jupiter.api.Assertions.assertEquals(testUserTokens.size(), resumed.size());
    for (PersonalAccessToken t : testUserTokens) {
      org.junit.jupiter.api.Assertions.assertFalse(
          patRepository.findById(t.getId()).orElseThrow().isPaused());
    }
  }

  @Test
  void bulkPause_ViaHttp_Returns200AndPausesTokens() throws Exception {
    java.util.List<PersonalAccessToken> testUserTokens =
        patRepository.findAllByUserId(testUser.getId());
    java.util.List<UUID> ids = new java.util.ArrayList<>();
    for (PersonalAccessToken t : testUserTokens) {
      ids.add(t.getId());
    }

    dev.busato.FinanceWebApp.backend.dto.PatBulkPauseRequest request =
        new dev.busato.FinanceWebApp.backend.dto.PatBulkPauseRequest();
    request.setIds(ids);
    request.setPaused(true);

    mockMvc
        .perform(
            post("/api/tokens/bulk-pause")
                .header("Authorization", "Bearer " + readWritePatPlain)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk());

    for (PersonalAccessToken t : testUserTokens) {
      org.junit.jupiter.api.Assertions.assertTrue(
          patRepository.findById(t.getId()).orElseThrow().isPaused());
    }
  }

  @Test
  void setPaused_PauseThenResume_PersistsFlag() {
    java.util.List<PersonalAccessToken> tokens = patRepository.findAllByUserId(testUser.getId());
    UUID id = tokens.get(0).getId();

    patService.setPaused(id, testUser.getId(), true);
    org.junit.jupiter.api.Assertions.assertTrue(
        patRepository.findById(id).orElseThrow().isPaused());

    patService.setPaused(id, testUser.getId(), false);
    org.junit.jupiter.api.Assertions.assertFalse(
        patRepository.findById(id).orElseThrow().isPaused());
  }

  @Test
  void createTransaction_WithReadOnlyPat_Returns403() throws Exception {
    TransactionRequest request = TransactionRequest.builder().build();
    request.setName("Test Transaction");
    request.setAmount(new BigDecimal("10.00"));
    request.setType("EXPENSE");

    mockMvc
        .perform(
            post("/api/transactions/" + testWallet.getId())
                .header("Authorization", "Bearer " + readOnlyPatPlain)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isForbidden());
  }

  @Test
  void createTransaction_WithReadWritePat_Returns201() throws Exception {
    TransactionRequest request = TransactionRequest.builder().build();
    request.setName("Test Transaction");
    request.setAmount(new BigDecimal("10.00"));
    request.setType("EXPENSE");

    mockMvc
        .perform(
            post("/api/transactions/" + testWallet.getId())
                .header("Authorization", "Bearer " + readWritePatPlain)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk());
  }

  @Test
  void updateTransaction_WithReadOnlyPat_Returns403() throws Exception {
    TransactionRequest request = TransactionRequest.builder().build();
    request.setName("Updated Transaction");
    request.setAmount(new BigDecimal("20.00"));
    request.setType("EXPENSE");

    mockMvc
        .perform(
            put("/api/transactions/" + testWallet.getId() + "/" + UUID.randomUUID())
                .header("Authorization", "Bearer " + readOnlyPatPlain)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isForbidden());
  }

  @Test
  void deleteTransaction_WithReadOnlyPat_Returns403() throws Exception {
    mockMvc
        .perform(
            delete("/api/transactions/" + testWallet.getId() + "/" + UUID.randomUUID())
                .header("Authorization", "Bearer " + readOnlyPatPlain))
        .andExpect(status().isForbidden());
  }

  // Note: We don't necessarily test update/delete with ReadWrite PAT returning 200/204 here
  // unless we also create the transaction in the DB first, otherwise we'd get a 404 from the
  // service.
  // The createTransaction_WithReadWritePat_Returns201 already proves ReadWrite works for mutating
  // operations.

  @Test
  void patIsSubjectToIdor_CannotAccessOtherUserWallet() throws Exception {
    // 1. Create a second user and wallet
    User user2 = new User();
    user2.setUsername("patuser2@example.com");
    user2.setEmail("patuser2@example.com");
    user2.setPassword("password");
    user2.setRole(User.Role.USER);
    user2.setTokenVersion(1);
    user2 = userRepository.save(user2);

    Wallet wallet2 = new Wallet();
    wallet2.setName("User 2 Wallet");
    wallet2.setCurrency("EUR");
    wallet2 = walletRepository.save(wallet2);

    WalletAccess access2 = new WalletAccess();
    access2.setId(new WalletAccess.WalletAccessId(user2.getId(), wallet2.getId()));
    access2.setRole(WalletAccess.WalletRole.OWNER);
    access2.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    access2.setUser(user2);
    access2.setWallet(wallet2);
    walletAccessRepository.save(access2);

    // 2. Try to access wallet2 using testUser's PAT (readOnlyPatPlain)
    mockMvc
        .perform(
            get("/api/transactions/" + wallet2.getId())
                .header("Authorization", "Bearer " + readOnlyPatPlain))
        .andExpect(
            status()
                .isNotFound()); // Or 403, depending on Filter logic (WalletSecurity usually throws
    // 404 for security)
  }

  // =================================================================================================
  // TAG CONTROLLER TESTS
  // =================================================================================================

  @Test
  void getTags_WithReadOnlyPat_Returns200() throws Exception {
    mockMvc
        .perform(
            get("/api/tags/" + testWallet.getId())
                .header("Authorization", "Bearer " + readOnlyPatPlain))
        .andExpect(status().isOk());
  }

  @Test
  void createTag_WithReadOnlyPat_Returns403() throws Exception {
    dev.busato.FinanceWebApp.backend.dto.TagRequest request =
        dev.busato.FinanceWebApp.backend.dto.TagRequest.builder().build();
    request.setName("New Tag");
    request.setIcon("icon");
    request.setColorHex("#000000");

    mockMvc
        .perform(
            post("/api/tags/" + testWallet.getId())
                .header("Authorization", "Bearer " + readOnlyPatPlain)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isForbidden());
  }

  @Test
  void updateTag_WithReadOnlyPat_Returns403() throws Exception {
    dev.busato.FinanceWebApp.backend.dto.TagRequest request =
        dev.busato.FinanceWebApp.backend.dto.TagRequest.builder().build();
    request.setName("Updated Tag");
    request.setIcon("icon");
    request.setColorHex("#FFFFFF");

    mockMvc
        .perform(
            put("/api/tags/" + testWallet.getId() + "/SomeTag")
                .header("Authorization", "Bearer " + readOnlyPatPlain)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isForbidden());
  }

  @Test
  void deleteTag_WithReadOnlyPat_Returns403() throws Exception {
    mockMvc
        .perform(
            delete("/api/tags/" + testWallet.getId() + "/SomeTag")
                .header("Authorization", "Bearer " + readOnlyPatPlain))
        .andExpect(status().isForbidden());
  }

  @Test
  void createTag_WithReadWritePat_Returns200() throws Exception {
    dev.busato.FinanceWebApp.backend.dto.TagRequest request =
        dev.busato.FinanceWebApp.backend.dto.TagRequest.builder().build();
    request.setName("New Tag");
    request.setIcon("icon");
    request.setColorHex("#000000");

    mockMvc
        .perform(
            post("/api/tags/" + testWallet.getId())
                .header("Authorization", "Bearer " + readWritePatPlain)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isOk());
  }
}
