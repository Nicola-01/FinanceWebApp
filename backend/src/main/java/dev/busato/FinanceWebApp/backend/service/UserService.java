package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.ChangePasswordRequest;
import dev.busato.FinanceWebApp.backend.exceptions.UserAlreadyExistsException;
import dev.busato.FinanceWebApp.backend.model.EmailChangeRequest;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.repository.EmailChangeRequestRepository;
import dev.busato.FinanceWebApp.backend.repository.PersonalAccessTokenRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

  /** Number of digits in each verification code. */
  private static final int OTP_LENGTH = 6;

  /** How long a pending email-change stays valid before its codes expire. */
  private static final int CODE_EXPIRY_MINUTES = 10;

  /** Maximum number of confirm attempts before the pending request is dropped. */
  private static final int MAX_ATTEMPTS = 5;

  private static final SecureRandom SECURE_RANDOM = new SecureRandom();

  private final PasswordEncoder passwordEncoder;
  private final UserRepository userRepository;
  private final PersonalAccessTokenRepository patRepository;
  private final EmailChangeRequestRepository emailChangeRepository;
  private final SendEmailService sendEmailService;

  /**
   * Legge la tokenVersion dal DB con cache Caffeine. Ogni richiesta autenticata chiama questo
   * metodo nel filtro JWT.
   */
  @Cacheable(value = "tokenVersions", key = "#userId")
  public int getTokenVersion(UUID userId) {
    return userRepository
        .findById(userId)
        .map(User::getTokenVersion)
        .orElse(-1); // -1 = utente non trovato → invalida qualsiasi token
  }

  /**
   * Incrementa la tokenVersion → invalida TUTTI i token dell'utente su ogni device. Usato da:
   * logout-all, cambio password, reset password.
   */
  @CacheEvict(value = "tokenVersions", key = "#user.id")
  @Transactional
  public void incrementTokenVersion(User user) {
    user.setTokenVersion(user.getTokenVersion() + 1);
    userRepository.save(user);
    patRepository.deleteAllByUserId(user.getId());
  }

  /** Cambio password: valida, aggiorna la password e incrementa tokenVersion. */
  @CacheEvict(value = "tokenVersions", key = "#user.id")
  @Transactional
  public void changePassword(User user, ChangePasswordRequest request) {
    if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword()))
      throw new BadCredentialsException("Current password is incorrect");

    if (!request.getNewPassword().equals(request.getConfirmPassword()))
      throw new IllegalArgumentException("Passwords do not match");

    if (request.getNewPassword().equals(request.getCurrentPassword()))
      throw new IllegalArgumentException("New password cannot be the same as the old one");

    String pw = request.getNewPassword();
    boolean isValid =
        pw.length() >= 8
            && pw.matches(".*[a-z].*")
            && pw.matches(".*[A-Z].*")
            && pw.matches(".*[0-9].*")
            && pw.matches(".*[^A-Za-z0-9].*");

    if (!isValid)
      throw new IllegalArgumentException("Password does not meet security requirements");

    user.setPassword(passwordEncoder.encode(pw));
    user.setPasswordMustChange(false);
    user.setTokenVersion(user.getTokenVersion() + 1); // Invalida tutti i token
    userRepository.save(user);
    patRepository.deleteAllByUserId(user.getId()); // Invalida i Personal Access Tokens
  }

  /**
   * Cambio username. Lo username è il subject del JWT: il chiamante deve ri-emettere i token dopo
   * questo update (i token vecchi puntano al vecchio username e non risolveranno più l'utente).
   */
  @Transactional
  public User updateUsername(User user, String newUsername) {
    String trimmed = newUsername == null ? "" : newUsername.trim();
    if (trimmed.isEmpty()) throw new IllegalArgumentException("Username cannot be blank");

    // Consente il cambio di sola maiuscola/minuscola del proprio username; blocca i duplicati
    // altrui.
    if (!trimmed.equalsIgnoreCase(user.getUsername())
        && userRepository.existsByUsernameIgnoreCase(trimmed)) {
      throw new UserAlreadyExistsException(trimmed);
    }

    user.setUsername(trimmed);
    return userRepository.save(user);
  }

  // ==================== EMAIL CHANGE (double OTP verification) ====================

  /**
   * Starts a double-verification email change. Validates the target address, replaces any pending
   * request for this user with a fresh one (codes stored hashed), and emails one 6-digit code to
   * the CURRENT address and another to the NEW address.
   *
   * <p>Not {@code @Transactional}: the pending row must be persisted independently of the mail send
   * (and, for confirm, attempt counters must survive the exception that reports a bad code).
   */
  public void requestEmailChange(User user, String newEmailRaw) {
    String newEmail = newEmailRaw == null ? "" : newEmailRaw.trim();

    if (newEmail.equalsIgnoreCase(user.getEmail()))
      throw new IllegalArgumentException("New email must be different from the current one");

    if (userRepository.existsByEmailIgnoreCase(newEmail))
      throw new IllegalArgumentException("This email is already in use");

    // Only one active request per user — drop any previous pending change.
    emailChangeRepository.deleteByUserId(user.getId());

    String currentCode = generateOtp();
    String newCode = generateOtp();

    EmailChangeRequest request =
        EmailChangeRequest.builder()
            .userId(user.getId())
            .newEmail(newEmail)
            .currentCodeHash(sha256Hex(currentCode))
            .newCodeHash(sha256Hex(newCode))
            .expiresAt(LocalDateTime.now().plusMinutes(CODE_EXPIRY_MINUTES))
            .attempts(0)
            .build();
    emailChangeRepository.save(request);

    try {
      sendEmailService.sendEmailChangeCode(user.getEmail(), currentCode, false);
      sendEmailService.sendEmailChangeCode(newEmail, newCode, true);
    } catch (Exception e) {
      throw new RuntimeException("Failed to send email verification codes.", e);
    }
  }

  /**
   * Confirms a pending email change. Both codes must match before the address is switched. Expiry
   * and attempt-limit breaches drop the request; a wrong code merely increments (and persists) the
   * attempt counter. The email is not part of the JWT, so no token reissue is required.
   */
  public User confirmEmailChange(User user, String currentEmailCode, String newEmailCode) {
    EmailChangeRequest request =
        emailChangeRepository
            .findByUserId(user.getId())
            .orElseThrow(() -> new IllegalArgumentException("No pending email change"));

    if (request.getExpiresAt().isBefore(LocalDateTime.now())) {
      emailChangeRepository.deleteByUserId(user.getId());
      throw new IllegalArgumentException("Verification codes have expired");
    }

    request.setAttempts(request.getAttempts() + 1);
    if (request.getAttempts() > MAX_ATTEMPTS) {
      emailChangeRepository.deleteByUserId(user.getId());
      throw new IllegalArgumentException("Too many attempts");
    }
    emailChangeRepository.save(request); // persist the incremented attempt count

    // Someone else may have claimed the address between request and confirm.
    if (userRepository.existsByEmailIgnoreCase(request.getNewEmail()))
      throw new IllegalArgumentException("This email is already in use");

    boolean currentOk = sha256Hex(currentEmailCode).equals(request.getCurrentCodeHash());
    boolean newOk = sha256Hex(newEmailCode).equals(request.getNewCodeHash());
    if (!currentOk || !newOk) throw new IllegalArgumentException("Invalid verification code");

    user.setEmail(request.getNewEmail());
    User saved = userRepository.save(user);
    emailChangeRepository.deleteByUserId(user.getId());
    return saved;
  }

  /** Cancels (deletes) any pending email change for the user. */
  public void cancelEmailChange(User user) {
    emailChangeRepository.deleteByUserId(user.getId());
  }

  /** Generates a zero-padded numeric OTP using a CSPRNG. */
  private static String generateOtp() {
    int bound = (int) Math.pow(10, OTP_LENGTH);
    return String.format("%0" + OTP_LENGTH + "d", SECURE_RANDOM.nextInt(bound));
  }

  /** SHA-256 hash of the input, returned as a lowercase hex string (same scheme used for PATs). */
  private static String sha256Hex(String input) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(hash);
    } catch (NoSuchAlgorithmException e) {
      throw new RuntimeException("SHA-256 algorithm not available", e);
    }
  }
}
