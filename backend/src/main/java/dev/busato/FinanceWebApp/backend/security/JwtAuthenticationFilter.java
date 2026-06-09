package dev.busato.FinanceWebApp.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // 1. Cerchiamo l'header "Authorization"
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        // 2. Se non c'è header o non inizia con "Bearer ", lasciamo passare (ci penserà SecurityConfig a bloccare)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Se la richiesta è già stata autenticata (es. dal PatAuthenticationFilter), passiamo oltre
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Estraiamo il token (togliamo "Bearer " che sono 7 caratteri)
        jwt = authHeader.substring(7);

        // Se è un Personal Access Token, lo ignoriamo (è già stato o verrà gestito dal PatAuthenticationFilter)
        if (jwt.startsWith("fin_pat_")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 4. Estraiamo lo username dal token
        try {
            username = jwtService.extractUsername(jwt);
        } catch (Exception e) {
            // Se il token è malformato o scaduto, lasciamo passare senza autenticare
            filterChain.doFilter(request, response);
            return;
        }

        // 5. Se abbiamo trovato l'utente e non è già autenticato nel contesto attuale...
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // Carichiamo i dettagli dal DB
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            // 6. Se il token è valido...
            if (jwtService.isTokenValid(jwt, userDetails)) {

                // Creiamo l'oggetto di autenticazione di Spring
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );

                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // 7. INSERIAMO L'UTENTE NEL CONTESTO DI SICUREZZA
                // Da ora in poi, per questa richiesta, Spring sa chi sei!
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // Passiamo la palla al prossimo filtro
        filterChain.doFilter(request, response);
    }
}