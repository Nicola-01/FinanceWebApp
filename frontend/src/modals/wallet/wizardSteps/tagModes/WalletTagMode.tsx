import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "../../../../components/icon/Icon";
import Button from "../../../../components/ui/Button";
import { useUiVersion } from "../../../../hooks/useUiVersion";
import { TagCategoryPicker } from "../TagCategoryPicker";
import type { RecommendedTagGroup } from "../recommendedTags";
import type { SourceWallet } from "../sourceWallets";

const keyOf = (name: string) => name.trim().toLowerCase();

export interface WalletTagModeProps {
  /** The user's other wallets, offered as tag sources. */
  sourceWallets: SourceWallet[];
  /** Which source wallet is drilled into (null = show the wallet list). */
  selectedWalletId: string | null;
  /** Drill into a wallet (its id) or back out to the list (null). */
  onSelectWallet: (id: string | null) => void;
  /** Names currently staged (lower-cased), to compute each card's state. */
  stagedKeys: Set<string>;
  /** Toggle a whole category on/off. */
  onToggle: (group: RecommendedTagGroup) => void;
}

/**
 * "From wallet" mode of the wallet wizard's Tags step: pick one of the user's
 * other wallets, then stage any of its categories. The wallet list highlights
 * each card by how much of it is already staged (none / partial / full); the
 * drilled-in view reuses {@link TagCategoryPicker}. The parent (TagsStep) owns
 * the staged list and the current drill-down selection.
 */
export function WalletTagMode({
  sourceWallets,
  selectedWalletId,
  onSelectWallet,
  stagedKeys,
  onToggle,
}: WalletTagModeProps) {
  const sourceWallet =
    sourceWallets.find((w) => w.id === selectedWalletId) ?? null;
  const [ui] = useUiVersion();
  const v2 = ui === "v2"; // ui-v2-switch

  // How much of a source wallet is staged, for the wallet-card highlight.
  const walletState = (w: SourceWallet): "none" | "partial" | "full" => {
    const states = w.groups.map((g) => {
      if (!stagedKeys.has(keyOf(g.parent.name))) return "none";
      return g.children.every((c) => stagedKeys.has(keyOf(c.name)))
        ? "full"
        : "partial";
    });
    if (states.every((s) => s === "none")) return "none";
    if (states.every((s) => s === "full")) return "full";
    return "partial";
  };

  return (
    <div className="space-y-3">
      {/* Persistent header row — reserves the vertical space so the back
          link and wallet crumb don't pop in from nowhere when drilling
          into a wallet; only the content below it swaps. */}
      {(sourceWallet || sourceWallets.length > 0) && (
        <div
          className={`flex min-h-[1.25rem] items-center gap-2 ${v2 ? "text-[13px]" : "text-xs"}`}
        >
          {sourceWallet ? (
            <>
              {v2 ? ( // ui-v2-switch
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectWallet(null)}
                >
                  <FontAwesomeIcon
                    icon={faChevronLeft}
                    className="text-[10px]"
                  />
                  All wallets
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectWallet(null)}
                  className="flex items-center gap-1.5 font-semibold text-app-muted transition-colors hover:text-app-text"
                >
                  <FontAwesomeIcon
                    icon={faChevronLeft}
                    className="text-[10px]"
                  />
                  All wallets
                </button>
              )}
              <FontAwesomeIcon
                icon={faChevronRight}
                className="text-[8px] text-app-muted/60"
              />
              <span className="flex items-center gap-1.5 font-semibold text-app-text">
                <Icon
                  icon={sourceWallet.icon}
                  color={sourceWallet.color}
                  className="text-sm"
                />
                {sourceWallet.name}
              </span>
            </>
          ) : (
            <span className="text-app-muted">
              Choose which wallet to copy tags from.
            </span>
          )}
        </div>
      )}

      {sourceWallet ? (
        <TagCategoryPicker
          groups={sourceWallet.groups}
          stagedKeys={stagedKeys}
          onToggle={onToggle}
        />
      ) : sourceWallets.length === 0 ? (
        <div
          className={
            v2
              ? "flex flex-col items-center gap-2 rounded-[var(--r-card)] bg-app-card px-6 py-10 text-center shadow-[var(--box-ring)]"
              : "flex flex-col items-center gap-2 rounded-[var(--r-card)] border border-dashed border-app-border bg-app-surface px-6 py-10 text-center"
          }
        >
          <FontAwesomeIcon
            icon={faWallet}
            className="text-2xl text-app-muted"
          />
          <p className="text-sm text-app-muted">
            You have no other wallets to copy categories from.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sourceWallets.map((w) => {
            const st = walletState(w);
            const active = st !== "none";
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => onSelectWallet(w.id)}
                aria-label={`Use tags from ${w.name}`}
                aria-pressed={
                  st === "full" ? true : st === "partial" ? "mixed" : false
                }
                className={
                  v2
                    ? `flex items-center gap-3 rounded-[var(--r-card)] bg-app-card p-4 text-left shadow-[var(--box-ring)] transition-colors ${active ? "" : "hover:bg-app-raised"}`
                    : `flex items-center gap-3 rounded-[var(--r-card)] border p-3 text-left transition-colors ${
                        active
                          ? st === "partial"
                            ? "border-dashed"
                            : ""
                          : "border-app-border bg-app-surface hover:bg-app-input"
                      }`
                }
                style={
                  active
                    ? v2
                      ? {
                          backgroundColor: `${w.color}14`,
                          boxShadow: `inset 0 0 0 ${st === "full" ? 1.5 : 1}px ${w.color}`,
                        }
                      : {
                          borderColor: w.color,
                          backgroundColor: `${w.color}14`,
                        }
                    : undefined
                }
              >
                <span
                  className={
                    v2
                      ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] text-lg"
                      : "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-input)] bg-app-card text-lg shadow-sm"
                  }
                  style={{
                    color: w.color,
                    backgroundColor: v2
                      ? `color-mix(in srgb, ${w.color} 18%, transparent)`
                      : undefined,
                  }}
                >
                  <Icon icon={w.icon} color={w.color} />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={
                      v2
                        ? "block truncate text-[15px] text-app-text"
                        : "block truncate text-sm font-bold text-app-text"
                    }
                  >
                    {w.name}
                  </span>
                  <span
                    className={`block ${v2 ? "text-[13px]" : "text-xs"} text-app-muted`}
                  >
                    {w.groups.length} categor
                    {w.groups.length === 1 ? "y" : "ies"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WalletTagMode;
