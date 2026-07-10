package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.BudgetRequest;
import dev.busato.FinanceWebApp.backend.dto.BudgetStatusResponse;
import dev.busato.FinanceWebApp.backend.exceptions.BudgetConflictException;
import dev.busato.FinanceWebApp.backend.exceptions.BudgetNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.TagNotFoundException;
import dev.busato.FinanceWebApp.backend.mappers.BudgetMapper;
import dev.busato.FinanceWebApp.backend.model.Budget;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.repository.BudgetAlertLogRepository;
import dev.busato.FinanceWebApp.backend.repository.BudgetRepository;
import dev.busato.FinanceWebApp.backend.repository.TagRepository;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BudgetService {

  private final BudgetRepository budgetRepository;
  private final TransactionRepository transactionRepository;
  private final TagRepository tagRepository;
  private final WalletRepository walletRepository;
  private final BudgetMapper budgetMapper;
  private final BudgetAlertLogRepository budgetAlertLogRepository;

  @PreAuthorize("@walletSecurity.hasReadAccess(#userId, #walletId)")
  public List<BudgetStatusResponse> getBudgets(UUID walletId, UUID userId) {
    LocalDate today = LocalDate.now();
    return budgetRepository.findAllByWalletId(walletId).stream()
        .map(b -> computeStatus(b, today))
        .sorted(Comparator.comparing(BudgetStatusResponse::getName, String.CASE_INSENSITIVE_ORDER))
        .toList();
  }

  @Transactional
  @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
  public BudgetStatusResponse createBudget(BudgetRequest request, UUID walletId, UUID userId) {
    Budget budget = new Budget();
    applyRequest(budget, request, walletId);
    budget.setWallet(walletRepository.getReferenceById(walletId));
    budgetRepository.save(budget);
    return computeStatus(budget, LocalDate.now());
  }

  @Transactional
  @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
  public BudgetStatusResponse updateBudget(
      UUID budgetId, BudgetRequest request, UUID walletId, UUID userId) {
    Budget budget =
        budgetRepository
            .findByIdAndWalletId(budgetId, walletId)
            .orElseThrow(() -> new BudgetNotFoundException(budgetId));
    applyRequest(budget, request, walletId);
    budgetRepository.save(budget);
    return computeStatus(budget, LocalDate.now());
  }

  @Transactional
  @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
  public void deleteBudget(UUID budgetId, UUID walletId, UUID userId) {
    Budget budget =
        budgetRepository
            .findByIdAndWalletId(budgetId, walletId)
            .orElseThrow(() -> new BudgetNotFoundException(budgetId));
    // Alert logs FK-reference the budget; purge them first or the delete would be blocked.
    budgetAlertLogRepository.deleteAllByBudgetId(budgetId);
    budgetRepository.delete(budget);
  }

  /** Validates the request and copies it onto the entity (shared by create/update). */
  private void applyRequest(Budget budget, BudgetRequest request, UUID walletId) {
    Tag tag = null;
    if (request.getTagName() != null && !request.getTagName().isBlank()) {
      tag =
          tagRepository
              .findByNameIgnoreCaseAndWalletId(request.getTagName(), walletId)
              .orElseThrow(() -> new TagNotFoundException(request.getTagName(), walletId));
    }

    LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();

    if (request.getPeriodType() == Budget.PeriodType.CUSTOM) {
      if (request.getEndDate() == null)
        throw new IllegalArgumentException("A custom budget requires an end date.");
      if (request.getEndDate().isBefore(startDate))
        throw new IllegalArgumentException("The end date must not be before the start date.");
      budget.setEndDate(request.getEndDate());
      budget.setRollover(false); // spec: rollover does not apply to custom budgets
    } else {
      requireNoOtherRecurring(budget, tag, walletId, request.getPeriodType());
      budget.setEndDate(null);
      budget.setRollover(Boolean.TRUE.equals(request.getRollover()));
    }

    budget.setTag(tag);
    budget.setName(request.getName());
    budget.setLimitAmount(request.getLimitAmount());
    budget.setPeriodType(request.getPeriodType());
    budget.setStartDate(startDate);
    budget.setAlertThresholds(budgetMapper.thresholdsToJson(request.getAlertThresholds()));
  }

  /** Spec: at most one recurring budget per (wallet, tag-or-null) scope. */
  private void requireNoOtherRecurring(
      Budget budget, Tag tag, UUID walletId, Budget.PeriodType periodType) {
    UUID tagId = tag != null ? tag.getId() : null;
    boolean conflict =
        budgetRepository.findAllByWalletId(walletId).stream()
            .filter(other -> !Objects.equals(other.getId(), budget.getId()))
            .filter(other -> other.getPeriodType() != Budget.PeriodType.CUSTOM)
            .anyMatch(
                other ->
                    Objects.equals(other.getTag() != null ? other.getTag().getId() : null, tagId));
    if (conflict)
      throw new BudgetConflictException(
          "A recurring budget already exists for this " + (tagId == null ? "wallet" : "tag") + ".");
  }

  /**
   * Computes the live status of a budget for the period containing {@code today}. No authorization
   * of its own: the API entry points above are gated, and the alerts cron job runs as the system.
   */
  public BudgetStatusResponse computeStatus(Budget budget, LocalDate today) {
    boolean active = BudgetPeriods.isActive(budget, today);
    BudgetPeriods.Period period = BudgetPeriods.currentPeriod(budget, today);
    List<Integer> thresholds = budgetMapper.thresholdsFromJson(budget.getAlertThresholds());

    BigDecimal spent = sumExpenses(budget, period.start(), period.end());

    BigDecimal effectiveLimit = budget.getLimitAmount();
    if (active && budget.isRollover() && period.elapsedPeriods() > 1) {
      BigDecimal spentBefore =
          sumExpenses(budget, BudgetPeriods.firstPeriodStart(budget), period.start().minusDays(1));
      BigDecimal carry =
          budget
              .getLimitAmount()
              .multiply(BigDecimal.valueOf(period.elapsedPeriods() - 1))
              .subtract(spentBefore);
      effectiveLimit = budget.getLimitAmount().add(carry);
    }

    int percentUsed;
    if (effectiveLimit.compareTo(BigDecimal.ZERO) > 0) {
      percentUsed =
          spent
              .multiply(BigDecimal.valueOf(100))
              .divide(effectiveLimit, 0, RoundingMode.DOWN)
              .intValue();
    } else {
      percentUsed = 100; // a negative rollover carry ate the whole period
    }

    List<Integer> crossed = thresholds.stream().filter(t -> percentUsed >= t).toList();
    String status =
        percentUsed >= 100
            ? "EXCEEDED"
            : crossed.stream().anyMatch(t -> t < 100) ? "WARNING" : "OK";

    return budgetMapper
        .baseResponse(budget)
        .periodStart(period.start())
        .periodEnd(period.end())
        .spent(spent)
        .effectiveLimit(effectiveLimit)
        .remaining(effectiveLimit.subtract(spent))
        .percentUsed(percentUsed)
        .status(status)
        .crossedThresholds(crossed)
        .active(active)
        .build();
  }

  private BigDecimal sumExpenses(Budget budget, LocalDate from, LocalDate to) {
    UUID walletId = budget.getWallet().getId();
    if (budget.getTag() == null) {
      return transactionRepository.sumAmountByWalletAndDateRange(
          walletId, Transaction.Type.EXPENSE, from, to);
    }
    return transactionRepository.sumAmountByWalletAndDateRangeAndTags(
        walletId, Transaction.Type.EXPENSE, from, to, subtreeTagIds(budget.getTag(), walletId));
  }

  /** The tag's id plus every descendant's, resolved from the wallet's (small) tag list. */
  private List<UUID> subtreeTagIds(Tag root, UUID walletId) {
    Map<UUID, List<Tag>> childrenByParent = new HashMap<>();
    for (Tag t : tagRepository.getTagsByWalletId(walletId)) {
      if (t.getParent() != null) {
        childrenByParent.computeIfAbsent(t.getParent().getId(), k -> new ArrayList<>()).add(t);
      }
    }
    List<UUID> ids = new ArrayList<>();
    Set<UUID> visited = new HashSet<>();
    Deque<Tag> queue = new ArrayDeque<>();
    queue.add(root);
    while (!queue.isEmpty()) {
      Tag current = queue.poll();
      if (!visited.add(current.getId())) {
        continue; // guard against cycles in the tag graph
      }
      ids.add(current.getId());
      queue.addAll(childrenByParent.getOrDefault(current.getId(), List.of()));
    }
    return ids;
  }
}
