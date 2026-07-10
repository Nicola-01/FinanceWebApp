package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.SubscriptionBulkResponse;
import dev.busato.FinanceWebApp.backend.dto.SubscriptionRequest;
import dev.busato.FinanceWebApp.backend.dto.SubscriptionResponse;
import dev.busato.FinanceWebApp.backend.dto.TagResponse;
import dev.busato.FinanceWebApp.backend.exceptions.TagNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException;
import dev.busato.FinanceWebApp.backend.mappers.SubscriptionMapper;
import dev.busato.FinanceWebApp.backend.mappers.TagMapper;
import dev.busato.FinanceWebApp.backend.model.Subscription;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.repository.SubscriptionRepository;
import dev.busato.FinanceWebApp.backend.repository.TagRepository;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

/**
 * Service responsible for managing subscriptions (recurring transactions). It handles CRUD
 * operations, mapping, and the core logic for executing and scheduling future occurrences based on
 * complex frequency rules.
 */
@Service
@RequiredArgsConstructor
public class SubscriptionService {

  private final SubscriptionRepository subscriptionRepository;
  private final WalletRepository walletRepository;
  private final TagRepository tagRepository;
  private final TransactionRepository transactionRepository;
  private final SubscriptionMapper subscriptionMapper;
  private final TagMapper tagMapper;
  private final TagService tagService;
  private final java.time.Clock clock;
  private final ExchangeRateService exchangeRateService;

  /**
   * Retrieves all subscriptions associated with a specific wallet.
   *
   * @param walletId The UUID of the wallet
   * @param userId The UUID of the user requesting the data
   * @return A list of SubscriptionResponse objects
   */
  @PreAuthorize("@walletSecurity.hasReadAccess(#userId, #walletId)")
  public List<SubscriptionResponse> getSubscriptionsByWalletID(UUID walletId, UUID userId) {
    return subscriptionRepository.findAllByWalletId(walletId).stream()
        .map(subscriptionMapper::mapToResponse)
        .collect(Collectors.toList());
  }

  /**
   * Creates a new subscription and calculates its first execution date.
   *
   * @param request The DTO containing subscription details
   * @param walletId The UUID of the wallet
   * @param userId The UUID of the user creating the subscription
   * @return The created SubscriptionResponse
   */
  @Transactional
  @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
  public SubscriptionResponse createSubscription(
      SubscriptionRequest request, UUID walletId, UUID userId) {
    return createSubscriptionInternal(request, walletId);
  }

  /**
   * Bulk-upserts subscriptions in a single atomic transaction. Write access is verified once for
   * the whole batch.
   *
   * <p>For each row the referenced tag is resolved by case-insensitive name; a non-blank tag name
   * with no matching tag is <b>auto-created</b> with default styling (icon {@code "tag"}, colour
   * {@code "var(--color-app-green)"}, no parent) and reported once in {@link
   * SubscriptionBulkResponse#getAutoCreatedTags()}. A row is treated as a <b>duplicate</b> of an
   * existing subscription when it shares the same name, tag and start date (name and tag compared
   * case-insensitively/trimmed, date exact): the existing subscription's mutable fields are
   * overwritten (via the standard update logic, including next-execution recalculation) and it is
   * reported in {@code updated}; otherwise a new subscription is created and reported in {@code
   * created}. Duplicate detection also spans rows created earlier in the same batch, so two
   * identical rows collapse to a single record (last one wins).
   *
   * <p>The batch is all-or-nothing: if any row is invalid the whole transaction is rolled back and
   * an {@link IllegalArgumentException} whose message is prefixed with the failing 0-based row
   * index is thrown.
   *
   * @param requests The subscriptions to upsert (an empty/null list yields empty result lists)
   * @param walletId The UUID of the wallet
   * @param userId The UUID of the user performing the upsert
   * @return The created and updated subscriptions plus any auto-created tags
   */
  @Transactional
  @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
  public SubscriptionBulkResponse createSubscriptionsBulk(
      List<SubscriptionRequest> requests, UUID walletId, UUID userId) {
    return createSubscriptionsBulkInternal(requests, walletId);
  }

