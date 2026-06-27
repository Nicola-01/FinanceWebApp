package dev.busato.FinanceWebApp.backend.security;

import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.service.UserService;
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
    private final UserService userService;

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

        // 2. Se non c'è header o non inizia con "Bearer ", lasciamo passare
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Se la richiesta è già stata autenticata (es. dal PatAuthenticationFilter), passiamo oltre
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Estraiamo il token
        jwt = authHeader.substring(7);

        // Se è un Personal Access Token, lo ignoriamo
        if (jwt.startsWith("fin_pat_")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 4. Estraiamo lo username dal token
        try {
            // Blocca i refresh token usati come Bearer token per API normali
            if (jwtService.isRefreshToken(jwt)) {
                filterChain.doFilter(request, response);
                return;
            }
            username = jwtService.extractUsername(jwt);
        } catch (Exception e) {
            filterChain.doFilter(request, response);
            return;
        }

        // 5. Se abbiamo trovato l'utente e non è già autenticato...
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            // 6. Valida il token (firma + scadenza + tokenVersion dal DB)
            if (jwtService.isTokenValid(jwt, userDetails)) {

                // 7. Doppio controllo tokenVersion tramite cache per catturare
                // invalidazioni avvenute dopo il caricamento dell'utente
                if (userDetails instanceof User user) {
                    int cachedVersion = userService.getTokenVersion(user.getId());
                    int tokenVersion = jwtService.extractTokenVersion(jwt);
                    if (tokenVersion != cachedVersion) {
                        // Token invalidato (logout-all o cambio password)
                        filterChain.doFilter(request, response);
                        return;
                    }
                }

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );

                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}