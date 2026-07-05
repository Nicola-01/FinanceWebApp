package dev.busato.FinanceWebApp.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;
import lombok.Data;

/** Request body for bulk-deleting Personal Access Tokens by ID. */
@Data
public class PatBulkDeleteRequest {

  /** IDs of the tokens to delete. Only tokens owned by the caller are affected. */
  @NotEmpty(message = "ids must not be empty")
  private List<UUID> ids;
}