  /**
   * Same upsert as {@link #createSubscriptionsBulk(List, UUID, UUID)} but without its own
   * authorization. Write access must already have been verified by the caller, so this method
   * carries no {@code @PreAuthorize} of its own — used by the atomic wallet-creation flow, where
   * the caller has just created the wallet as OWNER within the same transaction.
   */
  @Transactional
  public SubscriptionBulkResponse createSubscriptionsBulkInternal(
      List<SubscriptionRequest> requests, UUID walletId) {
    List<Subscription> createdList = new ArrayList<>();
    List<Subscription> updatedList = new ArrayList<>();
    List<TagResponse> autoCreatedTags = new ArrayList<>();
    if (requests == null || requests.isEmpty())
      return SubscriptionBulkResponse.builder()
          .created(new ArrayList<>())
          .updated(new ArrayList<>())
          .autoCreatedTags(autoCreatedTags)
          .build();

    Wallet wallet =
        walletRepository
            .findById(walletId)
            .orElseThrow(() -> new WalletNotFoundException(walletId));

    // Tag index (existing + auto-created within this batch), keyed by normalised name.
    Map<String, Tag> tagByName = new HashMap<>();
    for (Tag t : tagRepository.getTagsByWalletId(walletId))
      tagByName.put(normalize(t.getName()), t);

    // Existing subscriptions keyed by (name|tag|startDate) for dedup; absorbs in-batch creations.
    Map<String, Subscription> byKey = new HashMap<>();
    for (Subscription s : subscriptionRepository.findAllByWalletId(walletId))
      byKey.put(
          subscriptionKey(
              s.getName(), s.getTag() == null ? null : s.getTag().getName(), s.getStartDate()),
          s);

    // Identity-based bookkeeping so responses are built once from final entity state (last wins).
    Set<Subscription> createdInBatch = Collections.newSetFromMap(new IdentityHashMap<>());
    Set<Subscription> updatedTracked = Collections.newSetFromMap(new IdentityHashMap<>());

    for (int i = 0; i < requests.size(); i++) {
      try {
        SubscriptionRequest req = requests.get(i);
        Tag tag = resolveOrAutoCreateTag(req.getTag(), walletId, tagByName, autoCreatedTags);

        LocalDate startDate =
            req.getStartDate() != null ? req.getStartDate() : LocalDate.now(clock);
        String key = subscriptionKey(req.getName(), tag == null ? null : tag.getName(), startDate);
        Subscription existing = byKey.get(key);

        if (existing == null) {
          Subscription created = buildAndPersistSubscription(req, wallet, tag);
          byKey.put(
              subscriptionKey(
                  created.getName(), tag == null ? null : tag.getName(), created.getStartDate()),
              created);
          createdInBatch.add(created);
          createdList.add(created);
        } else {
          applySubscriptionUpdate(existing, req, tag);
          subscriptionRepository.save(existing);
          if (!createdInBatch.contains(existing) && updatedTracked.add(existing))
            updatedList.add(existing);
        }
      } catch (RuntimeException ex) {
        throw new IllegalArgumentException("Row " + i + ": " + ex.getMessage(), ex);
      }
    }

    return SubscriptionBulkResponse.builder()
        .created(
            createdList.stream()
                .map(subscriptionMapper::mapToResponse)
                .collect(Collectors.toList()))
        .updated(
            updatedList.stream()
                .map(subscriptionMapper::mapToResponse)
                .collect(Collectors.toList()))
        .autoCreatedTags(autoCreatedTags)
        .build();
  }

  /**
   * Per-row create logic for the single-create path. Assumes write access to the wallet has already
   * been verified by the caller.
   */
  private SubscriptionResponse createSubscriptionInternal(
      SubscriptionRequest request, UUID walletId) {
    if (request.getId() != null
        && subscriptionRepository.existsByIdAndWalletId(request.getId(), walletId)) {
      // Idempotent offline replay: the row already landed in a previous attempt.
      return subscriptionMapper.mapToResponse(
          subscriptionRepository.findById(request.getId()).orElseThrow());
    }

    Wallet wallet =
        walletRepository
            .findById(walletId)
            .orElseThrow(() -> new WalletNotFoundException(walletId));

    Tag tag = resolveExistingTag(request.getTag(), walletId);

    Subscription sub = buildAndPersistSubscription(request, wallet, tag);
    return subscriptionMapper.mapToResponse(sub);
  }

