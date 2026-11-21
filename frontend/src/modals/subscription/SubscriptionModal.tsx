import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faCalendarDays,
  faChevronDown,
  faHashtag,
  faStickyNote,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import * as walletOps from "../../api/walletOps";
import Button from "../../components/ui/Button.tsx";
import Toggle from "../../components/ui/Toggle.tsx";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import type { CurrencyCode } from "../../utils/currencies";
import type { BankRule, Tag, Wallet, Subscription } from "../../types/domain";

// Sub-components reused from the transaction modal.
import CustomDatePicker from "../../components/datePicker/CustomDatePicker";
import { ResponsiveOverlay } from "../../components/ui/ResponsiveOverlay.tsx";
import { Input } from "../../components/ui/Input.tsx";
import { Textarea } from "../../components/ui/Textarea";
import { AmountInput } from "../../components/ui/AmountInput.tsx";
import { TransactionTypeToggle } from "../../components/ui/TransactionTypeToggle";
import { TagPicker } from "../transaction/TagPicker";
import { ExchangeRateSection } from "../common/exchangeRate/ExchangeRateSection";
import {
  SchedulingRules,
  SubscriptionStatusRow,
} from "../common/SchedulingRules";
import { MonthlyRuleNext } from "../common/MonthlyRulePicker";
import { getApiErrorTitle } from "../../utils/apiError";
import { listBankRules } from "../../api/bankApi";
import { useWalletBank } from "../../dashboard/settings/bank/useWalletBank";
import { BankMatchSection } from "./BankMatchSection";
import { parseLocalIsoDate } from "../../utils/localDate";
import { FieldLabel } from "../../components/ui/FieldLabel";
import { FormRow } from "../../components/ui/FormRow";
import { useUiVersion } from "../../hooks/useUiVersion";
import { useAmountEntryForm } from "../common/useAmountEntryForm";
import {
  buildBankMatchPayload,
  buildSchedulePayload,
  type BankMatchFields,
} from "./subscriptionPayload";
import {
  EMPTY_MONTHLY_RULE,
  monthlyRuleFromSub,
  type MonthlyRule,
} from "../../utils/monthlyRule";

const EMPTY_BANK_MATCH: BankMatchFields = { ruleId: null };

export interface SubscriptionModalHandle {
  openModal: (sub?: Subscription, initialDate?: Date) => void;
}

interface Props {
  wallet: Wallet;
  tags: Tag[];
  baseCurrency: CurrencyCode;
  onSuccess: () => void;
}

