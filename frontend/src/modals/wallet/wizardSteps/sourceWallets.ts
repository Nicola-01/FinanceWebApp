import api from "../../../api/axiosConfig";
import { groupTagRequests, type RecommendedTagGroup } from "./recommendedTags";
import type { TagRequest } from "../../../dashboard/settings/csvImport";

/**
 * One of the user's existing wallets, offered as a tag source in the wizard.
 * `groups` are its categories (main + sub-categories) already grouped.
 */
export interface SourceWallet {
  id: string;
  name: string;
  icon: string;
  color: string;
  groups: RecommendedTagGroup[];
}

/** Shape of one entry from `GET /api/wallets/tag-sources`. */
interface TagSourceDto {
  wallet: {
    id: string;
    name: string;
    icon: string;
    color: string;
    currency?: string;
  };
  tags: TagRequest[];
}

/**
 * Fetch every wallet the user can read plus all its tags in ONE request
 * (`GET /wallets/tag-sources`), and shape them into {@link SourceWallet}s — the
 * flat tag list of each wallet is grouped into a category tree client-side.
 * A single round-trip on purpose: a per-wallet fetch would be N requests.
 */
export const fetchTagSources = async (): Promise<SourceWallet[]> => {
  const { data } = await api.get<TagSourceDto[]>("/wallets/tag-sources");
  return data.map((entry) => ({
    id: entry.wallet.id,
    name: entry.wallet.name,
    icon: entry.wallet.icon,
    color: entry.wallet.color,
    groups: groupTagRequests(entry.tags ?? []),
  }));
};

/**
 * TEMP mock — the real data will come from a single dedicated endpoint (see
 * `.claude/TODO/wizard-create-wallet.md`, Phase 6 "From wallet"): fetching each
 * wallet's tags separately would be N requests and hit the rate limit, so the
 * backend must return every wallet + its tags in one call, grouped client-side.
 * Names here are intentionally distinct from the Recommended presets.
 */
export const MOCK_SOURCE_WALLETS: SourceWallet[] = [
  {
    id: "w-freelance",
    name: "Freelance",
    icon: "work",
    color: "#0ea5e9",
    groups: [
      {
        parent: { name: "Clients", icon: "work", colorHex: "#0ea5e9" },
        children: [
          { name: "Acme", icon: "bank", colorHex: "#38bdf8" },
          { name: "Globex", icon: "cart", colorHex: "#7dd3fc" },
        ],
      },
      {
        parent: { name: "Taxes", icon: "receipt", colorHex: "#ef4444" },
        children: [
          { name: "VAT", icon: "receipt", colorHex: "#f87171" },
          { name: "Income Tax", icon: "receipt", colorHex: "#fca5a5" },
        ],
      },
      {
        parent: { name: "Tools", icon: "repair", colorHex: "#a855f7" },
        children: [{ name: "Software", icon: "internet", colorHex: "#c084fc" }],
      },
    ],
  },
  {
    id: "w-travel",
    name: "Travel 2026",
    icon: "car",
    color: "#f59e0b",
    groups: [
      {
        parent: { name: "Trips", icon: "car", colorHex: "#f59e0b" },
        children: [
          { name: "Fuel", icon: "gas", colorHex: "#fbbf24" },
          { name: "Tolls", icon: "receipt", colorHex: "#fcd34d" },
        ],
      },
      {
        parent: { name: "Stays", icon: "house", colorHex: "#10b981" },
        children: [{ name: "Hotel", icon: "house", colorHex: "#34d399" }],
      },
    ],
  },
];