  /**
   * Validates, builds, schedules (and executes if already due) and persists a brand-new
   * subscription. Shared by the single-create and bulk-create paths.
   */
  private Subscription buildAndPersistSubscription(
      SubscriptionRequest request, Wallet wallet, Tag tag) {
    validateSubscriptionNameForCreate(request.getName());
    requireNonNegativeAmountForCreate(request.getAmount());

    Subscription sub =
        Subscription.builder()
            .id(request.getId())
            .wallet(wallet)
            .tag(tag)
            .name(request.getName())
            .amount(request.getAmount())
            // originalAmount is required (NOT NULL) and equals the amount when no
            // currency conversion is involved. Callers that omit it — e.g. the wallet
            // wizard staging simple, single-currency subscriptions — would otherwise
            // persist null and break both the subscription and the transactions it
            // generates, so default it to the amount here (before executeSubscription
            // copies it onto the first generated transaction).
            .originalAmount(
                request.getOriginalAmount() != null
                    ? request.getOriginalAmount()
                    : request.getAmount())
            .originalCurrency(request.getOriginalCurrency())
            .exchangeValue(request.getExchangeValue())
            .autoExchangeRate(request.isAutoExchangeRate())
            .type(Subscription.Type.valueOf(request.getType()))
            .notes(request.getNotes())
            .status(
                Subscription.Status.valueOf(
                    request.getStatus() != null ? request.getStatus() : "ACTIVE"))
            .startDate(
                request.getStartDate() != null ? request.getStartDate() : LocalDate.now(clock))
            .frequencyType(Subscription.Frequency.valueOf(request.getFrequencyType()))
            .frequencyInterval(
                request.getFrequencyInterval() > 0 ? request.getFrequencyInterval() : 1)
            .monthlySpecificDay(request.getMonthlySpecificDay())
            .lastWorkingDayOfMonth(request.isLastWorkingDayOfMonth())
            .duration(Subscription.Duration.valueOf(request.getDuration()))
            .durationTimes(request.getDurationTimes())
            .durationUntil(request.getDurationUntil())
            .executedTimes(0)
            .build();

    sub.setNextExecutionDate(calculateNextExecutionDate(sub, sub.getStartDate(), false));

    if (!sub.getNextExecutionDate().isAfter(LocalDate.now(clock))) executeSubscription(sub);

    return subscriptionRepository.save(sub);
  }

  /** Resolves an existing tag by name (blank/null → no tag), throwing if it cannot be found. */
  private Tag resolveExistingTag(String tagName, UUID walletId) {
    if (tagName == null || tagName.isBlank()) return null;
    return tagRepository
        .findByNameIgnoreCaseAndWalletId(tagName, walletId)
        .orElseThrow(() -> new TagNotFoundException(tagName, walletId));
  }

  /**
   * Resolves a subscription's tag by name, auto-creating it with default styling when the name is
   * non-blank and no matching tag exists. Auto-created tags are recorded once each.
   */
  private Tag resolveOrAutoCreateTag(
      String tagName,
      UUID walletId,
      Map<String, Tag> tagByName,
      List<TagResponse> autoCreatedTags) {
    if (tagName == null || tagName.isBlank()) return null;
    Tag tag = tagByName.get(normalize(tagName));
    if (tag == null) {
      tag =
          tagService.createTagFromImport(tagName.trim(), "tag", "var(--color-app-green)", walletId);
      tagByName.put(normalize(tagName), tag);
      autoCreatedTags.add(tagMapper.mapToResponse(tag));
    }
    return tag;
  }

  private void validateSubscriptionNameForCreate(String name) {
    if (name == null || name.length() < 3 || name.length() > 40)
      throw new IllegalArgumentException("The name must be between 3 and 40 characters long.");
  }

  private void requireNonNegativeAmountForCreate(BigDecimal amount) {
    if (amount == null) throw new IllegalArgumentException("The amount is required.");
    if (amount.compareTo(BigDecimal.ZERO) < 0)
      throw new IllegalArgumentException("The amount cannot be negative.");
  }

  private static String normalize(String value) {
    return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
  }

  /** Dedup key: name + tag name (both case-insensitive) + exact start date. */
  private static String subscriptionKey(String name, String tagName, LocalDate startDate) {
    return (name == null ? "" : normalize(name))
        + "|"
        + (tagName == null ? "" : normalize(tagName))
        + "|"
        + startDate;
  }

  /**
   * Updates an existing subscription. If scheduling rules are modified, the next execution date is
   * recalculated.
   *
   * @param subscriptionId The UUID of the subscription to update
   * @param request The updated data
   * @param walletId The UUID of the wallet
   * @param userId The UUID of the requesting user
   * @return The updated SubscriptionResponse
   */
  @Transactional
  @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
  public SubscriptionResponse updateSubscription(
      UUID subscriptionId, SubscriptionRequest request, UUID walletId, UUID userId) {
    Subscription sub =
        subscriptionRepository
            .findByIdAndWalletId(subscriptionId, walletId)
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Subscription not found or does not belong to this wallet"));

    Tag tag = resolveExistingTag(request.getTag(), walletId);
    applySubscriptionUpdate(sub, request, tag);

    sub = subscriptionRepository.save(sub);
    return subscriptionMapper.mapToResponse(sub);
  }

