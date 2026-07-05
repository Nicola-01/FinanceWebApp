package dev.busato.FinanceWebApp.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;
import lombok.Data;

/** Request body for bulk pausing/resuming Personal Access Tokens by ID. */
@Data
public class PatBulkPauseRequest {

  /** IDs of the tokens to pause/resume. Only tokens owned by the caller are affected. */
  @NotEmpty(message = "ids must not be empty")
  private List<UUID> ids;

  /** Target paused state to apply to every listed token owned by the caller. */
  @NotNull(message = "paused must not be null")
  private Boolean paused;
}
