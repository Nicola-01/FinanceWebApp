package dev.busato.FinanceWebApp.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Data // Generates Getters, Setters, toString, equals, hashCode
@Builder // Allows cleaner object creation: User.builder().email(...).build()
@NoArgsConstructor // Required by Hibernate
@AllArgsConstructor
@Entity
@Table(name = "app_users") // 'user' is a reserved keyword in Postgres, so we use 'app_users'
public class User implements UserDetails {

    @Id // set Primary Key
    @GeneratedValue(strategy = GenerationType.UUID) // Automatically generates a UUID v4
    private UUID id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password; // This will store the BCrypt hash, not the plain password

    @Enumerated(EnumType.STRING) // Saves "ADMIN" as text in DB, instead of a number (0, 1)
    private Role role;

    @Column(nullable = false) // The user must change the psw at the first login
    @Builder.Default
    private boolean mustChangePassword = true; // default value

    @Column(updatable = false)
    private LocalDate createdAt; // Stores only YYYY-MM-DD

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDate.now();
    }

    @OneToMany(mappedBy = "owner")
    private List<Tag> tags = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<WalletAccess> walletAccesses = new ArrayList<>();

    // --- Spring Security Implementation ---
    // These methods allow Spring Security to understand permissions and login status

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Converts our Enum Role to a Spring Security Authority
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        return username; // We use username for authentication
    }

    // Boilerplate for account status (we default to true for MVP)
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }

    public enum Role { ADMIN, USER }
}