  /**
   * Applies an update to an already-loaded subscription using the provided (already-resolved) tag,
   * recalculating the next execution date when a scheduling rule changes. Shared by the single
   * update path and the bulk upsert. Does not persist; the caller saves.
   */
  private void applySubscriptionUpdate(Subscription sub, SubscriptionRequest request, Tag tag) {
    if (request.getName() != null) {
      if (request.getName().length() < 2 || request.getName().length() > 40)
        throw new IllegalArgumentException("The name must be between 3 and 40 characters long.");
      sub.setName(request.getName());
    }

    if (request.getAmount() != null && request.getAmount().compareTo(BigDecimal.ZERO) < 0)
      throw new IllegalArgumentException("The amount cannot be negative.");

    sub.setTag(tag);

    if (request.getAmount() != null) sub.setAmount(request.getAmount());
    if (request.getOriginalAmount() != null) sub.setOriginalAmount(request.getOriginalAmount());
    sub.setOriginalCurrency(request.getOriginalCurrency());
    if (request.getExchangeValue() != null) sub.setExchangeValue(request.getExchangeValue());
    sub.setAutoExchangeRate(request.isAutoExchangeRate());
    if (request.getType() != null) sub.setType(Subscription.Type.valueOf(request.getType()));
    sub.setNotes(request.getNotes());

    if (request.getStatus() != null)
      sub.setStatus(Subscription.Status.valueOf(request.getStatus()));

    // Flag to track if we need to recalculate the next execution date
    boolean recalculateDate = false;

    if (request.getStartDate() != null && !request.getStartDate().equals(sub.getStartDate())) {
      sub.setStartDate(request.getStartDate());
      recalculateDate = true;
    }
    if (request.getFrequencyType() != null
        && !request.getFrequencyType().equals(sub.getFrequencyType().name())) {
      sub.setFrequencyType(Subscription.Frequency.valueOf(request.getFrequencyType()));
      recalculateDate = true;
    }
    if (request.getFrequencyInterval() > 0
        && request.getFrequencyInterval() != sub.getFrequencyInterval()) {
      sub.setFrequencyInterval(request.getFrequencyInterval());
      recalculateDate = true;
    }
    if (request.getMonthlySpecificDay() != sub.getMonthlySpecificDay()
        || request.isLastWorkingDayOfMonth() != sub.isLastWorkingDayOfMonth()) {
      sub.setMonthlySpecificDay(request.getMonthlySpecificDay());
      sub.setLastWorkingDayOfMonth(request.isLastWorkingDayOfMonth());
      recalculateDate = true;
    }

    // If any scheduling rule was changed, recalculate the next due date
    // Note: For stopping subscriptions, duration rules don't force recalculation from startDate
    if (recalculateDate) {
      sub.setNextExecutionDate(calculateNextExecutionDate(sub, sub.getStartDate(), true));
    }

    if (request.getDuration() != null)
      sub.setDuration(Subscription.Duration.valueOf(request.getDuration()));
    sub.setDurationTimes(request.getDurationTimes());
    sub.setDurationUntil(request.getDurationUntil());
  }

  /**
   * Deletes a subscription.
   *
   * @param subscriptionId The UUID of the subscription to delete
   * @param walletId The UUID of the wallet
   * @param userId The UUID of the requesting user
   */
  @Transactional
  @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
  public void deleteSubscription(UUID subscriptionId, UUID walletId, UUID userId) {
    Subscription sub =
        subscriptionRepository
            .findByIdAndWalletId(subscriptionId, walletId)
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Subscription not found or does not belong to this wallet"));
    subscriptionRepository.delete(sub);
  }

  // =========================================================================
  // MAPPER METHODS
  // =========================================================================

  // =========================================================================
  // EXECUTION ENGINE (CRON JOB LOGIC)
  // =========================================================================

  /**
   * Main entry point for the daily cron job. Finds all active subscriptions that are due today or
   * in the past, and processes them by generating actual transactions.
   */
  @Transactional
  public void processDueSubscriptions() {
    LocalDate today = LocalDate.now(clock);

    // Retrieve all active and paused subscriptions that are due for execution
    List<Subscription> dueSubscriptions =
        subscriptionRepository.findAllByStatusInAndNextExecutionDateLessThanEqual(
            List.of(Subscription.Status.ACTIVE, Subscription.Status.PAUSED), today);

    for (Subscription sub : dueSubscriptions) executeSubscription(sub);
  }

