package dev.busato.FinanceWebApp.backend.security;

import dev.busato.FinanceWebApp.backend.exceptions.InvalidTokenException;
import dev.busato.FinanceWebApp.backend.model.PersonalAccessToken;
import dev.busato.FinanceWebApp.backend.service.PatService;
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

/**
 * Spring Security filter for authenticating requests using Personal Access Tokens.
 * <p>
 * This filter runs BEFORE {@link JwtAuthenticationFilter} in the filter chain.
 * It intercepts {@code Authorization: Bearer fin_pat_...} headers and, if valid,
 * sets the SecurityContext with the token owner's identity.
 * <p>
 * If the Bearer token does NOT start with {@code fin_pat_}, this filter is a no-op
 * and the request falls through to the JWT filter.
 */
@Component
@RequiredArgsConstructor
public class PatAuthenticationFilter extends OncePerRequestFilter {

    private static final String TOKEN_PREFIX = "fin_pat_";

    private final PatService patService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // Only process Bearer tokens that start with the PAT prefix
        if (authHeader == null || !authHeader.startsWith("Bearer " + TOKEN_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Don't re-authenticate if already authenticated
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        final String plainToken = authHeader.substring(7); // Remove "Bearer "

        try {
            PersonalAccessToken pat = patService.validateToken(plainToken);

            // We must load a fresh UserDetails from the DB so that its lazy collections
            // (like walletAccesses) are attached to the current Hibernate Session.
            // Using pat.getUser() directly from the cache causes LazyInitializationException.
            UserDetails userDetails = userDetailsService.loadUserByUsername(pat.getUser().getUsername());

            // Set the token's owner as the authenticated user
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities()
            );

            authToken.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
            );

            SecurityContextHolder.getContext().setAuthentication(authToken);

        } catch (InvalidTokenException e) {
            // Invalid token — clear context and let Spring Security handle the 401
            SecurityContextHolder.clearContext();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
