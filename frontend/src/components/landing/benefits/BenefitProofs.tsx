import type { ReactNode } from "react";
import { CategoryIcon } from "../../ui/CategoryIcon.tsx";
import { ProgressBar } from "../../ui/ProgressBar.tsx";
import { RoleSelector } from "../../ui/RoleSelector.tsx";
import { StatTile } from "../../ui/StatTile.tsx";
import { StatusPill } from "../../ui/StatusPill.tsx";
import { SubscriptionRowV2 } from "../../../dashboard/subscription/SubscriptionRowV2.tsx";
import { TransactionRowV2 } from "../../../dashboard/transaction/TransactionRowV2.tsx";
import {
  DEMO_CHAT,
  DEMO_MATCHED_TRANSACTION,
  DEMO_MEMBERS,
  DEMO_SPEND_SPLIT,
  DEMO_SUBSCRIPTIONS,
  TAG_GROCERIES,
} from "./benefitsData.ts";

// Proof fragments are static previews: `inert` keeps the real (interactive) rows
// out of the tab order and the pointer, since nothing here is wired to a wallet.

const noop = () => {};

export function BenefitProof({ children }: { children: ReactNode }) {
  return (
    <div
      inert
      className="flex flex-col gap-3 rounded-[var(--r-input)] bg-app-bg p-4 shadow-[var(--box-ring)]"
    >
      {children}
    </div>
  );
}

/** Neutral pill for plain labels (the status pills cover ok / warn). */
export function NeutralPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center justify-self-start rounded-full bg-app-raised px-2.5 py-0.5 text-[13px] font-semibold whitespace-nowrap text-app-muted">
      {children}
    </span>
  );
}

const ROW_TITLE = "flex items-baseline justify-between gap-3 text-[15px]";

export function SpendingProof() {
  return (
    <BenefitProof>
      <div className={ROW_TITLE}>
        <span className="font-semibold">March spending</span>
        <span className="tabular-nums">€1,300</span>
      </div>
      <div className="flex h-3.5 gap-0.5 overflow-hidden rounded-[5px]">
        {DEMO_SPEND_SPLIT.map((s) => (
          <span
            key={s.label}
            style={{ flex: s.share, backgroundColor: s.color }}
          />
        ))}
      </div>
      {DEMO_SPEND_SPLIT.slice(0, 2).map((s) => (
        <div
          key={s.label}
          className="flex items-center justify-between gap-3 text-[14px]"
        >
          <span className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.label}
          </span>
          <span className="tabular-nums">
            {s.amount} · {s.share}%
          </span>
        </div>
      ))}
      <div>
        <StatusPill status="warn">Eating out up €38 on February</StatusPill>
      </div>
    </BenefitProof>
  );
}

export function SubscriptionsProof() {
  return (
    <BenefitProof>
      <div className={ROW_TITLE}>
        <span className="font-semibold">Coming up</span>
        <span className="text-[13px] text-app-faint">next 10 days</span>
      </div>
      <div className="-mx-4 flex flex-col">
        {DEMO_SUBSCRIPTIONS.map((sub) => (
          <SubscriptionRowV2
            key={sub.id}
            subscription={sub}
            date={sub.nextExecutionDate}
          />
        ))}
      </div>
      <p className="text-[13px] text-app-faint">
        Reminder sent 3 days before each payment.
      </p>
    </BenefitProof>
  );
}

export function BudgetProof() {
  return (
    <BenefitProof>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2.5 font-semibold">
          <CategoryIcon
            icon={TAG_GROCERIES.icon}
            color={TAG_GROCERIES.colorHex}
            size="sm"
          />
          Groceries
        </span>
        <span className="text-[15px] tabular-nums">€320 of €400</span>
      </div>
      <ProgressBar
        value={0.8}
        status="warn"
        label="Groceries budget: €320 of €400"
      />
      <div>
        <StatusPill status="warn">€80 left, close to the limit</StatusPill>
      </div>
    </BenefitProof>
  );
}

