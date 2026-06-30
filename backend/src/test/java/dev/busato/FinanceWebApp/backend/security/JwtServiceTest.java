package dev.busato.FinanceWebApp.backend.security;

import dev.busato.FinanceWebApp.backend.model.User;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    private final String SECRET_KEY = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970"; // 256-bit hex key
    @InjectMocks
    private JwtService jwtService;
    private User mockUser;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(jwtService, "SECRET_KEY", SECRET_KEY);
        ReflectionTestUtils.setField(jwtService, "JWT_EXPIRATION", 1000 * 60 * 15L); // 15 mins
        ReflectionTestUtils.setField(jwtService, "JWT_REFRESH_EXPIRATION", 1000 * 60 * 60 * 24 * 30L); // 30 days

        mockUser = new User();
        mockUser.setUsername("testuser@example.com");
        mockUser.setTokenVersion(1);
    }

    @Test
    void generateToken_ValidUser_GeneratesValidTokenAndCanExtractUsernameAndVersion() {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("customClaim", "customValue");

        String token = jwtService.generateToken(extraClaims, mockUser);

        assertNotNull(token);
        assertEquals("testuser@example.com", jwtService.extractUsername(token));
        assertEquals(1, jwtService.extractTokenVersion(token));
        assertEquals("customValue", jwtService.extractClaim(token, claims -> claims.get("customClaim", String.class)));
    }

    @Test
    void generateRefreshToken_ValidUser_GeneratesValidRefreshToken() {
        String refreshToken = jwtService.generateRefreshToken(mockUser);

        assertNotNull(refreshToken);
        assertTrue(jwtService.isRefreshToken(refreshToken));
        assertEquals("testuser@example.com", jwtService.extractUsername(refreshToken));
        assertEquals(1, jwtService.extractTokenVersion(refreshToken));
    }

    @Test
    void isTokenValid_ValidTokenAndMatchingUser_ReturnsTrue() {
        String token = jwtService.generateToken(new HashMap<>(), mockUser);
        assertTrue(jwtService.isTokenValid(token, mockUser));
    }

    @Test
    void isTokenValid_DifferentUsername_ReturnsFalse() {
        String token = jwtService.generateToken(new HashMap<>(), mockUser);

        User differentUser = new User();
        differentUser.setUsername("other@example.com");
        differentUser.setTokenVersion(1);

        assertFalse(jwtService.isTokenValid(token, differentUser));
    }

    @Test
    void isTokenValid_InvalidTokenVersion_ReturnsFalse() {
        String token = jwtService.generateToken(new HashMap<>(), mockUser);

        // Simulating that the token version in the DB has changed (e.g. after logout-all or password change)
        mockUser.setTokenVersion(2);

        assertFalse(jwtService.isTokenValid(token, mockUser));
    }

    @Test
    void isTokenValid_ExpiredToken_ThrowsExpiredJwtException() {
        // Set expiration to 1 ms
        ReflectionTestUtils.setField(jwtService, "JWT_EXPIRATION", 1L);
        String token = jwtService.generateToken(new HashMap<>(), mockUser);

        // Wait briefly to ensure it expires
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        assertThrows(ExpiredJwtException.class, () -> jwtService.isTokenValid(token, mockUser));
    }

    @Test
    void extractUsername_TamperedSignature_ThrowsSignatureException() {
        String token = jwtService.generateToken(new HashMap<>(), mockUser);
        String tamperedToken = token + "tamper";

        assertThrows(SignatureException.class, () -> jwtService.extractUsername(tamperedToken));
    }

    @Test
    void extractUsername_MalformedToken_ThrowsMalformedJwtException() {
        String malformedToken = "invalid.token.string";
        assertThrows(MalformedJwtException.class, () -> jwtService.extractUsername(malformedToken));
    }

    @Test
    void isRefreshToken_AccessToken_ReturnsFalse() {
        String token = jwtService.generateToken(new HashMap<>(), mockUser);
        assertFalse(jwtService.isRefreshToken(token));
    }

    @Test
    void isRefreshToken_MalformedToken_ReturnsFalse() {
        String malformedToken = "invalid.token.string";
        assertFalse(jwtService.isRefreshToken(malformedToken));
    }

    @Test
    void isInRenewalWindow_TokenExpiresSoon_ReturnsTrue() {
        // Set refresh expiration to 5 days (which is <= 7 days renewal window)
        ReflectionTestUtils.setField(jwtService, "JWT_REFRESH_EXPIRATION", 1000 * 60 * 60 * 24 * 5L);
        String token = jwtService.generateRefreshToken(mockUser);

        assertTrue(jwtService.isInRenewalWindow(token));
    }

    @Test
    void isInRenewalWindow_TokenExpiresFarInFuture_ReturnsFalse() {
        // Set refresh expiration to 30 days (which is > 7 days renewal window)
        ReflectionTestUtils.setField(jwtService, "JWT_REFRESH_EXPIRATION", 1000 * 60 * 60 * 24 * 30L);
        String token = jwtService.generateRefreshToken(mockUser);

        assertFalse(jwtService.isInRenewalWindow(token));
    }
}
