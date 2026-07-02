package dev.busato.FinanceWebApp.backend.dto;

import java.util.List;
import lombok.Data;

/** Request body for updating a Personal Access Token's wallet permissions. */
@Data
public class PatUpdateRequest {

  /** List of wallets and their granted permissions */
  private List<WalletPermission> walletPermissions;
}
