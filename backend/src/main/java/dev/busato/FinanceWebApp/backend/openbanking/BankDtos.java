package dev.busato.FinanceWebApp.backend.openbanking;

import dev.busato.FinanceWebApp.backend.model.BankAccountLink;
import dev.busato.FinanceWebApp.backend.model.BankConnection;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Request/response bodies of the {@code /api/bank} endpoints. Never carry session ids/state. */
public final class BankDtos {

  private BankDtos() {}

  public record ConnectRequest(
      @NotBlank String aspspName, @NotBlank String country, @NotNull LocalDate importFrom) {}

  public record CallbackRequest(@NotBlank String code, @NotBlank String state) {}

  public record UrlResponse(String url) {}

  public record WalletBankResponse(boolean enabled, List<BankConnectionResponse> connections) {}

  public record BankAccountResponse(
      UUID id, String displayName, String maskedIban, Instant lastSyncedAt, int importedCount) {

    static BankAccountResponse of(BankAccountLink l) {
      return new BankAccountResponse(
          l.getId(),
          l.getDisplayName(),
          l.getMaskedIban(),
          l.getLastSyncedAt(),
          l.getImportedCount());
    }
  }

  public record BankConnectionResponse(
      UUID id,
      UUID walletId,
      String aspspName,
      BankConnection.Status status,
      Instant validUntil,
      String lastError,
      List<BankAccountResponse> accounts) {

    static BankConnectionResponse of(BankConnection c) {
      return new BankConnectionResponse(
          c.getId(),
          c.getWallet().getId(),
          c.getAspspName(),
          c.getStatus(),
          c.getValidUntil(),
          c.getLastError(),
          c.getAccounts().stream().map(BankAccountResponse::of).toList());
    }
  }
}
