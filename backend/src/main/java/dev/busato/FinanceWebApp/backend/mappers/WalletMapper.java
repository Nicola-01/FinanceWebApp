package dev.busato.FinanceWebApp.backend.mappers;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.busato.FinanceWebApp.backend.dto.WalletResponse;
import dev.busato.FinanceWebApp.backend.model.PersonalAccessToken;
import dev.busato.FinanceWebApp.backend.model.WalletAccess;
import java.util.List;
import java.util.Optional;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WalletMapper {

  private final ObjectMapper objectMapper;

  public WalletResponse mapToResponse(WalletAccess access) {
    WalletResponse.WalletResponseBuilder builder =
        WalletResponse.builder()
            .id(access.getWallet().getId())
            .name(access.getWallet().getName())
            .currency(access.getWallet().getCurrency())
            .icon(access.getWallet().getIcon())
            .color(access.getWallet().getColor())
            .createdAt(access.getWallet().getCreatedAt())
            .userRole(access.getRole());

    getTokenRole(access.getWallet().getId().toString()).ifPresent(builder::tokenAccess);

    return builder.build();
  }

  private Optional<WalletAccess.WalletRole> getTokenRole(String walletId) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !(auth.getCredentials() instanceof PersonalAccessToken pat)) {
      return Optional.empty();
    }

    String permissionsJson = pat.getWalletPermissions();
    if (permissionsJson == null || permissionsJson.isBlank()) {
      return Optional.empty();
    }

    try {
      List<PatWalletPermission> perms =
          objectMapper.readValue(
              permissionsJson, new TypeReference<List<PatWalletPermission>>() {});
      return perms.stream()
          .filter(p -> walletId.equals(p.getWalletId()))
          .findFirst()
          .map(PatWalletPermission::getPermissions)
          .flatMap(this::mapPermissionsToRole);
    } catch (Exception e) {
      // Ignore parsing errors
      return Optional.empty();
    }
  }

  private Optional<WalletAccess.WalletRole> mapPermissionsToRole(List<String> permissions) {
    if (permissions == null) return Optional.empty();

    if (permissions.contains("WRITE")) {
      return Optional.of(WalletAccess.WalletRole.EDITOR);
    } else if (permissions.contains("READ")) {
      return Optional.of(WalletAccess.WalletRole.VIEWER);
    }

    return Optional.empty();
  }

  @Data
  public static class PatWalletPermission {
    private String walletId;
    private List<String> permissions;
  }
}
