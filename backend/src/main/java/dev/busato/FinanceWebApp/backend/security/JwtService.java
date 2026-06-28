package dev.busato.FinanceWebApp.backend.security;

import dev.busato.FinanceWebApp.backend.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${application.security.jwt.secret-key}")
    private String SECRET_KEY;

    @Value("${application.security.jwt.expiration}")
    private long JWT_EXPIRATION;

    @Value("${application.security.jwt.refresh_expiration}")
    private long JWT_REFRESH_EXPIRATION;

    // ==================== ESTRAZIONE CLAIMS ====================

    // Estrae lo username dal token (Subject)
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Estrae la tokenVersion dal token
    public int extractTokenVersion(String token) {
        return extractClaim(token, claims -> claims.get("ver", Integer.class));
    }

    // Metodo generico per estrarre un singolo dato (Claim)
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // ==================== GENERAZIONE TOKEN ====================

    /**
     * Genera l'access token con dati extra (ruolo, ID, tokenVersion).
     * La tokenVersion viene sempre inclusa automaticamente.
     */
    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        // Inietta automaticamente la tokenVersion nel JWT
        if (userDetails instanceof User user) {
            extraClaims.put("ver", user.getTokenVersion());
        }
        return buildToken(extraClaims, userDetails, JWT_EXPIRATION);
    }

    /**
     * Genera il refresh token (claim minimali: sub + type + ver).
     */
    public String generateRefreshToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("type", "refresh");
        if (userDetails instanceof User user) {
            claims.put("ver", user.getTokenVersion());
        }
        return buildToken(claims, userDetails, JWT_REFRESH_EXPIRATION);
    }

    // Builder comune per access e refresh token
    private String buildToken(Map<String, Object> extraClaims, UserDetails userDetails, long expiration) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // ==================== VALIDAZIONE ====================

    /**
     * Valida il token: username + scadenza + tokenVersion.
     * Se la versione nel token non corrisponde a quella nel DB, il token è invalido.
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        if (!username.equals(userDetails.getUsername()) || isTokenExpired(token)) {
            return false;
        }

        // Controlla la tokenVersion
        if (userDetails instanceof User user) {
            int tokenVer = extractTokenVersion(token);
            if (tokenVer != user.getTokenVersion()) {
                return false; // Token invalidato (logout-all o cambio password)
            }
        }

        return true;
    }

    /**
     * Controlla se il token è un refresh token.
     */
    public boolean isRefreshToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return "refresh".equals(claims.get("type", String.class));
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Finestra di rinnovo: ultimi 7 giorni di vita del refresh token.
     * Se il token scade entro questo periodo, va ruotato con uno nuovo.
     */
    private static final long RENEWAL_WINDOW_MS = 7L * 24 * 60 * 60 * 1000; // 7 giorni

    /**
     * Controlla se il refresh token è nella finestra di rinnovo (ultimi 7 giorni).
     * Se true, il token dovrebbe essere ruotato con uno nuovo.
     */
    public boolean isInRenewalWindow(String token) {
        Date expiration = extractExpiration(token);
        long timeToExpiry = expiration.getTime() - System.currentTimeMillis();
        return timeToExpiry <= RENEWAL_WINDOW_MS;
    }

    /**
     * Getter per la durata del refresh token (usato nel cookie Max-Age).
     */
    public long getRefreshExpiration() {
        return JWT_REFRESH_EXPIRATION;
    }

    // ==================== HELPER PRIVATI ====================

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
