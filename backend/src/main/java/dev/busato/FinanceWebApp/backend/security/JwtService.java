package dev.busato.FinanceWebApp.backend.security;

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

    // 1. Estrae lo username dal token (Subject)
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // 2. Metodo generico per estrarre un singolo dato (Claim)
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // 3. Genera il token senza dati extra (solo user details)
    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    // 4. Genera il token CON dati extra (es. ruolo, ID, email, ecc.)
    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername()) // Imposta lo username come "soggetto"
                .setIssuedAt(new Date(System.currentTimeMillis())) // Data creazione
                .setExpiration(new Date(System.currentTimeMillis() + JWT_EXPIRATION)) // Scade tra 24 ore
                .signWith(getSignInKey(), SignatureAlgorithm.HS256) // Firma con la chiave segreta
                .compact();
    }

    // 5. Valida il token
    // Controlla se lo username nel token coincide con quello dell'utente
    // e se il token non è scaduto.
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    // --- Metodi Helper Privati ---

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // Qui avviene la magia del parsing: decodifica il token usando la chiave segreta
    private Claims extractAllClaims(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // Decodifica la chiave segreta da Base64 a oggetto Key crittografico
    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