  /**
   * Executes a single subscription: creates the transaction, updates history, calculates the next
   * execution date, and checks for completion.
   *
   * @param sub The Subscription entity to execute
   */
  private void executeSubscription(Subscription sub) {
    int currentExecution = sub.getExecutedTimes() + 1;
    // The subscription's name and notes are metadata of the subscription only and must NOT be
    // transmitted onto the generated transactions. Use the tag name (with a safe fallback) instead.
    String generatedName = sub.getTag() != null ? sub.getTag().getName() : sub.getName();
    String generatedNotes;
    if (sub.getDuration() == Subscription.Duration.TIMES && sub.getDurationTimes() != null)
      generatedNotes =
          String.format(
              "Recurring: %s (%d / %d)", generatedName, currentExecution, sub.getDurationTimes());
    else generatedNotes = String.format("Recurring: %s (#%d)", generatedName, currentExecution);

    // 1. Create the actual Transaction entity linked to the wallet ONLY if ACTIVE
    if (sub.getStatus() == Subscription.Status.ACTIVE) {
      // Resolve the converted amount / rate: a foreign-currency subscription with
      // autoExchangeRate uses the day's live rate; otherwise the stored (fixed)
      // values are kept. If the live fetch fails, we fall back to the stored ones
      // rather than skip the transaction.
      BigDecimal resolvedAmount = sub.getAmount();
      BigDecimal resolvedExchange = sub.getExchangeValue();
      String walletCurrency = sub.getWallet() != null ? sub.getWallet().getCurrency() : null;
      boolean foreign =
          sub.getOriginalCurrency() != null
              && walletCurrency != null
              && !sub.getOriginalCurrency().equals(walletCurrency);
      if (foreign && sub.isAutoExchangeRate() && sub.getOriginalAmount() != null) {
        BigDecimal liveRate =
            exchangeRateService.getRate(sub.getOriginalCurrency(), walletCurrency).orElse(null);
        if (liveRate != null) {
          resolvedExchange = liveRate;
          resolvedAmount =
              sub.getOriginalAmount().multiply(liveRate).setScale(2, RoundingMode.HALF_UP);
        }
      }

      Transaction transaction =
          Transaction.builder()
              .wallet(sub.getWallet())
              .subscription(sub)
              .tag(sub.getTag())
              .name(generatedName)
              .amount(resolvedAmount)
              // Transactions.original_amount is NOT NULL. Guard here (not just at
              // subscription build) so the daily cron never fails on a subscription
              // that somehow carries a null original amount — fall back to the
              // resolved amount, which equals it when no conversion is involved.
              .originalAmount(
                  sub.getOriginalAmount() != null ? sub.getOriginalAmount() : resolvedAmount)
              .originalCurrency(sub.getOriginalCurrency())
              .exchangeValue(resolvedExchange)
              .type(Transaction.Type.valueOf(sub.getType().name()))
              .notes(generatedNotes)
              .transactionDate(
                  sub.getNextExecutionDate()) // Transaction date is when it was scheduled
              .build();

      transactionRepository.save(transaction);

      // Increment executed times only when a transaction actually occurred
      sub.setExecutedTimes(sub.getExecutedTimes() + 1);
    }

    // 2. Update tracking history
    sub.setLastExecutionDate(sub.getNextExecutionDate());

    // 3. Calculate and set the next execution date
    LocalDate nextDate = calculateNextExecutionDate(sub, sub.getNextExecutionDate(), true);
    sub.setNextExecutionDate(nextDate);

    // 4. Check if the subscription has reached its end condition
    checkCompletion(sub);

    // Save the updated subscription state
    subscriptionRepository.save(sub);
  }

  // =========================================================================
  // DATE CALCULATION LOGIC
  // =========================================================================

  /**
   * Finds the last working day (Monday to Friday) of a given month.
   *
   * @param referenceDate A date within the target month
   * @return The LocalDate representing the last working day
   */
  private LocalDate getLastWorkingDayOfMonth(LocalDate referenceDate) {
    LocalDate lastDay = referenceDate.withDayOfMonth(referenceDate.lengthOfMonth());
    while (lastDay.getDayOfWeek() == DayOfWeek.SATURDAY
        || lastDay.getDayOfWeek() == DayOfWeek.SUNDAY) {
      lastDay = lastDay.minusDays(1);
    }
    return lastDay;
  }

