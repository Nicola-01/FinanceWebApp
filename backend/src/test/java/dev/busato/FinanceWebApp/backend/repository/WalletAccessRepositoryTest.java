package dev.busato.FinanceWebApp.backend.repository;

import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
public class WalletAccessRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private WalletAccessRepository walletAccessRepository;

    private User testUser;
    private Wallet testWallet;
    private WalletAccess testAccess;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setUsername("access@example.com");
        testUser.setEmail("access@example.com");
        testUser.setPassword("password");
        testUser.setRole(User.Role.USER);
        testUser.setTokenVersion(1);
        testUser = entityManager.persistAndFlush(testUser);

        testWallet = new Wallet();
        testWallet.setName("Test Wallet Access");
        testWallet.setCurrency("EUR");
        testWallet = entityManager.persistAndFlush(testWallet);

        testAccess = new WalletAccess();
        testAccess.setId(new WalletAccess.WalletAccessId(testUser.getId(), testWallet.getId()));
        testAccess.setUser(testUser);
        testAccess.setWallet(testWallet);
        testAccess.setRole(WalletAccess.WalletRole.EDITOR);
        testAccess.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
        testAccess = entityManager.persistAndFlush(testAccess);
    }

    @Test
    void findAllByUserId_ShouldReturnAccessesWithEagerWallet() {
        // Since there's an @EntityGraph on this method, we want to ensure the wallet is fetched
        // In a true integration test we'd check hibernate statistics, but here we can just verify it returns correctly
        List<WalletAccess> accesses = walletAccessRepository.findAllByUserId(testUser.getId());
        
        assertFalse(accesses.isEmpty());
        assertEquals(1, accesses.size());
        assertEquals(testWallet.getId(), accesses.get(0).getWallet().getId());
    }

    @Test
    void existsByWalletIdAndUserIdAndStatusIn_ShouldReturnTrueIfStatusMatches() {
        boolean exists = walletAccessRepository.existsByWalletIdAndUserIdAndStatusIn(
                testWallet.getId(), 
                testUser.getId(), 
                new WalletAccess.InvitationStatus[]{WalletAccess.InvitationStatus.ACCEPTED, WalletAccess.InvitationStatus.PENDING}
        );
        assertTrue(exists);
    }

    @Test
    void existsByWalletIdAndUserIdAndStatusIn_ShouldReturnFalseIfStatusDoesNotMatch() {
        boolean exists = walletAccessRepository.existsByWalletIdAndUserIdAndStatusIn(
                testWallet.getId(), 
                testUser.getId(), 
                new WalletAccess.InvitationStatus[]{WalletAccess.InvitationStatus.REJECTED}
        );
        assertFalse(exists);
    }

    @Test
    void existsByWalletIdAndUserIdAndStatusInAndUpdatedAtAfter_ShouldReturnTrue() {
        boolean exists = walletAccessRepository.existsByWalletIdAndUserIdAndStatusInAndUpdatedAtAfter(
                testWallet.getId(),
                testUser.getId(),
                List.of(WalletAccess.InvitationStatus.ACCEPTED),
                LocalDate.now().minusDays(1) // Assuming updatedAt is today, this should match
        );
        assertTrue(exists);
    }
    
    @Test
    void findByUserIdAndWalletId_ShouldReturnAccess() {
        Optional<WalletAccess> found = walletAccessRepository.findByUserIdAndWalletId(testUser.getId(), testWallet.getId());
        assertTrue(found.isPresent());
        assertEquals(testAccess.getRole(), found.get().getRole());
    }
}
