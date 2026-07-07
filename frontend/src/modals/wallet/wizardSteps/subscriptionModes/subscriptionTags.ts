import type {
  SubscriptionRequest,
  TagRequest,
} from "../../../../dashboard/settings/csvImport";

const tagKey = (s: string) => s.trim().toLowerCase();

/**
 * A staged subscription has an *unresolved* tag when it names a (non-empty) tag
 * that isn't among the wallet's staged tags — the same condition the staged
 * list flags with an amber badge. Such a subscription can't be imported as-is:
 * the user must reassign it to an existing tag or create the missing one first.
 * An empty tag isn't treated as unresolved (it's simply uncategorised).
 */
export const subscriptionTagUnresolved = (
  sub: SubscriptionRequest,
  tags: TagRequest[],
): boolean => {
  const name = sub.tag?.trim() ?? "";
  return name !== "" && !tags.some((t) => tagKey(t.name) === tagKey(name));
};

/** True when any staged subscription still points at a tag not in `tags`. */
export const hasUnresolvedSubscriptionTags = (
  subscriptions: SubscriptionRequest[],
  tags: TagRequest[],
): boolean => subscriptions.some((s) => subscriptionTagUnresolved(s, tags));