  /**
   * Core method to calculate the next execution date using a mathematical fast-forward approach to
   * avoid infinite loops, followed by a micro-adjustment.
   *
   * @param sub The subscription entity
   * @param lastExecutionDate The reference date to jump from
   * @param avoidToday Calculate the next day after today
   * @return The calculated next execution date
   */
  private LocalDate calculateNextExecutionDate(
      Subscription sub, LocalDate lastExecutionDate, boolean avoidToday) {
    LocalDate today = LocalDate.now(clock);

    // 1. MATHEMATICAL FAST-FORWARD: Skip over large time gaps instantly
    LocalDate nextDate = applyFastForward(sub, lastExecutionDate, today);

    // 2. FINAL MICRO-ADJUSTMENT: Step forward interval by interval until the date is in the future
    // Note: nextDate is already close to 'today', so this loop runs 1-2 times max.

    while (nextDate.isBefore(today) || (avoidToday && nextDate.isEqual(today)))
      nextDate = advanceByOneInterval(sub, nextDate);

    return nextDate;
  }

  /**
   * Calculates a massive time jump based on intervals. Useful when the subscription was created far
   * in the past.
   */
  private LocalDate applyFastForward(Subscription sub, LocalDate startDate, LocalDate today) {
    long daysBetween = ChronoUnit.DAYS.between(startDate, today);
    if (daysBetween <= 0) return startDate;

    int interval = sub.getFrequencyInterval();
    LocalDate nextDate = startDate;
    long jumps;

    switch (sub.getFrequencyType()) {
      case DAILY:
        jumps = daysBetween / interval;
        nextDate = nextDate.plusDays(jumps * interval);
        break;
      case WEEKLY:
        jumps = daysBetween / (interval * 7L);
        nextDate = nextDate.plusWeeks(jumps * interval);
        break;
      case MONTHLY:
        jumps = ChronoUnit.MONTHS.between(nextDate, today) / interval;
        nextDate = nextDate.plusMonths(jumps * interval);
        break;
      case YEARLY:
        jumps = ChronoUnit.YEARS.between(nextDate, today) / interval;
        nextDate = nextDate.plusYears(jumps * interval);
        break;
    }

    // Re-apply special monthly rules (like "last working day") after the large jump
    return applyMonthlyRules(sub, nextDate);
  }

  /** Advances a given date exactly by one recurrence interval. */
  private LocalDate advanceByOneInterval(Subscription sub, LocalDate currentDate) {
    int interval = sub.getFrequencyInterval();
    LocalDate nextDate = currentDate;

    switch (sub.getFrequencyType()) {
      case DAILY:
        return nextDate.plusDays(interval);
      case WEEKLY:
        return nextDate.plusWeeks(interval);
      case MONTHLY:
        nextDate = nextDate.plusMonths(interval);
        return applyMonthlyRules(sub, nextDate);
      case YEARLY:
        return nextDate.plusYears(interval);
      default:
        return nextDate;
    }
  }

  /** Enforces monthly edge-cases like specific dates (e.g., 31st) or "last working day". */
  private LocalDate applyMonthlyRules(Subscription sub, LocalDate date) {
    if (sub.getFrequencyType() != Subscription.Frequency.MONTHLY) {
      return date; // Skip if not a monthly subscription
    }

    if (sub.isLastWorkingDayOfMonth()) {
      return getLastWorkingDayOfMonth(date);
    }

    if (sub.getMonthlySpecificDay() != null) {
      int maxDays = date.lengthOfMonth();
      int targetDay = Math.min(sub.getMonthlySpecificDay(), maxDays); // Cap at max days of month
      return date.withDayOfMonth(targetDay);
    }

    return date;
  }

  /** Evaluates if the subscription should be marked as COMPLETED based on its duration settings. */
  private void checkCompletion(Subscription sub) {
    // If duration is based on a fixed amount of occurrences
    if (sub.getDuration() == Subscription.Duration.TIMES && sub.getDurationTimes() != null) {
      if (sub.getExecutedTimes() >= sub.getDurationTimes()) {
        sub.setStatus(Subscription.Status.COMPLETED);
      }
    }

    // If duration is set until a specific cut-off date
    if (sub.getDuration() == Subscription.Duration.UNTIL && sub.getDurationUntil() != null) {
      if (sub.getNextExecutionDate().isAfter(sub.getDurationUntil())) {
        sub.setStatus(Subscription.Status.COMPLETED);
      }
    }
  }
}
