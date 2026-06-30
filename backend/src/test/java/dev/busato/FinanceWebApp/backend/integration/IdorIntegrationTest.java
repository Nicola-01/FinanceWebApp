package dev.busato.FinanceWebApp.backend.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.busato.FinanceWebApp.backend.dto.TransactionRequest;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import dev.busato.FinanceWebApp.backend.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class IdorIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private WalletAccessRepository walletAccessRepository;

    @MockBean
    private WalletRepository walletRepository;

    @MockBean
    private TransactionRepository transactionRepository;

    @MockBean
    private UserDetailsService userDetailsService;

    private User mockUser;
    private String validJwt;
    private UUID walletId;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setId(UUID.randomUUID());
        mockUser.setUsername("testuser@example.com");
        mockUser.setTokenVersion(1);

        walletId = UUID.randomUUID();

        // Create a valid JWT for the mock user
        validJwt = jwtService.generateToken(new java.util.HashMap<>(), mockUser);

        when(userDetailsService.loadUserByUsername(anyString())).thenReturn(mockUser);
        when(userRepository.findById(mockUser.getId())).thenReturn(Optional.of(mockUser));
        when(walletRepository.existsById(walletId)).thenReturn(true);
    }

    @Test
    void getTransactions_WithoutWalletAccess_Returns404() throws Exception {
        // User has no access to this wallet
        when(walletAccessRepository.findByUserIdAndWalletId(mockUser.getId(), walletId))
                .thenReturn(Optional.empty());

        mockMvc.perform(get("/api/transactions/" + walletId)
                        .header("Authorization", "Bearer " + validJwt))
                .andExpect(status().isNotFound()); // WalletSecurity throws WalletNotFoundException
    }

    @Test
    void getTransactions_WithViewerAccess_Returns200() throws Exception {
        // User has VIEWER access to this wallet
        WalletAccess access = new WalletAccess();
        access.setRole(WalletAccess.WalletRole.VIEWER);
        access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
        access.setUser(mockUser);

        when(walletAccessRepository.findByUserIdAndWalletId(mockUser.getId(), walletId))
                .thenReturn(Optional.of(access));

        mockMvc.perform(get("/api/transactions/" + walletId)
                        .header("Authorization", "Bearer " + validJwt))
                .andExpect(status().isOk());
    }

    @Test
    void createTransaction_WithViewerAccess_Returns403() throws Exception {
        // User has only VIEWER access, which should prevent WRITE
        WalletAccess access = new WalletAccess();
        access.setRole(WalletAccess.WalletRole.VIEWER);
        access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
        access.setUser(mockUser);

        when(walletAccessRepository.findByUserIdAndWalletId(mockUser.getId(), walletId))
                .thenReturn(Optional.of(access));

        TransactionRequest request = TransactionRequest.builder().build();
        request.setName("Test Transaction");
        request.setAmount(new BigDecimal("10.00"));
        request.setType("EXPENSE");

        mockMvc.perform(post("/api/transactions/" + walletId)
                        .header("Authorization", "Bearer " + validJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void createTransaction_WithPendingInvite_Returns403() throws Exception {
        // User is an ADMIN but status is PENDING
        WalletAccess access = new WalletAccess();
        access.setRole(WalletAccess.WalletRole.EDITOR);
        access.setStatus(WalletAccess.InvitationStatus.PENDING);
        access.setUser(mockUser);

        when(walletAccessRepository.findByUserIdAndWalletId(mockUser.getId(), walletId))
                .thenReturn(Optional.of(access));

        TransactionRequest request = TransactionRequest.builder().build();
        request.setName("Test Transaction");
        request.setAmount(new BigDecimal("10.00"));
        request.setType("EXPENSE");

        mockMvc.perform(post("/api/transactions/" + walletId)
                        .header("Authorization", "Bearer " + validJwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
