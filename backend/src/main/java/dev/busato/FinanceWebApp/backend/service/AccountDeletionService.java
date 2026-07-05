package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.EmailChangeRequestRepository;
import dev.busato.FinanceWebApp.backend.repository.PersonalAccessTokenRepository;
import dev.busato.FinanceWebApp.backend.repository.SubscriptionRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import jakarta.transaction.Transactional;
import java.util.Comparator;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Permanently deletes a user's OWN account (GDPR self-service erasure). Shared wallets the user
 * owns are handed over to another member instead of being destroyed; solely-owned wallets are
 * cascaded away with all their data.
 */
@Service
@RequiredArgsConstructor
public class AccountDeletionService {

  private final PasswordEncoder passwordEncoder;
  private final UserRepository userRepository;
  private final WalletRepository walletRepository;
  private final WalletAccessRepository walletAccessRepository;
  private final SubscriptionRepository subscriptionRepository;
  private final PersonalAccessTokenRepository patRepository;
  private final EmailChangeRequestRepository emailChangeRepository;

  /**
   * Strict, deterministic order used to pick the heir of a shared wallet:
   *
   * <ol>
   *   <li>longest-standing member — earliest {@link WalletAccess#getInvitedAt()};
   *   <li>tie → oldest account — earliest {@link User#getCreatedAt()};
   *   <li>tie → alphabetical username, case-insensitive.
   * </ol>
   */
  private static final Comparator<WalletAccess> NEW_OWNER_ORDER =
      Comparator.comparing(WalletAccess::getInvitedAt)
          .thenComparing(access -> access.getUser().getCreatedAt())
          .thenComparing(access -> access.getUser().getUsername(), String.CASE_INSENSITIVE_ORDER);

  /**
   * Irreversibly deletes {@code user} after confirming their password. Runs in a single
   * transaction: owned wallets are transferred or cascaded-deleted, non-owner memberships are
   * dropped, and every artifact tied to the user's id (PATs, pending email change, access rows, the
   * user row) is removed.
   *
   * @throws BadCredentialsException if the supplied password does not match.
   */
  @Transactional
  public void deleteAccount(User user, String rawPassword) {
    if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
      throw new BadCredentialsException("Password is incorrect");
    }

    UUID userId = user.getId();

    for (WalletAccess access : walletAccessRepository.findAllByUserId(userId)) {
      if (access.getRole() == WalletAccess.WalletRole.OWNER) {
        handleOwnedWallet(access, userId);
      } else {
        // Non-owner membership: just drop my row, the wallet stays with its owner.
        walletAccessRepository.delete(access);
      }
    }

    patRepository.deleteAllByUserId(userId);
    emailChangeRepository.deleteByUserId(userId);
    walletAccessRepository.deleteAllByUserId(userId);
    userRepository.delete(user);
  }

  /**
   * For a wallet the leaving user owns: transfer ownership to the best-ranked accepted member if
   * one exists, otherwise delete the wallet and everything under it.
   */
  private void handleOwnedWallet(WalletAccess myAccess, UUID userId) {
    Wallet wallet = myAccess.getWallet();

    Optional<WalletAccess> heir =
        walletAccessRepository.findAllByWalletId(wallet.getId()).stream()
            .filter(a -> a.getStatus() == WalletAccess.InvitationStatus.ACCEPTED)
            .filter(a -> !userId.equals(a.getId().getUserId()))
            .min(NEW_OWNER_ORDER);

    if (heir.isPresent()) {
      // TRANSFER: promote the heir and remove the leaving owner's access. Wallet data is preserved.
      WalletAccess newOwner = heir.get();
      newOwner.setRole(WalletAccess.WalletRole.OWNER);
      walletAccessRepository.save(newOwner);
      walletAccessRepository.delete(myAccess);
    } else {
      // Nobody left to inherit → delete the wallet. Subscriptions are not part of the Wallet
      // cascade, so remove them first; the wallet delete then cascades tags, transactions and
      // remaining access rows.
      subscriptionRepository.deleteAllByWalletId(wallet.getId());
      walletRepository.delete(wallet);
    }
  }
}
