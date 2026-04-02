import { 
    addDays, addWeeks, addMonths, addYears, 
    isBefore, isAfter, isSameDay, 
    lastDayOfMonth, isWeekend, subDays, 
    getDaysInMonth, setDate, parseISO, differenceInDays, differenceInMonths, differenceInYears
} from 'date-fns';
import type { Subscription } from './types';

// OOttiene l'ultimo giorno lavorativo del mese
export const getLastWorkingDayOfMonth = (date: Date): Date => {
    let lastDay = lastDayOfMonth(date);
    while (isWeekend(lastDay)) {
        lastDay = subDays(lastDay, 1);
    }
    return lastDay;
};

// Applica le regole mensili (es. ultimo giorno lavorativo, giorno specifico)
export const applyMonthlyRules = (sub: Subscription, date: Date): Date => {
    if (sub.frequencyType !== 'MONTHLY') return date;

    if (sub.lastWorkingDayOfMonth) {
        return getLastWorkingDayOfMonth(date);
    }

    if (sub.monthlySpecificDay) {
        const maxDays = getDaysInMonth(date);
        const targetDay = Math.min(sub.monthlySpecificDay, maxDays);
        return setDate(date, targetDay);
    }

    return date;
};

// Avanza di un singolo intervallo in base alla frequenza
export const advanceByOneInterval = (sub: Subscription, currentDate: Date): Date => {
    const interval = sub.frequencyInterval && sub.frequencyInterval > 0 ? sub.frequencyInterval : 1;
    let nextDate = currentDate;

    switch (sub.frequencyType) {
        case 'DAILY':
            return addDays(nextDate, interval);
        case 'WEEKLY':
            return addWeeks(nextDate, interval);
        case 'MONTHLY':
            nextDate = addMonths(nextDate, interval);
            return applyMonthlyRules(sub, nextDate);
        case 'YEARLY':
            return addYears(nextDate, interval);
        default:
            return nextDate;
    }
};

/**
 * Calcola le date in cui una subscription avrà luogo.
 * Limita il calcolo agli anni richiesti [targetStartYear, targetEndYear].
 */
export const generateSubscriptionOccurrences = (
    sub: Subscription, 
    targetStartYear: number, 
    targetEndYear: number
): Date[] => {
    const startStr = sub.startDate || sub.nextExecutionDate;
    if (!startStr) return [];
    
    let currentDate = parseISO(startStr);
    
    // Al primo passaggio, applica subito le regole mensili se necessario
    if (sub.frequencyType === 'MONTHLY') {
        currentDate = applyMonthlyRules(sub, currentDate);
    }

    const occurrences: Date[] = [];
    
    // Bounds di generazione
    const minDate = new Date(targetStartYear, 0, 1); 
    const maxDate = new Date(targetEndYear, 11, 31, 23, 59, 59, 999); 
    
    const untilDate = sub.duration === 'UNTIL' && sub.durationUntil 
        ? parseISO(sub.durationUntil) 
        : null;

    const maxTimes = sub.duration === 'TIMES' && sub.durationTimes 
        ? sub.durationTimes 
        : Infinity;

    let executedCount = 0;
    
    // Prevenzione loop infiniti nel caso di configurazioni errate
    let loopGuard = 0;
    const maxLoopsLeft = 50000;

    // Fast-Forward Optimization per saltare anni di esecuzioni (se siamo distanti anni e non ci sono limitazioni TIMES stringenti)
    if (sub.frequencyType === 'DAILY' && maxTimes === Infinity && differenceInDays(minDate, currentDate) > 100) {
        let jumps = Math.floor(differenceInDays(minDate, currentDate) / (sub.frequencyInterval || 1));
        if (jumps > 0) {
            currentDate = addDays(currentDate, jumps * (sub.frequencyInterval || 1));
            executedCount += jumps;
        }
    } else if (sub.frequencyType === 'WEEKLY' && maxTimes === Infinity && differenceInDays(minDate, currentDate) > 70) {
        let jumps = Math.floor(differenceInDays(minDate, currentDate) / (7 * (sub.frequencyInterval || 1)));
        if (jumps > 0) {
             currentDate = addWeeks(currentDate, jumps * (sub.frequencyInterval || 1));
             executedCount += jumps;
        }
    } else if (sub.frequencyType === 'MONTHLY' && maxTimes === Infinity && differenceInMonths(minDate, currentDate) > 12) {
        let jumps = Math.floor(differenceInMonths(minDate, currentDate) / (sub.frequencyInterval || 1));
        if (jumps > 0) {
             currentDate = addMonths(currentDate, jumps * (sub.frequencyInterval || 1));
             currentDate = applyMonthlyRules(sub, currentDate);
             executedCount += jumps;
        }
    } else if (sub.frequencyType === 'YEARLY' && maxTimes === Infinity && differenceInYears(minDate, currentDate) > 1) {
        let jumps = Math.floor(differenceInYears(minDate, currentDate) / (sub.frequencyInterval || 1));
        if (jumps > 0) {
             currentDate = addYears(currentDate, jumps * (sub.frequencyInterval || 1));
             executedCount += jumps;
        }
    }

    while (loopGuard++ < maxLoopsLeft) {
        // Se si supera l'ultima data desiderata, fermati
        if (isAfter(currentDate, maxDate)) {
            break;
        }

        // Se si supera la data di fine definita (UNTIL), fermati
        if (untilDate && isAfter(currentDate, untilDate)) {
            break;
        }
        
        // Se rientra nel range target, aggiungila
        if (!isBefore(currentDate, minDate)) {
            occurrences.push(currentDate);
        }

        executedCount++;

        // Se si supera il limite di esecuzioni (TIMES), fermati
        if (executedCount >= maxTimes) {
            break;
        }

        const nextDate = advanceByOneInterval(sub, currentDate);
        // Previene blocco browser se la data non incrementa 
        if (isSameDay(currentDate, nextDate)) {
            break;
        }
        currentDate = nextDate;
    }
    
    return occurrences;
};