export function InvestmentsProof() {
  return (
    <BenefitProof>
      <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-3">
        <StatTile label="Spent" value="€1,300" sub="Income − spent" />
        <StatTile
          label="Invested, net"
          value="€400"
          sub="Bought − cashed out"
        />
        <StatTile
          label="Liquidity left"
          value="€870"
          sub="Cash you can still use"
        />
      </div>
      <div>
        <NeutralPill>Investing counts as saving</NeutralPill>
      </div>
    </BenefitProof>
  );
}

export function SharingProof() {
  return (
    <BenefitProof>
      {DEMO_MEMBERS.map((m) => (
        <div key={m.name} className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-app-raised font-semibold">
            {m.initial}
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{m.name}</div>
            <div className="text-[13px] text-app-muted">{m.meta}</div>
          </div>
          {m.role === "Owner" ? (
            <NeutralPill>Owner</NeutralPill>
          ) : (
            <RoleSelector value={m.role} onChange={noop} size="sm" />
          )}
        </div>
      ))}
    </BenefitProof>
  );
}

export function BankProof() {
  return (
    <BenefitProof>
      <div className={ROW_TITLE}>
        <span className="font-semibold">Imported from your bank</span>
        <NeutralPill>Preview</NeutralPill>
      </div>
      {/* Mirrors TransactionRowV2's to-categorise look without its picker (needs WalletContext). */}
      <div className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-x-3 rounded-[var(--r-input)] px-3 py-2.5 shadow-[inset_3px_0_0_var(--color-app-warn-fill)]">
        <span className="grid h-10 w-10 place-items-center rounded-[11px] bg-app-raised text-app-muted">
          <CategoryIcon icon="bank" color="#a78bfa" size="sm" />
        </span>
        <div className="min-w-0">
          <div className="truncate font-semibold">UNIPOLTECH SPA</div>
          <div className="text-[13px] text-app-muted">
            Imported 12 Mar · To categorise
          </div>
        </div>
        <div className="font-semibold whitespace-nowrap tabular-nums">
          −€4.40
        </div>
      </div>
      <TransactionRowV2
        transaction={DEMO_MATCHED_TRANSACTION}
        onClick={noop}
        isFirst={false}
        isLast={false}
      />
    </BenefitProof>
  );
}

export function ChatProof() {
  return (
    <BenefitProof>
      <div className="ml-6 rounded-[var(--r-input)] bg-app-raised px-3.5 py-2.5 text-[15px] leading-normal">
        {DEMO_CHAT.question}
      </div>
      <div className="mr-6 rounded-[var(--r-input)] bg-app-card px-3.5 py-2.5 text-[15px] leading-normal shadow-[var(--box-ring)]">
        <span className="font-semibold tabular-nums">
          {DEMO_CHAT.answer.amount}
        </span>
        {DEMO_CHAT.answer.rest}
      </div>
      <p className="text-[13px] text-app-faint">
        Claude, via the FinanceWebApp MCP server
      </p>
    </BenefitProof>
  );
}

const TRIO = [
  {
    icon: "internet",
    color: "#34d399",
    title: "Works offline",
    body: "Installable app. Changes sync when you're back online.",
  },
  {
    icon: "wallet",
    color: "#60a5fa",
    title: "Any currency",
    body: "Each wallet has its base currency. Rates from the ECB.",
  },
  {
    icon: "invoice",
    color: "#a78bfa",
    title: "Monthly report",
    body: "Last month's summary, by email.",
  },
];

export function TrioProof() {
  return (
    <BenefitProof>
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
        {TRIO.map((t) => (
          <div
            key={t.title}
            className="flex flex-col gap-2.5 rounded-[var(--r-card)] bg-app-card p-3.5 shadow-[var(--box-ring)]"
          >
            <CategoryIcon icon={t.icon} color={t.color} size="sm" />
            <b className="font-display text-[15px] font-semibold">{t.title}</b>
            <p className="text-[13px] leading-normal text-app-muted">
              {t.body}
            </p>
          </div>
        ))}
      </div>
    </BenefitProof>
  );
}