export const SubscriptionModal = forwardRef<SubscriptionModalHandle, Props>(
  ({ wallet, tags, baseCurrency, onSuccess }, ref) => {
    const [open, setOpen] = useState(false);

    // --- General data state ---
    const [editingSubId, setEditingSubId] = useState<string | null>(null);
    // Full row kept while editing so we can read its updatedAt (offline
    // precondition for the queued update op).
    const [editingSub, setEditingSub] = useState<Subscription | null>(null);
    const form = useAmountEntryForm(baseCurrency);
    const { type, setType, name, setName, notes, setNotes } = form;
    const { selectedTagName, setSelectedTagName } = form;
    // Reminder mode: no fixed amount — the user fills it in each occurrence.
    const [amountPending, setAmountPending] = useState(false);
    const [startDate, setStartDate] = useState<Date>(new Date());
    // Foreign-currency rate mode: true = use each day's live rate at execution.
    const [autoExchangeRate, setAutoExchangeRate] = useState(true);

    // --- Scheduling & duration state (subscription-specific) ---
    const [frequencyInterval, setFrequencyInterval] = useState<number>(1);
    const [frequencyType, setFrequencyType] = useState<
      "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
    >("MONTHLY");
    const [duration, setDuration] = useState<"FOREVER" | "TIMES" | "UNTIL">(
      "FOREVER",
    );
    const [durationTimes, setDurationTimes] = useState<number>(1);
    const [durationUntil, setDurationUntil] = useState<Date | null>(null);
    const [status, setStatus] = useState<"ACTIVE" | "PAUSED" | "COMPLETED">(
      "ACTIVE",
    );
    const [monthlyRule, setMonthlyRule] =
      useState<MonthlyRule>(EMPTY_MONTHLY_RULE);

    const [bankMatch, setBankMatch] =
      useState<BankMatchFields>(EMPTY_BANK_MATCH);
    const [bankRules, setBankRules] = useState<BankRule[]>([]);
    const bank = useWalletBank(wallet.id);
    const { reload: reloadBank, enabled: bankEnabledState } = bank;
    // The Open Banking row only shows when the wallet has a linked account.
    const bankLinked = bank.enabled === true && bank.connections.length > 0;

    // Refresh the link state each time the form opens.
    useEffect(() => {
      if (open) reloadBank();
    }, [open, reloadBank]);

    // Rules are only needed once Open Banking is enabled for the wallet.
    useEffect(() => {
      if (!open || !bankEnabledState) return;
      let alive = true;
      // A failed rules fetch just leaves the selector with "None".
      listBankRules(wallet.id)
        .catch(() => [] as BankRule[])
        .then((rules) => {
          if (alive) setBankRules(rules);
        });
      return () => {
        alive = false;
      };
    }, [open, bankEnabledState, wallet.id]);

    const [loading, setLoading] = useState(false);
    const [resetKey, setResetKey] = useState(0);

    useImperativeHandle(ref, () => ({
      openModal: (sub?: Subscription, initialDate?: Date) => {
        setResetKey((prev) => prev + 1);

        if (sub) {
          // --- EDIT MODE ---
          setEditingSubId(sub.id);
          setEditingSub(sub);
          form.reset(sub);
          setAmountPending(sub.amountPending ?? false);
          setStartDate(parseLocalIsoDate(sub.startDate));
          setAutoExchangeRate(sub.autoExchangeRate ?? true);

          // Subscription-specific fields
          setFrequencyInterval(sub.frequencyInterval || 1);
          setFrequencyType(sub.frequencyType || "MONTHLY");
          setDuration(sub.duration || "FOREVER");
          setDurationTimes(sub.durationTimes || 1);
          setDurationUntil(
            sub.durationUntil ? parseLocalIsoDate(sub.durationUntil) : null,
          );
          setStatus(sub.status || "ACTIVE");
          setMonthlyRule(
            monthlyRuleFromSub(sub, parseLocalIsoDate(sub.startDate)),
          );
          setBankMatch({ ruleId: sub.bankRuleId ?? null });
        } else {
          // --- CREATE MODE ---
          setEditingSubId(null);
          setEditingSub(null);
          // Open neutral (no type preselected) — matches New Transaction; the
          // type is set as soon as the user enters an amount (sign-driven).
          form.reset();
          setAmountPending(false);
          setStartDate(initialDate || new Date());
          setAutoExchangeRate(true);

          // Reset subscription-specific fields
          setFrequencyInterval(1);
          setFrequencyType("MONTHLY");
          setDuration("FOREVER");
          setDurationTimes(1);
          setDurationUntil(null);
          setStatus("ACTIVE");
          setMonthlyRule(EMPTY_MONTHLY_RULE);
          setBankMatch(EMPTY_BANK_MATCH);
        }
        setOpen(true);
      },
    }));

    const handleSave = async () => {
      if (!amountPending && !form.hasAmount)
        return triggerToast("Please enter a valid amount.", false);
      if (!selectedTagName)
        return triggerToast("Please select a category.", false);
      if (!type) return triggerToast("Please select income or expense.", false);

      setLoading(true);
      try {
        // Payload mapped to SubscriptionRequest.java
        const payload = {
          ...form.buildBasePayload(amountPending),
          amountPending,
          autoExchangeRate,
          ...buildSchedulePayload({
            status,
            startDate,
            frequencyType,
            frequencyInterval,
            duration,
            durationTimes,
            durationUntil,
            monthlyRule,
          }),
          ...buildBankMatchPayload(bankMatch),
        };

        if (editingSubId) {
          await walletOps.updateSubscription(
            wallet.id,
            editingSubId,
            payload,
            editingSub?.updatedAt ?? null,
          );
          triggerToast("Subscription updated successfully!", true);
        } else {
          await walletOps.createSubscription(wallet.id, payload);
          triggerToast("Subscription created successfully!", true);
        }

        onSuccess();
        setOpen(false);
      } catch (err: unknown) {
        const actionText = editingSubId ? "updating" : "creating";
        triggerToast(
          getApiErrorTitle(err, `Error ${actionText} subscription`),
          false,
        );
      } finally {
        setLoading(false);
      }
    };

    const canSave =
      (amountPending || form.hasAmount) &&
      selectedTagName !== "" &&
      type !== "";
    const isEditing = !!editingSubId;
    const [ui] = useUiVersion();
    const isV2 = ui === "v2"; // ui-v2-switch
    // Edit mode keeps an existing bank rule visible so it can be cleared.
    const showBank = bankLinked || (isEditing && !!bankMatch.ruleId);
    const hasForeignCurrency =
      form.exchangeRateProps.selectedCurrency !== baseCurrency;

    // Reload the rules after the manager closes; drop a rule deleted there.
    const handleRulesChanged = () =>
      listBankRules(wallet.id)
        .then((rules) => {
          setBankRules(rules);
          setBankMatch((m) =>
            rules.some((r) => r.id === m.ruleId) ? m : { ruleId: null },
          );
        })
        .catch(() => {});

    // Primary save control lives in the sticky footer.
    const footer = (
      <Button
        type="button"
        onClick={handleSave}
        disabled={!canSave || loading}
        accentColor={wallet.color}
        ripple
        fullWidth
        size="lg"
        aria-label="Save subscription"
      >
        {loading ? "Saving…" : isEditing ? "Save changes" : "Add subscription"}
      </Button>
    );

    return (
      <ResponsiveOverlay
        open={open}
        onClose={() => setOpen(false)}
        title={isEditing ? "Edit Subscription" : "New Subscription"}
        accentColor={wallet.color}
        footer={footer}
      >
        <div
          id="subscription-form"
          key={resetKey}
          className="text-left flex flex-col gap-6"
        >
          {/* 1. AMOUNT AREA */}
          <div className="flex flex-col items-center justify-center py-2">
            {!amountPending && (
              <AmountInput
                value={form.amount}
                type={type}
                setType={setType}
                currencySymbol={form.currencySymbol}
                autoFocus={!isEditing}
                onAmountChange={form.handleAmountChange}
              />
            )}
            <TransactionTypeToggle type={type} setType={setType} />
            {!isV2 && (
              <Toggle
                checked={amountPending}
                onChange={setAmountPending}
                accentColor={wallet.color}
                size="sm"
                className="mt-3"
                label="Reminder — no fixed amount, fill it in each time"
                aria-label="Reminder subscription (no fixed amount)"
              />
            )}
          </div>

          {isV2 ? ( // ui-v2-switch
            <>
              {/* 2. CATEGORY & NAME */}
              <div className="divide-y divide-app-border rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)]">
                <FormRow icon={faHashtag} label="Category" required>
                  <TagPicker
                    tags={tags}
                    selectedTagName={selectedTagName}
                    onSelectTag={setSelectedTagName}
                    showLabel={false}
                    triggerClassName="bg-transparent shadow-none justify-end text-right px-0"
                    triggerAlign="right"
                  />
                </FormRow>

                {/* The Input wrapper keeps its raised fill; flatten it so the row reads as plain text. */}
                <FormRow
                  icon={faTag}
                  label="Name"
                  controlClassName="[&>div]:w-full [&>div]:bg-transparent [&>div]:shadow-none"
                >
                  <Input
                    type="text"
                    aria-label="Name"
                    placeholder="Optional"
                    // v2 tabular-nums would pull the mono font in; keep the text sans.
                    className="bg-transparent text-right shadow-none px-0 !font-sans"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </FormRow>
              </div>

              {/* 3. SCHEDULE */}
              <div className="flex flex-col">
                <h3 className="mb-2 px-1 text-[13px] text-app-muted">
                  Schedule
                </h3>
                <div className="divide-y divide-app-border rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)]">
                  <FormRow icon={faCalendarDays} label="Start date">
                    <CustomDatePicker
                      isRange={false}
                      color={wallet.color}
                      initialPreset="custom"
                      initialStartDate={startDate}
                      onChange={(val) => {
                        if (val instanceof Date) setStartDate(val);
                      }}
                      triggerClassName="bg-transparent shadow-none justify-end px-0"
                      triggerAlign="right"
                      dropdownAlign="right"
                    />
                  </FormRow>

                  <SchedulingRules
                    variant="rows"
                    frequencyInterval={frequencyInterval}
                    onFrequencyIntervalChange={setFrequencyInterval}
                    frequencyType={frequencyType}
                    onFrequencyTypeChange={setFrequencyType}
                    duration={duration}
                    onDurationChange={setDuration}
                    durationTimes={durationTimes}
                    onDurationTimesChange={setDurationTimes}
                    durationUntil={durationUntil}
                    onDurationUntilChange={setDurationUntil}
                    showStatus={false}
                    accentColor={wallet.color}
                    monthlyRule={monthlyRule}
                    onMonthlyRuleChange={setMonthlyRule}
                    startDate={startDate}
                  />
                </div>
                {frequencyType === "MONTHLY" && (
                  <MonthlyRuleNext
                    rule={monthlyRule}
                    startDate={startDate}
                    frequencyInterval={frequencyInterval}
                  />
                )}
              </div>

              {/* 4. OPTIONS */}
              <div className="flex flex-col">
                <h3 className="mb-2 px-1 text-[13px] text-app-muted">
                  Options
                </h3>
                <div className="divide-y divide-app-border rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)]">
                  <FormRow
                    icon={faBell}
                    label="Reminder"
                    sub="no fixed amount, fill it in each time"
                  >
                    <Toggle
                      checked={amountPending}
                      onChange={setAmountPending}
                      accentColor={wallet.color}
                      size="sm"
                      aria-label="Reminder subscription (no fixed amount)"
                    />
                  </FormRow>
                  <SubscriptionStatusRow
                    status={status}
                    onStatusChange={setStatus}
                    accentColor={wallet.color}
                  />
                </div>
              </div>

              {/* 5. OPEN BANKING (only when a bank rule applies) */}
              {showBank && (
                <div className="flex flex-col">
                  <h3 className="mb-2 px-1 text-[13px] text-app-muted">
                    Open Banking
                  </h3>
                  <div className="divide-y divide-app-border rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)]">
                    <BankMatchSection
                      variant="rows"
                      value={bankMatch}
                      onChange={setBankMatch}
                      rules={bankRules}
                      onRulesChanged={handleRulesChanged}
                      accentColor={wallet.color}
                    />
                  </div>
                </div>
              )}

              {/* 6. MORE DETAILS: notes, other currency */}
              <details
                className="group -mt-3"
                open={isEditing && (!!notes || hasForeignCurrency)}
              >
                <summary className="flex cursor-pointer list-none items-center gap-2 py-3 text-sm text-app-muted">
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="transition-transform group-open:rotate-180"
                  />
                  <span className="whitespace-nowrap shrink-0">
                    More details
                  </span>
                  <span className="min-w-0 truncate text-app-faint">
                    notes, currency
                  </span>
                </summary>
                <div className="flex flex-col gap-6 pt-2">
                  <div>
                    <FieldLabel>
                      <FontAwesomeIcon icon={faStickyNote} className="mr-2" />
                      Description
                    </FieldLabel>
                    <Textarea
                      className="min-h-[100px]"
                      placeholder="Any details... (Optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      accentColor={wallet.color}
                    />
                  </div>
                  <ExchangeRateSection
                    mode={isEditing ? "edit" : "create"}
                    accentColor={wallet.color}
                    walletId={wallet.id}
                    autoExchangeRate={autoExchangeRate}
                    onAutoExchangeRateChange={setAutoExchangeRate}
                    {...form.exchangeRateProps}
                  />
                </div>
              </details>
            </>
          ) : (
            <>
              {/* 2. TAGS & START DATE */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <TagPicker
                    tags={tags}
                    selectedTagName={selectedTagName}
                    onSelectTag={setSelectedTagName}
                  />
                </div>
                <div>
                  <FieldLabel>Start Date</FieldLabel>
                  <CustomDatePicker
                    isRange={false}
                    color={wallet.color}
                    initialPreset="custom"
                    initialStartDate={startDate}
                    onChange={(val) => {
                      if (val instanceof Date) setStartDate(val);
                    }}
                  />
                </div>
              </div>

              {/* 3. SCHEDULING RULES (frequency & duration) */}
              <SchedulingRules
                frequencyInterval={frequencyInterval}
                onFrequencyIntervalChange={setFrequencyInterval}
                frequencyType={frequencyType}
                onFrequencyTypeChange={setFrequencyType}
                duration={duration}
                onDurationChange={setDuration}
                durationTimes={durationTimes}
                onDurationTimesChange={setDurationTimes}
                durationUntil={durationUntil}
                onDurationUntilChange={setDurationUntil}
                showStatus
                status={status}
                onStatusChange={setStatus}
                accentColor={wallet.color}
                monthlyRule={monthlyRule}
                onMonthlyRuleChange={setMonthlyRule}
                startDate={startDate}
              />

              {showBank && (
                <BankMatchSection
                  value={bankMatch}
                  onChange={setBankMatch}
                  rules={bankRules}
                  onRulesChanged={handleRulesChanged}
                  accentColor={wallet.color}
                />
              )}

              {/* 4. NAME & DESCRIPTION */}
              <div className="flex flex-col gap-4">
                <div>
                  <FieldLabel>Name</FieldLabel>
                  <Input
                    type="text"
                    placeholder="Name of the subscription (Optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <FieldLabel>Description</FieldLabel>
                  <Textarea
                    placeholder="Any details... (Optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    accentColor={wallet.color}
                  />
                </div>
              </div>

              <hr className="my-2 border-app-border" />

              {/* 5. EXCHANGE RATE */}
              <ExchangeRateSection
                mode={isEditing ? "edit" : "create"}
                accentColor={wallet.color}
                walletId={wallet.id}
                autoExchangeRate={autoExchangeRate}
                onAutoExchangeRateChange={setAutoExchangeRate}
                {...form.exchangeRateProps}
              />
            </>
          )}
        </div>
      </ResponsiveOverlay>
    );
  },
);
