package dev.busato.FinanceWebApp.backend.openbanking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.busato.FinanceWebApp.backend.integration.BaseIntegrationTest;
import dev.busato.FinanceWebApp.backend.model.BankConnection;
import dev.busato.FinanceWebApp.backend.model.PersonalAccessToken;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.openbanking.BankSyncService.SyncResult;
import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.Aspsp;
import dev.busato.FinanceWebApp.backend.openbanking.EbDtos.PsuContext;
import dev.busato.FinanceWebApp.backend.repository.BankConnectionRepository;
import dev.busato.FinanceWebApp.backend.repository.PersonalAccessTokenRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import dev.busato.FinanceWebApp.backend.security.JwtService;
import dev.busato.FinanceWebApp.backend.service.PatService;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

/** End-to-end through the real security chain (JWT, PAT filter, method security). */
class BankLinkControllerTest extends BaseIntegrationTest {

  @MockitoBean EnableBankingClient client;
  @MockitoBean BankSyncService syncService;

  @Autowired JwtService jwtService;
  @Autowired UserRepository userRepository;
  @Autowired WalletRepository walletRepository;
  @Autowired WalletAccessRepository walletAccessRepository;
  @Autowired BankConnectionRepository connectionRepository;
  @Autowired PersonalAccessTokenRepository patRepository;

  User owner;
  Wallet wallet;
  String jwt;

  @BeforeEach
  void setUp() {
    owner = user("ctl-owner@example.com", User.Role.USER);
    wallet = new Wallet();
    wallet.setName("Ctl wallet");
    wallet.setCurrency("EUR");
    wallet = walletRepository.save(wallet);
    WalletAccess a = new WalletAccess();
    a.setId(new WalletAccess.WalletAccessId(owner.getId(), wallet.getId()));
    a.setRole(WalletAccess.WalletRole.OWNER);
    a.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    a.setUser(owner);
    a.setWallet(wallet);
    walletAccessRepository.save(a);
    jwt = jwtService.generateToken(new HashMap<>(), owner);

    when(client.configured()).thenReturn(true);
    when(client.listAspsps("IT")).thenReturn(List.of(new Aspsp("Test Bank", "IT", null)));
    when(client.startAuth(any(), any(), anyString(), anyString())).thenReturn("https://bank/x");
  }

  User user(String email, User.Role role) {
    User u = new User();
    u.setUsername(email);
    u.setEmail(email);
    u.setPassword("password");
    u.setRole(role);
    u.setTokenVersion(1);
    u.setOpenBankingEnabled(true);
    return userRepository.save(u);
  }

  String bearer(String token) {
    return "Bearer " + token;
  }

