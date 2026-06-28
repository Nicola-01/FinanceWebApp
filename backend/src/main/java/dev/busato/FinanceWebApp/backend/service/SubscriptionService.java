package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.SubscriptionRequest;
import dev.busato.FinanceWebApp.backend.dto.SubscriptionResponse;
import dev.busato.FinanceWebApp.backend.exceptions.TagNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException;
import dev.busato.FinanceWebApp.backend.mappers.SubscriptionMapper;
import dev.busato.FinanceWebApp.backend.model.Subscription;
import dev.busato.FinanceWebApp.backend.model.Tag;
import dev.busato.FinanceWebApp.backend.model.Transaction;
import dev.busato.FinanceWebApp.backend.model.Wallet;
import dev.busato.FinanceWebApp.backend.repository.SubscriptionRepository;
import dev.busato.FinanceWebApp.backend.repository.TagRepository;
import dev.busato.FinanceWebApp.backend.repository.TransactionRepository;
import dev.busato.FinanceWebApp.backend.repository.WalletRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service responsible for managing subscriptions (recurring transactions).
 * It handles CRUD operations, mapping, and the core logic for executing
 * and scheduling future occurrences based on complex frequency rules.
 */
@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final WalletRepository walletRepository;
    private final TagRepository tagRepository;
    private final TransactionRepository transactionRepository;
    private final SubscriptionMapper subscriptionMapper;


    /**
     * Retrieves all subscriptions associated with a specific wallet.
     *
     * @param walletId The UUID of the wallet
     * @param userId   The UUID of the user requesting the data
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
     * @param request  The DTO containing subscription details
     * @param walletId The UUID of the wallet
     * @param userId   The UUID of the user creating the subscription
     * @return The created SubscriptionResponse
     */
    @Transactional
    @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
    public SubscriptionResponse createSubscription(SubscriptionRequest request, UUID walletId, UUID userId) {
        Wallet wallet = walletRepository.findById(walletId).orElseThrow(() -> new WalletNotFoundException(walletId));

        if (request.getName().length() < 3 || request.getName().length() > 40)
            throw new IllegalArgumentException("The name must be between 3 and 40 characters long.");

        if (request.getAmount().compareTo(BigDecimal.ZERO) < 0)
            throw new IllegalArgumentException("The amount cannot be negative.");

        Tag tag = null;
        if (request.getTag() != null && !request.getTag().isBlank()) {
            tag = tagRepository.findByNameIgnoreCaseAndWalletId(request.getTag(), walletId)
                    .orElseThrow(() -> new TagNotFoundException(request.getTag(), walletId));
        }

        Subscription sub = Subscription.builder()
                .wallet(wallet)
                .tag(tag)
                .name(request.getName())
                .amount(request.getAmount())
                .originalAmount(request.getOriginalAmount())
                .originalCurrency(request.getOriginalCurrency())
                .exchangeValue(request.getExchangeValue())
                .autoExchangeRate(request.isAutoExchangeRate())
                .type(Subscription.Type.valueOf(request.getType()))
                .notes(request.getNotes())
                .status(Subscription.Status.valueOf(request.getStatus() != null ? request.getStatus() : "ACTIVE"))
                .startDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now())
                .frequencyType(Subscription.Frequency.valueOf(request.getFrequencyType()))
                .frequencyInterval(request.getFrequencyInterval() > 0 ? request.getFrequencyInterval() : 1)
                .monthlySpecificDay(request.getMonthlySpecificDay())
                .lastWorkingDayOfMonth(request.isLastWorkingDayOfMonth())
                .duration(Subscription.Duration.valueOf(request.getDuration()))
                .durationTimes(request.getDurationTimes())
                .durationUntil(request.getDurationUntil())
                .executedTimes(0)
                .build();

        sub.setNextExecutionDate(calculateNextExecutionDate(sub, sub.getStartDate(), false));

        if (!sub.getNextExecutionDate().isAfter(LocalDate.now()))
            executeSubscription(sub);

        sub = subscriptionRepository.save(sub);
        return subscriptionMapper.mapToResponse(sub);


    }

    /**
     * Updates an existing subscription. If scheduling rules are modified,
     * the next execution date is recalculated.
     *
     * @param subscriptionId The UUID of the subscription to update
     * @param request        The updated data
     * @param walletId       The UUID of the wallet
     * @param userId         The UUID of the requesting user
     * @return The updated SubscriptionResponse
     */
    @Transactional
    @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
    public SubscriptionResponse updateSubscription(UUID subscriptionId, SubscriptionRequest request, UUID walletId, UUID userId) {
        Subscription sub = subscriptionRepository.findByIdAndWalletId(subscriptionId, walletId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found or does not belong to this wallet"));

        if (request.getName() != null) {
            if (request.getName().length() < 2 || request.getName().length() > 40)
                throw new IllegalArgumentException("The name must be between 3 and 40 characters long.");
            sub.setName(request.getName());
        }

        if (request.getAmount() != null && request.getAmount().compareTo(BigDecimal.ZERO) < 0)
            throw new IllegalArgumentException("The amount cannot be negative.");

        Tag tag = null;
        if (request.getTag() != null && !request.getTag().isBlank()) {
            tag = tagRepository.findByNameIgnoreCaseAndWalletId(request.getTag(), walletId)
                    .orElseThrow(() -> new TagNotFoundException(request.getTag(), walletId));
        }
        sub.setTag(tag);

        if (request.getAmount() != null) sub.setAmount(request.getAmount());
        if (request.getOriginalAmount() != null) sub.setOriginalAmount(request.getOriginalAmount());
        sub.setOriginalCurrency(request.getOriginalCurrency());
        if (request.getExchangeValue() != null) sub.setExchangeValue(request.getExchangeValue());
        sub.setAutoExchangeRate(request.isAutoExchangeRate());
        if (request.getType() != null) sub.setType(Subscription.Type.valueOf(request.getType()));
        sub.setNotes(request.getNotes());

        if (request.getStatus() != null) sub.setStatus(Subscription.Status.valueOf(request.getStatus()));

        // Flag to track if we need to recalculate the next execution date
        boolean recalculateDate = false;

        if (request.getStartDate() != null && !request.getStartDate().equals(sub.getStartDate())) {
            sub.setStartDate(request.getStartDate());
            recalculateDate = true;
        }
        if (request.getFrequencyType() != null && !request.getFrequencyType().equals(sub.getFrequencyType().name())) {
            sub.setFrequencyType(Subscription.Frequency.valueOf(request.getFrequencyType()));
            recalculateDate = true;
        }
        if (request.getFrequencyInterval() > 0 && request.getFrequencyInterval() != sub.getFrequencyInterval()) {
            sub.setFrequencyInterval(request.getFrequencyInterval());
            recalculateDate = true;
        }
        if (request.getMonthlySpecificDay() != sub.getMonthlySpecificDay() || request.isLastWorkingDayOfMonth() != sub.isLastWorkingDayOfMonth()) {
            sub.setMonthlySpecificDay(request.getMonthlySpecificDay());
            sub.setLastWorkingDayOfMonth(request.isLastWorkingDayOfMonth());
            recalculateDate = true;
        }

        // If any scheduling rule was changed, recalculate the next due date
        // Note: For stopping subscriptions, duration rules don't force recalculation from startDate
        if (recalculateDate) {
            sub.setNextExecutionDate(calculateNextExecutionDate(sub, sub.getStartDate(), true));
        }

        if (request.getDuration() != null) sub.setDuration(Subscription.Duration.valueOf(request.getDuration()));
        sub.setDurationTimes(request.getDurationTimes());
        sub.setDurationUntil(request.getDurationUntil());

        sub = subscriptionRepository.save(sub);
        return subscriptionMapper.mapToResponse(sub);
    }

    /**
     * Deletes a subscription.
     *
     * @param subscriptionId The UUID of the subscription to delete
     * @param walletId       The UUID of the wallet
     * @param userId         The UUID of the requesting user
     */
    @Transactional
    @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
    public void deleteSubscription(UUID subscriptionId, UUID walletId, UUID userId) {
        Subscription sub = subscriptionRepository.findByIdAndWalletId(subscriptionId, walletId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found or does not belong to this wallet"));
        subscriptionRepository.delete(sub);
    }

    // =========================================================================
    // MAPPER METHODS
    // =========================================================================


    // =========================================================================
    // EXECUTION ENGINE (CRON JOB LOGIC)
    // =========================================================================

    /**
     * Main entry point for the daily cron job.
     * Finds all active subscriptions that are due today or in the past,
     * and processes them by generating actual transactions.
     */
    @Transactional
    public void processDueSubscriptions() {
        LocalDate today = LocalDate.now();

        // Retrieve all active subscriptions that are due for execution
        List<Subscription> dueSubscriptions = subscriptionRepository
                .findAllByStatusAndNextExecutionDateLessThanEqual(Subscription.Status.ACTIVE, today);

        for (Subscription sub : dueSubscriptions)
            executeSubscription(sub);
    }

    /**
     * Executes a single subscription: creates the transaction, updates
     * history, calculates the next execution date, and checks for completion.
     *
     * @param sub The Subscription entity to execute
     */
    private void executeSubscription(Subscription sub) {
        String generatedNotes = "Recurrent " + sub.getName() + ", Transaction " + (sub.getExecutedTimes() + 1);
        if (sub.getDuration() == Subscription.Duration.TIMES && sub.getDurationTimes() != null) {
            generatedNotes += " / " + sub.getDurationTimes();
        }
        if (sub.getNotes() != null && !sub.getNotes().isBlank()) {
            generatedNotes += " - " + sub.getNotes();
        }

        // 1. Create the actual Transaction entity linked to the wallet
        Transaction transaction = Transaction.builder()
                .wallet(sub.getWallet())
                .subscription(sub)
                .tag(sub.getTag())
                .name(sub.getName())
                .amount(sub.getAmount())
                .originalAmount(sub.getOriginalAmount())
                .originalCurrency(sub.getOriginalCurrency())
                .exchangeValue(sub.getExchangeValue())
                .type(Transaction.Type.valueOf(sub.getType().name()))
                .notes(generatedNotes)
                .transactionDate(sub.getNextExecutionDate()) // Transaction date is when it was scheduled
                .build();

        transactionRepository.save(transaction);

        // 2. Update subscription tracking history
        sub.setLastExecutionDate(sub.getNextExecutionDate());
        sub.setExecutedTimes(sub.getExecutedTimes() + 1);

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
        while (lastDay.getDayOfWeek() == DayOfWeek.SATURDAY || lastDay.getDayOfWeek() == DayOfWeek.SUNDAY) {
            lastDay = lastDay.minusDays(1);
        }
        return lastDay;
    }

    /**
     * Core method to calculate the next execution date using a mathematical
     * fast-forward approach to avoid infinite loops, followed by a micro-adjustment.
     *
     * @param sub               The subscription entity
     * @param lastExecutionDate The reference date to jump from
     * @param avoidToday        Calculate the next day after today
     * @return The calculated next execution date
     */
    private LocalDate calculateNextExecutionDate(Subscription sub, LocalDate lastExecutionDate, boolean avoidToday) {
        LocalDate today = LocalDate.now();

        // 1. MATHEMATICAL FAST-FORWARD: Skip over large time gaps instantly
        LocalDate nextDate = applyFastForward(sub, lastExecutionDate, today);

        // 2. FINAL MICRO-ADJUSTMENT: Step forward interval by interval until the date is in the future
        // Note: nextDate is already close to 'today', so this loop runs 1-2 times max.

        while (nextDate.isBefore(today) || (avoidToday && nextDate.isEqual(today)))
            nextDate = advanceByOneInterval(sub, nextDate);

        return nextDate;
    }

    /**
     * Calculates a massive time jump based on intervals.
     * Useful when the subscription was created far in the past.
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

    /**
     * Advances a given date exactly by one recurrence interval.
     */
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

    /**
     * Enforces monthly edge-cases like specific dates (e.g., 31st) or "last working day".
     */
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

    /**
     * Evaluates if the subscription should be marked as COMPLETED based on its duration settings.
     */
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