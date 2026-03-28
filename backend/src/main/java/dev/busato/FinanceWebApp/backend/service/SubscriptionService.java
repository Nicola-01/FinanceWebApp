package dev.busato.FinanceWebApp.backend.service;

import dev.busato.FinanceWebApp.backend.dto.SubscriptionRequest;
import dev.busato.FinanceWebApp.backend.dto.SubscriptionResponse;
import dev.busato.FinanceWebApp.backend.dto.TagResponse;
import dev.busato.FinanceWebApp.backend.exceptions.TagNotFoundException;
import dev.busato.FinanceWebApp.backend.exceptions.WalletNotFoundException;
import dev.busato.FinanceWebApp.backend.model.*;
import dev.busato.FinanceWebApp.backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository; // Ricordati di creare questa interfaccia!
    private final WalletRepository walletRepository;
    private final TagRepository tagRepository;
    private final TransactionRepository transactionRepository;

    @PreAuthorize("@walletSecurity.hasReadAccess(#userId, #walletId)")
    public List<SubscriptionResponse> getSubscriptionsByWalletID(UUID walletId, UUID userId) {
        return subscriptionRepository.findAllByWalletId(walletId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

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

        // Calcola la primissima esecuzione in base alle regole
        sub.setNextExecutionDate(calculateFirstExecutionDate(sub));

        sub = subscriptionRepository.save(sub);
        return mapToResponse(sub);
    }

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

        if (request.getAmount().compareTo(BigDecimal.ZERO) < 0)
            throw new IllegalArgumentException("The amount cannot be negative.");

        Tag tag = null;
        if (request.getTag() != null && !request.getTag().isBlank()) {
            tag = tagRepository.findByNameIgnoreCaseAndWalletId(request.getTag(), walletId)
                    .orElseThrow(() -> new TagNotFoundException(request.getTag(), walletId));
        }
        sub.setTag(tag);

        sub.setAmount(request.getAmount());
        sub.setOriginalAmount(request.getOriginalAmount());
        sub.setOriginalCurrency(request.getOriginalCurrency());
        sub.setExchangeValue(request.getExchangeValue());
        sub.setType(Subscription.Type.valueOf(request.getType()));
        sub.setNotes(request.getNotes());

        if (request.getStatus() != null) sub.setStatus(Subscription.Status.valueOf(request.getStatus()));

        // Se cambiano le regole di schedulazione, aggiorniamo i dati e ricalcoliamo la prossima data
        boolean recalculateDate = false;

        if (request.getFrequencyType() != null) {
            sub.setFrequencyType(Subscription.Frequency.valueOf(request.getFrequencyType()));
            recalculateDate = true;
        }
        if (request.getFrequencyInterval() > 0) {
            sub.setFrequencyInterval(request.getFrequencyInterval());
            recalculateDate = true;
        }
        if (request.getMonthlySpecificDay() != null || request.isLastWorkingDayOfMonth() != sub.isLastWorkingDayOfMonth()) {
            sub.setMonthlySpecificDay(request.getMonthlySpecificDay());
            sub.setLastWorkingDayOfMonth(request.isLastWorkingDayOfMonth());
            recalculateDate = true;
        }

        if (recalculateDate) {
            sub.setNextExecutionDate(calculateFirstExecutionDate(sub));
        }

        if (request.getDuration() != null) sub.setDuration(Subscription.Duration.valueOf(request.getDuration()));
        sub.setDurationTimes(request.getDurationTimes());
        sub.setDurationUntil(request.getDurationUntil());

        return mapToResponse(sub);
    }

    @Transactional
    @PreAuthorize("@walletSecurity.hasWriteAccess(#userId, #walletId)")
    public void deleteSubscription(UUID subscriptionId, UUID walletId, UUID userId) {
        Subscription sub = subscriptionRepository.findByIdAndWalletId(subscriptionId, walletId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found or does not belong to this wallet"));
        subscriptionRepository.delete(sub);
    }

    // --- LOGICA DI CALCOLO DATE ---

    private LocalDate calculateFirstExecutionDate(Subscription sub) {
        LocalDate date = sub.getStartDate();

        if (sub.getFrequencyType() == Subscription.Frequency.MONTHLY) {
            if (sub.isLastWorkingDayOfMonth()) {
                LocalDate target = getLastWorkingDayOfMonth(date);
                // Se l'ultimo giorno lavorativo è già passato rispetto alla startDate, passa al mese dopo
                if (target.isBefore(date)) {
                    target = getLastWorkingDayOfMonth(date.plusMonths(1));
                }
                return target;
            } else if (sub.getMonthlySpecificDay() != null) {
                int maxDays = date.lengthOfMonth();
                int targetDay = Math.min(sub.getMonthlySpecificDay(), maxDays);
                LocalDate target = date.withDayOfMonth(targetDay);

                // Se il giorno specifico di questo mese è già passato, programma per il mese prossimo
                if (target.isBefore(date)) {
                    LocalDate nextMonth = date.plusMonths(1);
                    target = nextMonth.withDayOfMonth(Math.min(sub.getMonthlySpecificDay(), nextMonth.lengthOfMonth()));
                }
                return target;
            }
        }
        return date; // DAILY, WEEKLY, YEARLY partono esattamente dalla startDate
    }

    private LocalDate getLastWorkingDayOfMonth(LocalDate referenceDate) {
        LocalDate lastDay = referenceDate.withDayOfMonth(referenceDate.lengthOfMonth());
        while (lastDay.getDayOfWeek() == DayOfWeek.SATURDAY || lastDay.getDayOfWeek() == DayOfWeek.SUNDAY) {
            lastDay = lastDay.minusDays(1);
        }
        return lastDay;
    }

    // --- MAPPATURA ---

    private SubscriptionResponse mapToResponse(Subscription sub) {
        TagResponse tagResp = null;
        if (sub.getTag() != null) {
            tagResp = TagResponse.builder()
                    .name(sub.getTag().getName())
                    .icon(sub.getTag().getIcon())
                    .colorHex(sub.getTag().getColorHex())
                    .parentName(Optional.ofNullable(sub.getTag().getParent()).map(Tag::getName).orElse(null))
                    .build();
        }

        return SubscriptionResponse.builder()
                .id(sub.getId())
                .name(sub.getName())
                .tag(tagResp)
                .amount(sub.getAmount())
                .originalAmount(sub.getOriginalAmount())
                .originalCurrency(sub.getOriginalCurrency())
                .exchangeValue(sub.getExchangeValue())
                .autoExchangeRate(sub.isAutoExchangeRate())
                .type(sub.getType().toString())
                .notes(sub.getNotes())
                .status(sub.getStatus().toString())
                .startDate(sub.getStartDate())
                .nextExecutionDate(sub.getNextExecutionDate())
                .lastExecutionDate(sub.getLastExecutionDate())
                .frequencyType(sub.getFrequencyType().toString())
                .frequencyInterval(sub.getFrequencyInterval())
                .monthlySpecificDay(sub.getMonthlySpecificDay())
                .lastWorkingDayOfMonth(sub.isLastWorkingDayOfMonth())
                .duration(sub.getDuration().toString())
                .durationTimes(sub.getDurationTimes())
                .executedTimes(sub.getExecutedTimes())
                .durationUntil(sub.getDurationUntil())
                .build();
    }

    // --- MOTORE DI ESECUZIONE (DA CHIAMARE TRAMITE CRON JOB) ---

    @Transactional
    public void processDueSubscriptions() {
        LocalDate today = LocalDate.now();

        // Recupera tutte le subscription attive che devono essere eseguite oggi (o che sono rimaste indietro)
        List<Subscription> dueSubscriptions = subscriptionRepository
                .findAllByStatusAndNextExecutionDateLessThanEqual(Subscription.Status.ACTIVE, today);

        for (Subscription sub : dueSubscriptions) {
            executeSubscription(sub);
        }
    }

    private void executeSubscription(Subscription sub) {
        // 1. Crea la Transazione reale nel wallet
        Transaction transaction = Transaction.builder()
                .wallet(sub.getWallet())
                .tag(sub.getTag())
                .name(sub.getName())
                .amount(sub.getAmount())
                .originalAmount(sub.getOriginalAmount())
                .originalCurrency(sub.getOriginalCurrency())
                .exchangeValue(sub.getExchangeValue())
                .type(Transaction.Type.valueOf(sub.getType().name()))
                .notes("Recurrent: " + sub.getName() + (sub.getNotes() != null ? " - " + sub.getNotes() : ""))
                .transactionDate(sub.getNextExecutionDate()) // La data di transazione è il giorno in cui DOVEVA essere eseguita
                .build();

        transactionRepository.save(transaction);

        // 2. Aggiorna lo storico e il contatore dell'abbonamento
        sub.setLastExecutionDate(sub.getNextExecutionDate());
        sub.setExecutedTimes(sub.getExecutedTimes() + 1);

        // 3. Calcola la prossima data
        LocalDate nextDate = calculateNextExecutionDate(sub, sub.getNextExecutionDate());
        sub.setNextExecutionDate(nextDate);

        // 4. Verifica se l'abbonamento è terminato
        checkCompletion(sub);

        // Salva le modifiche all'abbonamento
        subscriptionRepository.save(sub);
    }

    // --- LOGICA DI CALCOLO DATE E TERMINE ---

    private LocalDate calculateNextExecutionDate(Subscription sub, LocalDate currentExecutionDate) {
        LocalDate nextDate = currentExecutionDate;
        int interval = sub.getFrequencyInterval();

        switch (sub.getFrequencyType()) {
            case DAILY:
                nextDate = nextDate.plusDays(interval);
                break;
            case WEEKLY:
                nextDate = nextDate.plusWeeks(interval);
                break;
            case MONTHLY:
                nextDate = nextDate.plusMonths(interval);
                // Riapplica le regole mensili per il nuovo mese
                if (sub.isLastWorkingDayOfMonth()) {
                    nextDate = getLastWorkingDayOfMonth(nextDate);
                } else if (sub.getMonthlySpecificDay() != null) {
                    int maxDays = nextDate.lengthOfMonth();
                    int targetDay = Math.min(sub.getMonthlySpecificDay(), maxDays);
                    nextDate = nextDate.withDayOfMonth(targetDay);
                }
                break;
            case YEARLY:
                nextDate = nextDate.plusYears(interval);
                break;
        }
        return nextDate;
    }

    private void checkCompletion(Subscription sub) {
        // Se la durata era basata su un numero di volte, e le abbiamo raggiunte:
        if (sub.getDuration() == Subscription.Duration.TIMES && sub.getDurationTimes() != null) {
            if (sub.getExecutedTimes() >= sub.getDurationTimes()) {
                sub.setStatus(Subscription.Status.COMPLETED);
            }
        }

        // Se la durata era fino a una certa data, e la PROSSIMA esecuzione supererebbe quella data:
        if (sub.getDuration() == Subscription.Duration.UNTIL && sub.getDurationUntil() != null) {
            if (sub.getNextExecutionDate().isAfter(sub.getDurationUntil())) {
                sub.setStatus(Subscription.Status.COMPLETED);
            }
        }
    }
}