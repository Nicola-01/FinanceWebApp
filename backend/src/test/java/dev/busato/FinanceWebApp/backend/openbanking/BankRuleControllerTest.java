package dev.busato.FinanceWebApp.backend.openbanking;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import dev.busato.FinanceWebApp.backend.integration.BaseIntegrationTest;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import dev.busato.FinanceWebApp.backend.security.JwtService;
import java.util.HashMap;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

/** Bank rule CRUD through the real security chain and JPA. */
class BankRuleControllerTest extends BaseIntegrationTest {

  @MockitoBean EnableBankingClient client;

  @Autowired JwtService jwtService;
  @Autowired UserRepository userRepository;
  @Autowired WalletRepository walletRepository;
  @Autowired WalletAccessRepository walletAccessRepository;

  User owner;
  Wallet wallet;
  String jwt;

  @BeforeEach
  void setUp() {
    owner = user("rule-owner@example.com");
    wallet = new Wallet();
    wallet.setName("Rules wallet");
    wallet.setCurrency("EUR");
    wallet = walletRepository.save(wallet);
    grant(owner, WalletAccess.WalletRole.OWNER);
    jwt = "Bearer " + jwtService.generateToken(new HashMap<>(), owner);
    when(client.configured()).thenReturn(true);
  }

  User user(String email) {
    User u = new User();
    u.setUsername(email);
    u.setEmail(email);
    u.setPassword("password");
    u.setRole(User.Role.USER);
    u.setTokenVersion(1);
    u.setOpenBankingEnabled(true);
    return userRepository.save(u);
  }

  void grant(User u, WalletAccess.WalletRole role) {
    WalletAccess a = new WalletAccess();
    a.setId(new WalletAccess.WalletAccessId(u.getId(), wallet.getId()));
    a.setRole(role);
    a.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    a.setUser(u);
    a.setWallet(wallet);
    walletAccessRepository.save(a);
  }

  static final String BODY =
      "{\"name\":\"Amazon\",\"matchText\":\"AMZN\",\"regex\":false,\"renameTo\":\"Amazon\",\"reviewFirst\":true}";

  @Test
  void crudRoundTrip() throws Exception {
    String created =
        mockMvc
            .perform(
                post("/api/bank-rules/{w}", wallet.getId())
                    .header("Authorization", jwt)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(BODY))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Amazon"))
            .andExpect(jsonPath("$.ignoreCase").value(true))
            .andExpect(jsonPath("$.reviewFirst").value(true))
            .andReturn()
            .getResponse()
            .getContentAsString();
    String id = JsonPath.read(created, "$.id");

    mockMvc
        .perform(get("/api/bank-rules/{w}", wallet.getId()).header("Authorization", jwt))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].matchText").value("AMZN"))
        .andExpect(jsonPath("$[0].usedBy").isEmpty());

    mockMvc
        .perform(
            put("/api/bank-rules/{w}/{id}", wallet.getId(), id)
                .header("Authorization", jwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(BODY.replace("AMZN", "AMZN MKTP")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.matchText").value("AMZN MKTP"));

    mockMvc
        .perform(
            delete("/api/bank-rules/{w}/{id}", wallet.getId(), id).header("Authorization", jwt))
        .andExpect(status().isNoContent());
  }

  @Test
  void viewerCanListButNotCreate() throws Exception {
    User viewer = user("rule-viewer@example.com");
    grant(viewer, WalletAccess.WalletRole.VIEWER);
    String vjwt = "Bearer " + jwtService.generateToken(new HashMap<>(), viewer);
    mockMvc
        .perform(get("/api/bank-rules/{w}", wallet.getId()).header("Authorization", vjwt))
        .andExpect(status().isOk());
    mockMvc
        .perform(
            post("/api/bank-rules/{w}", wallet.getId())
                .header("Authorization", vjwt)
                .contentType(MediaType.APPLICATION_JSON)
                .content(BODY))
        .andExpect(status().isForbidden());
  }

  @Test
  void featureOffIs403() throws Exception {
    owner.setOpenBankingEnabled(false);
    userRepository.save(owner);
    mockMvc
        .perform(get("/api/bank-rules/{w}", wallet.getId()).header("Authorization", jwt))
        .andExpect(status().isForbidden());
  }
}
