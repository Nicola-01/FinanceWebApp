package dev.busato.FinanceWebApp.backend.mappers;

import dev.busato.FinanceWebApp.backend.dto.MemberResponse;
import dev.busato.FinanceWebApp.backend.dto.WalletInviteResponse;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MemberMapper {

  private final WalletMapper walletMapper;

  public MemberResponse mapToResponse(WalletAccess access) {
    return MemberResponse.builder()
        .userId(access.getUser().getId())
        .username(access.getUser().getUsername())
        .role(access.getRole().toString())
        .status(access.getStatus().toString())
        .invitedAt(access.getInvitedAt())
        .build();
  }

  public WalletInviteResponse mapToWalletInviteResponse(WalletAccess access, String ownerUsername) {
    return WalletInviteResponse.builder()
        .walletOwner(ownerUsername)
        .wallet(walletMapper.mapToResponse(access))
        .role(access.getRole().name())
        .status(access.getStatus().name())
        .invitedAt(access.getInvitedAt())
        .build();
  }
}
