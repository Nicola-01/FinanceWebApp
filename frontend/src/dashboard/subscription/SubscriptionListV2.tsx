import React from "react";
import type { Subscription } from "../../types/domain";
import { getDaysLeft } from "../../utils/subscriptionHelper";
import { groupSubscriptions } from "./subscriptionGroups";
import { SubscriptionRowV2 } from "./SubscriptionRowV2";
import { PastSubscriptionsSection } from "./PastSubscriptionsSection";

/** Width cap for the v2 list column (and the summary above it). Change here only. */
export const V2_LIST_MAX_WIDTH = "max-w-[880px]";

/** Upcoming payments within this many days are "This month"; beyond, "Later". */
const THIS_MONTH_DAYS = 31;

interface SubscriptionListV2Props {
  subscriptions: Subscription[];
  past: React.ComponentProps<typeof PastSubscriptionsSection>;
  onEditSubscription?: (subscription: Subscription) => void;
}

const Group: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <section className="flex flex-col gap-2">
    <h3 className="px-1 text-[13px] text-app-muted">{title}</h3>
    <div className="divide-y divide-app-border overflow-hidden rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)]">
      {children}
    </div>
  </section>
);

export const SubscriptionListV2: React.FC<SubscriptionListV2Props> = ({
  subscriptions,
  past,
  onEditSubscription,
}) => {
  const { within7Days, within31Days, completedSubs, hasPast } =
    groupSubscriptions(subscriptions);

  // within31Days holds every upcoming payment after 7 days; split it by horizon.
  const isThisMonth = (s: Subscription) =>
    !s.bankDriven &&
    (getDaysLeft(s.nextExecutionDate) ?? Infinity) <= THIS_MONTH_DAYS;
  const thisMonth = within31Days.filter(isThisMonth);
  const later = within31Days.filter((s) => !isThisMonth(s));

  const renderUpcoming = (subs: Subscription[]) =>
    subs.map((sub) => (
      <SubscriptionRowV2
        key={`upcoming-${sub.id}`}
        subscription={sub}
        date={sub.nextExecutionDate}
        onClick={() => onEditSubscription?.(sub)}
      />
    ));

  return (
    <div
      className={`mx-auto flex w-full ${V2_LIST_MAX_WIDTH} animate-[fadeIn_0.3s_ease-out] flex-col gap-8 pb-10`}
    >
      {within7Days.length > 0 && (
        <Group title="Due now">{renderUpcoming(within7Days)}</Group>
      )}
      {thisMonth.length > 0 && (
        <Group title="This month">{renderUpcoming(thisMonth)}</Group>
      )}
      {later.length > 0 && <Group title="Later">{renderUpcoming(later)}</Group>}

      {hasPast && (
        <section className="flex flex-col gap-4">
          <h3 className="px-1 text-[13px] text-app-muted">Paid</h3>
          <PastSubscriptionsSection {...past} />
        </section>
      )}

      {completedSubs.length > 0 && (
        <Group title="Completed">
          {completedSubs.map((sub) => (
            <SubscriptionRowV2
              key={`completed-${sub.id}`}
              subscription={sub}
              date={sub.nextExecutionDate}
              showDue={false}
              className="opacity-70 transition-opacity hover:opacity-100"
              onClick={() => onEditSubscription?.(sub)}
            />
          ))}
        </Group>
      )}
    </div>
  );
};
