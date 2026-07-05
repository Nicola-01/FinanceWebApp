package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.TagResponse;
import dev.busato.FinanceWebApp.backend.dto.WalletRequest;
import dev.busato.FinanceWebApp.backend.dto.WalletResponse;
import dev.busato.FinanceWebApp.backend.dto.WalletTagsResponse;
import dev.busato.FinanceWebApp.backend.exceptions.UnauthorizedAccessException;
import dev.busato.FinanceWebApp.backend.exceptions.UserNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException;
import dev.busato.FinanceWebApp.backend.mappers.TagMapper;
import dev.busato.FinanceWebApp.backend.mappers.WalletMapper;
import dev.busato.FinanceWebApp.backend.model.*;
import dev.busato.FinanceWebApp.backend.repository.TagRepository;
import dev.busato.FinanceWebApp.backend.repository.UserRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletAccessRepository; // <--- Nuovo import
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import dev.busato.FinanceWebApp.backend.security.WalletSecurity;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WalletService {

  private final WalletRepository walletRepository;
  private final WalletAccessRepository walletAccessRepository;
  private final UserRepository userRepository;
  private final WalletMapper walletMapper;
  private final WalletSecurity walletSecurity;
  private final PatService patService;
  private final TagRepository tagRepository;
  private final TagMapper tagMapper;

  @Transactional
  public WalletResponse createWallet(WalletRequest request, UUID userId) {
    User user =
        userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException(userId));

    if (request.getName().length() < 3 || request.getName().length() > 25)
      throw new IllegalArgumentException("The name must be between 3 and 25 characters long.");

    // Create the wallet
    Wallet wallet =
        Wallet.builder()
            .name(request.getName())
            .description(request.getDescription())
            .color(Optional.ofNullable(request.getColor()).orElse("#abababa"))
            .icon(request.getIcon())
            .currency(Optional.ofNullable(request.getCurrency()).orElse("EUR"))
            .createdAt(LocalDate.now())
            .build();

    wallet = walletRepository.save(wallet);

    // Set the access
    WalletAccess.WalletAccessId accessId = new WalletAccess.WalletAccessId(userId, wallet.getId());

    WalletAccess access = new WalletAccess();
    access.setId(accessId);
    access.setUser(user);
    access.setWallet(wallet);
    access.setRole(WalletAccess.WalletRole.OWNER);
    access.setStatus(WalletAccess.InvitationStatus.ACCEPTED);
    access.setInvitedAt(LocalDate.now());

    walletAccessRepository.save(access);

    // If a PAT created this wallet, auto-grant it READ and WRITE access
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.getCredentials() instanceof PersonalAccessToken pat) {
      patService.addWalletToToken(pat.getId(), wallet.getId());
    }

    return walletMapper.mapToResponse(access);
  }

  @Transactional
  @PreAuthorize("@walletSecurity.isWalletOwner(#userId, #walletId)")
  public WalletResponse updateWallet(UUID walletId, WalletRequest request, UUID userId) {

    if (request.getName().length() < 3 || request.getName().length() > 25)
      throw new IllegalArgumentException("The name must be between 3 and 25 characters long.");

    WalletAccess ownerAccess =
        walletAccessRepository
            .findByWalletIdAndUserIdAndRole(walletId, userId, WalletAccess.WalletRole.OWNER)
            .orElseThrow(
                () -> new UnauthorizedAccessException("Only the owner can update this wallet"));

    Wallet wallet = ownerAccess.getWallet();

    if (request.getName() != null && !request.getName().isBlank())
      wallet.setName(request.getName());
    if (request.getColor() != null && !request.getColor().isBlank())
      wallet.setColor(request.getColor());
    if (request.getIcon() != null && !request.getIcon().isBlank())
      wallet.setIcon(request.getIcon());
    // Description is sent only at creation time; a null on update must not wipe the stored value.
    if (request.getDescription() != null) wallet.setDescription(request.getDescription());

    return walletMapper.mapToResponse(ownerAccess);
  }

  @Transactional
  @PreAuthorize("@walletSecurity.preventPatAccess()")
  public void removeWallet(UUID walletId, UUID userId) {
    WalletAccess userAccess =
        walletAccessRepository
            .findByUserIdAndWalletId(userId, walletId)
            .orElseThrow(() -> new UnauthorizedAccessException("No access to this wallet"));

    if (userAccess.getRole() == WalletAccess.WalletRole.OWNER)
      walletRepository.delete(userAccess.getWallet());
    else userAccess.setStatus(WalletAccess.InvitationStatus.LEFT);
  }

  public List<WalletResponse> getWallets(UUID userId) {
    return walletAccessRepository
        .findAllByUserIdAndStatus(userId, WalletAccess.InvitationStatus.ACCEPTED)
        .stream()
        .filter(access -> walletSecurity.hasReadAccessQuietly(userId, access.getWallet().getId()))
        .map(walletMapper::mapToResponse)
        .sorted((w1, w2) -> w2.getCreatedAt().compareTo(w1.getCreatedAt()))
        .collect(Collectors.toList());
  }

  /**
   * Returns every wallet the user has ACCEPTED access to, each bundled with all of its tags. All
   * tags are fetched in a single batch query and grouped in memory to avoid an N+1 query (one query
   * per wallet).
   */
  public List<WalletTagsResponse> getWalletsWithTags(UUID userId) {
    List<WalletAccess> accesses =
        walletAccessRepository
            .findAllByUserIdAndStatus(userId, WalletAccess.InvitationStatus.ACCEPTED)
            .stream()
            .filter(
                access -> walletSecurity.hasReadAccessQuietly(userId, access.getWallet().getId()))
            .collect(Collectors.toList());

    List<UUID> walletIds =
        accesses.stream().map(access -> access.getWallet().getId()).collect(Collectors.toList());

    // Guard the empty case so we never issue a `WHERE id IN ()` query.
    Map<UUID, List<TagResponse>> tagsByWallet = new HashMap<>();
    if (!walletIds.isEmpty()) {
      tagsByWallet =
          tagRepository.getTagsByWalletIdIn(walletIds).stream()
              .collect(
                  Collectors.groupingBy(
                      tag -> tag.getWallet().getId(),
                      Collectors.mapping(tagMapper::mapToResponse, Collectors.toList())));
    }

    final Map<UUID, List<TagResponse>> grouped = tagsByWallet;
    return accesses.stream()
        .map(
            access ->
                WalletTagsResponse.builder()
                    .wallet(walletMapper.mapToResponse(access))
                    .tags(grouped.getOrDefault(access.getWallet().getId(), List.of()))
                    .build())
        .sorted((w1, w2) -> w2.getWallet().getCreatedAt().compareTo(w1.getWallet().getCreatedAt()))
        .collect(Collectors.toList());
  }

  @PreAuthorize("@walletSecurity.hasReadAccess(#userId, #walletID)")
  public WalletResponse getWallet(UUID userId, UUID walletID) {
    WalletAccess walletAccess =
        walletAccessRepository
            .findByUserIdAndWalletId(userId, walletID)
            .orElseThrow(() -> new WalletNotFoundException(walletID));

    return walletMapper.mapToResponse(walletAccess);
  }
}
