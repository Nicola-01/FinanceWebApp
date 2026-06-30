package dev.busato.FinanceWebApp.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.math.BigDecimal;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class PatIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private WalletAccessRepository walletAccessRepository;

    @Autowired
    private PersonalAccessTokenRepository patRepository;

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
        readOnlyPatPlain = "fin_pat_readonly12345678901234567890";
        PersonalAccessToken readOnlyPat = new PersonalAccessToken();
        readOnlyPat.setName("Read Only Token");
        readOnlyPat.setTokenHash(PatService.hashToken(readOnlyPatPlain));
        readOnlyPat.setTokenPrefix("fin_pat_read");
        readOnlyPat.setUser(testUser);
        readOnlyPat.setWalletPermissions("[{\"walletId\":\"" + testWallet.getId() + "\",\"permissions\":[\"READ\"]}]");
        patRepository.save(readOnlyPat);

        // 4. Create a READ-WRITE PAT
        readWritePatPlain = "fin_pat_readwrite1234567890123456789";
        PersonalAccessToken readWritePat = new PersonalAccessToken();
        readWritePat.setName("Read Write Token");
        readWritePat.setTokenHash(PatService.hashToken(readWritePatPlain));
        readWritePat.setTokenPrefix("fin_pat_writ");
        readWritePat.setUser(testUser);
        readWritePat.setWalletPermissions("[{\"walletId\":\"" + testWallet.getId() + "\",\"permissions\":[\"READ\",\"WRITE\"]}]");
        patRepository.save(readWritePat);
    }

    @Test
    void getTransactions_WithReadOnlyPat_Returns200() throws Exception {
        mockMvc.perform(get("/api/transactions/" + testWallet.getId())
                        .header("Authorization", "Bearer " + readOnlyPatPlain))
                .andExpect(status().isOk());
    }

    @Test
    void createTransaction_WithReadOnlyPat_Returns403() throws Exception {
        TransactionRequest request = TransactionRequest.builder().build();
        request.setName("Test Transaction");
        request.setAmount(new BigDecimal("10.00"));
        request.setType("EXPENSE");

        mockMvc.perform(post("/api/transactions/" + testWallet.getId())
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

        mockMvc.perform(post("/api/transactions/" + testWallet.getId())
                        .header("Authorization", "Bearer " + readWritePatPlain)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
}
