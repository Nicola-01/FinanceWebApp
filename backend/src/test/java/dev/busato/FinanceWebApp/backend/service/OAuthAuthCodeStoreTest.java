package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.service.OAuthAuthCodeStore.AuthCodeEntry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class OAuthAuthCodeStoreTest {

    private OAuthAuthCodeStore store;

    @BeforeEach
    void setUp() {
        store = new OAuthAuthCodeStore();
    }

    @Test
    void generateAndStore_ValidInput_ReturnsCodeAndStoresEntry() {
        String code = store.generateAndStore("challenge1", "plainToken1", "client1", "http://redirect", "read");

        assertNotNull(code);
        assertFalse(code.isBlank());
        assertEquals(64, code.length()); // 32 bytes = 64 hex chars
    }

    @Test
    void generateAndStore_DuplicateCodeChallenge_ThrowsIllegalStateException() {
        store.generateAndStore("challenge_dup", "token1", "client1", "http://redirect", "read");

        assertThrows(IllegalStateException.class,
                () -> store.generateAndStore("challenge_dup", "token2", "client2", "http://redirect2", "write"));
    }

    @Test
    void consume_ValidCode_ReturnsEntryAndRemovesIt() {
        String code = store.generateAndStore("challenge2", "plainToken2", "client2", "http://redirect", "read");

        Optional<AuthCodeEntry> result = store.consume(code);

        assertTrue(result.isPresent());
        assertEquals("plainToken2", result.get().getPlainToken());
        assertEquals("client2", result.get().getClientId());
        assertEquals("http://redirect", result.get().getRedirectUri());
        assertEquals("read", result.get().getScope());
        assertEquals("challenge2", result.get().getCodeChallenge());

        // Second consume must return empty (single-use)
        Optional<AuthCodeEntry> second = store.consume(code);
        assertTrue(second.isEmpty());
    }

    @Test
    void consume_UnknownCode_ReturnsEmpty() {
        Optional<AuthCodeEntry> result = store.consume("nonexistent_code_hex");
        assertTrue(result.isEmpty());
    }

    @Test
    void consume_ExpiredCode_ReturnsEmpty() throws Exception {
        // We use reflection to inject an entry with a createdAt far in the past
        String code = store.generateAndStore("challenge_expired", "token3", "client3", "http://r", "read");

        // Consume the code so we can re-insert with manipulated time
        store.consume(code);

        // Manually put an expired entry using reflection
        var storeField = OAuthAuthCodeStore.class.getDeclaredField("store");
        storeField.setAccessible(true);
        @SuppressWarnings("unchecked")
        var internalMap = (java.util.concurrent.ConcurrentHashMap<String, AuthCodeEntry>) storeField.get(store);

        AuthCodeEntry expiredEntry = AuthCodeEntry.builder()
                .codeChallenge("expired_challenge")
                .plainToken("expired_token")
                .clientId("c")
                .redirectUri("r")
                .scope("s")
                .createdAt(Instant.now().minusSeconds(600)) // 10 minutes ago, TTL is 5 min
                .build();
        internalMap.put("expired_code", expiredEntry);

        Optional<AuthCodeEntry> result = store.consume("expired_code");
        assertTrue(result.isEmpty());
    }

    @Test
    void cleanup_RemovesExpiredEntriesFromBothMaps() throws Exception {
        // Generate a valid entry
        String validCode = store.generateAndStore("valid_challenge", "valid_token", "c", "r", "s");

        // Inject an expired entry via reflection
        var storeField = OAuthAuthCodeStore.class.getDeclaredField("store");
        storeField.setAccessible(true);
        @SuppressWarnings("unchecked")
        var internalMap = (java.util.concurrent.ConcurrentHashMap<String, AuthCodeEntry>) storeField.get(store);

        var usedChallengesField = OAuthAuthCodeStore.class.getDeclaredField("usedChallenges");
        usedChallengesField.setAccessible(true);
        @SuppressWarnings("unchecked")
        var usedChallenges = (java.util.concurrent.ConcurrentHashMap<String, Instant>) usedChallengesField.get(store);

        AuthCodeEntry expiredEntry = AuthCodeEntry.builder()
                .codeChallenge("old_challenge")
                .plainToken("old_token")
                .clientId("c")
                .redirectUri("r")
                .scope("s")
                .createdAt(Instant.now().minusSeconds(600))
                .build();
        internalMap.put("old_code", expiredEntry);
        usedChallenges.put("old_challenge", Instant.now().minusSeconds(600));

        // Before cleanup: 2 entries in store, 2 in usedChallenges
        assertEquals(2, internalMap.size());
        assertEquals(2, usedChallenges.size());

        store.cleanup();

        // After cleanup: expired entry removed, valid one remains
        assertEquals(1, internalMap.size());
        assertTrue(internalMap.containsKey(validCode));
        assertEquals(1, usedChallenges.size());
        assertTrue(usedChallenges.containsKey("valid_challenge"));
    }
}
