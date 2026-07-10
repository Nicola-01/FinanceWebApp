package dev.busato.FinanceWebApp.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Toggles the caller's per-wallet notification mute. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletMuteRequest {
  private boolean muted;
}