  @Test
  void listsAspspsAndRejectsPat() throws Exception {
    mockMvc
        .perform(get("/api/bank/aspsps?country=IT").header("Authorization", bearer(jwt)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].name").value("Test Bank"));

    String plain = "fin_pat_bank_" + UUID.randomUUID();
    PersonalAccessToken pat = new PersonalAccessToken();
    pat.setName("t");
    pat.setTokenHash(PatService.hashToken(plain));
    pat.setTokenPrefix("fin_pat_bank");
    pat.setUser(owner);
    pat.setWalletPermissions(
        "[{\"walletId\":\"" + wallet.getId() + "\",\"permissions\":[\"READ\",\"WRITE\"]}]");
    patRepository.save(pat);

    mockMvc
        .perform(get("/api/bank/aspsps?country=IT").header("Authorization", bearer(plain)))
        .andExpect(status().isForbidden());
    mockMvc
        .perform(
            get("/api/bank/wallets/{id}", wallet.getId()).header("Authorization", bearer(plain)))
        .andExpect(status().isForbidden());
  }

  @Test
  void featureOffIs403AndUnauthenticatedIsRejected() throws Exception {
    owner.setOpenBankingEnabled(false);
    userRepository.save(owner);
    mockMvc
        .perform(get("/api/bank/aspsps?country=IT").header("Authorization", bearer(jwt)))
        .andExpect(status().isForbidden());
    mockMvc
        .perform(get("/api/bank/wallets/{id}", wallet.getId()).header("Authorization", bearer(jwt)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.enabled").value(false));
    mockMvc.perform(get("/api/bank/aspsps?country=IT")).andExpect(status().is4xxClientError());
  }

  @Test
  void connectReturnsUrlAndValidatesDate() throws Exception {
    mockMvc
        .perform(
            post("/api/bank/wallets/{id}/connect", wallet.getId())
                .header("Authorization", bearer(jwt))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"aspspName\":\"Test Bank\",\"country\":\"IT\",\"importFrom\":\""
                        + LocalDate.now().minusDays(10)
                        + "\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.url").value("https://bank/x"));

    mockMvc
        .perform(
            post("/api/bank/wallets/{id}/connect", wallet.getId())
                .header("Authorization", bearer(jwt))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"aspspName\":\"Test Bank\",\"country\":\"IT\",\"importFrom\":\""
                        + LocalDate.now().plusDays(3)
                        + "\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void callbackWithUnknownOrMissingStateIs403Or400() throws Exception {
    mockMvc
        .perform(
            post("/api/bank/callback")
                .header("Authorization", bearer(jwt))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"c\",\"state\":\"unknown\"}"))
        .andExpect(status().isForbidden());
    mockMvc
        .perform(
            post("/api/bank/callback")
                .header("Authorization", bearer(jwt))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"c\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void syncIfStaleForwardsPsuContextAndSyncAndDeleteWork() throws Exception {
    BankConnection c =
        connectionRepository.save(
            BankConnection.builder()
                .wallet(wallet)
                .createdBy(owner)
                .aspspName("Test Bank")
                .aspspCountry("IT")
                .sessionId("secret-session")
                .validUntil(Instant.now().plusSeconds(3600))
                .status(BankConnection.Status.ACTIVE)
                .build());
    when(syncService.syncWalletIfStale(eq(wallet.getId()), eq(owner.getId()), any()))
        .thenReturn(List.of(new SyncResult(c.getId(), 3, BankConnection.Status.ACTIVE)));
    when(syncService.syncConnection(any(), any()))
        .thenReturn(new SyncResult(c.getId(), 1, BankConnection.Status.ACTIVE));

    mockMvc
        .perform(
            post("/api/bank/wallets/{id}/sync-if-stale", wallet.getId())
                .header("Authorization", bearer(jwt))
                .header("X-Forwarded-For", "203.0.113.7, 10.0.0.1")
                .header("User-Agent", "TestAgent/1.0"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].imported").value(3));
    verify(syncService)
        .syncWalletIfStale(
            wallet.getId(), owner.getId(), new PsuContext("203.0.113.7", "TestAgent/1.0"));

    mockMvc
        .perform(
            post("/api/bank/connections/{id}/sync", c.getId())
                .header("Authorization", bearer(jwt))
                .header("User-Agent", "UA"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.imported").value(1));
    verify(syncService).syncConnection(any(), eq(new PsuContext("127.0.0.1", "UA")));

    String body =
        mockMvc
            .perform(
                get("/api/bank/wallets/{id}", wallet.getId()).header("Authorization", bearer(jwt)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.enabled").value(true))
            .andExpect(jsonPath("$.connections[0].walletId").value(wallet.getId().toString()))
            .andReturn()
            .getResponse()
            .getContentAsString();
    assertThat(body).doesNotContain("secret-session");

    mockMvc
        .perform(
            delete("/api/bank/connections/{id}", c.getId()).header("Authorization", bearer(jwt)))
        .andExpect(status().isNoContent());
    assertThat(connectionRepository.findById(c.getId())).isEmpty();
  }

  @Test
  void adminTogglesFlag() throws Exception {
    User target = user("ctl-target@example.com", User.Role.USER);
    target.setOpenBankingEnabled(false);
    userRepository.save(target);
    User admin = user("ctl-admin@example.com", User.Role.ADMIN);

    mockMvc
        .perform(
            put("/api/admin/management/{id}/open-banking", target.getId())
                .header("Authorization", bearer(jwt))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"enabled\":true}"))
        .andExpect(status().isForbidden());
    assertThat(userRepository.findById(target.getId()).orElseThrow().isOpenBankingEnabled())
        .isFalse();

    mockMvc
        .perform(
            put("/api/admin/management/{id}/open-banking", target.getId())
                .header("Authorization", bearer(jwtService.generateToken(new HashMap<>(), admin)))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"enabled\":true}"))
        .andExpect(status().isNoContent());
    assertThat(userRepository.findById(target.getId()).orElseThrow().isOpenBankingEnabled())
        .isTrue();
  }
}
