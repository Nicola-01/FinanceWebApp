package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.AdminInviteRequest;
import dev.busato.FinanceWebApp.backend.dto.AdminInviteResponse;
import dev.busato.FinanceWebApp.backend.dto.UserResponse;
import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.mappers.AdminInviteMapper;
import dev.busato.FinanceWebApp.backend.mappers.UserMapper;
import dev.busato.FinanceWebApp.backend.model.Registrations;
import dev.busato.FinanceWebApp.backend.model.User;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import dev.busato.FinanceWebApp.backend.repository.ManageUserRepository;
import dev.busato.FinanceWebApp.backend.repository.RegistrationsRepository;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository;
import jakarta.mail.MessagingException;
import jakarta.transaction.Transactional;
import java.io.UnsupportedEncodingException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AdminUserInviteService {

  private final SendEmailService sendEmailService;

  private final UserRepository userRepository;
  private final ManageUserRepository manageUserRepository;
  private final RegistrationsRepository userInvitationRepository;
  private final WalletAccessRepository walletAccessRepository;
  private final TransactionRepository transactionRepository;
  private final UserMapper userMapper;
  private final AdminInviteMapper adminInviteMapper;

  @PreAuthorize("hasRole('ADMIN')")
  public List<UserResponse> getUsersWithStats() {
    return userRepository.findAllByRole(User.Role.USER).stream()
        .map(
            user -> {
              UserResponse response = userMapper.mapToResponse(user);
              List<WalletAccess> accesses =
                  walletAccessRepository.findAllByUserIdAndStatus(
                      user.getId(), WalletAccess.InvitationStatus.ACCEPTED);
              accesses =
                  accesses.stream()
                      .filter(access -> !access.getWallet().getName().equals("Portafoglio Demo"))
                      .collect(Collectors.toList());
              response.setWallets(accesses.size());

              int txCount = 0;
              for (WalletAccess access : accesses)
                txCount += (int) transactionRepository.countByWalletId(access.getWallet().getId());
              response.setTransactions(txCount);

              return response;
            })
        .collect(Collectors.toList());
  }

  @PreAuthorize("hasRole('ADMIN')")
  public void deleteUser(UUID id) {
    if (!userRepository.existsById(id)) throw new UserNotFoundException(id);
    userRepository.deleteById(id);
  }

  @Transactional
  @PreAuthorize("hasRole('ADMIN')")
  public AdminInviteResponse createInvite(AdminInviteRequest request) {
    if (userRepository.findByEmailIgnoreCase(request.getEmail()).isPresent())
      throw new IllegalArgumentException("A user with this email address is already registered.");

    Registrations invitation =
        userInvitationRepository
            .findByEmailIgnoreCase(request.getEmail())
            .orElse(new Registrations());

    String token = UUID.randomUUID().toString();
    invitation.setEmail(request.getEmail());
    invitation.setToken(token);
    invitation.setNote(request.getNote());
    invitation.setExpiresAt(LocalDateTime.now().plusDays(3));
    invitation.setStatus(Registrations.InvitationStatus.PENDING);

    userInvitationRepository.save(invitation);

    AdminInviteResponse inviteResponse = adminInviteMapper.mapToAdminInviteResponse(invitation);

    try {
      sendEmailService.sendRegistrationInvitation(inviteResponse);
    } catch (MessagingException | RuntimeException | UnsupportedEncodingException e) {
      throw new RuntimeException("Unable to send the invitation email to " + request.getEmail(), e);
    }

    return inviteResponse;
  }

  @PreAuthorize("hasRole('ADMIN')")
  public List<AdminInviteResponse> getInvites() {
    return userInvitationRepository
        .findAllByStatusNot(Registrations.InvitationStatus.ACCEPTED)
        .stream()
        .map(adminInviteMapper::mapToAdminInviteResponse)
        .collect(Collectors.toList());
  }

  @Transactional
  @PreAuthorize("hasRole('ADMIN')")
  public void revokeInvite(String email) {
    Registrations invitation =
        userInvitationRepository
            .findByEmailIgnoreCase(email)
            .orElseThrow(() -> new UserNotFoundException(email));

    invitation.setStatus(Registrations.InvitationStatus.REVOKED);
  }

  @Scheduled(cron = "0 0 0 * * *") // Ogni giorno a mezzanotte
  @Transactional
  public void cleanupExpiredInvitations() {
    int daysToKeep = 7;
    LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysToKeep);
    userInvitationRepository.deleteExpiredInvitations(cutoffDate);
  }
}
