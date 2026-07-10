import React from "react";
import { CloudAlert, CloudOff } from "lucide-react";
import { ResponsiveOverlay } from "../components/ui/ResponsiveOverlay";
import Button from "../components/ui/Button";
import type { SyncStatus } from "../hooks/useSyncStatus";
import type { OpKind, PendingOp } from "../utils/offlineDb";

interface SyncCenterOverlayProps {
  open: boolean;
  onClose: () => void;
  sync: SyncStatus;
}

/** Human label for an op: the entity's name if the payload carries one, else its key. */
const opLabel = (op: PendingOp): string =>
  (typeof op.payload.name === "string" && op.payload.name) || op.entityKey;

const OP_KIND_LABEL: Record<OpKind, string> = {
  create: "Create",
  update: "Update",
  delete: "Delete",
};

/**
 * Sync Center: a right drawer (mobile full-screen) that surfaces the offline
 * queue in three sections — Conflicts (needs a mine/theirs decision), Failed
 * (retry / discard), and Waiting to sync — plus a "Sync now" footer. Purely
 * presentational: all state + actions come from the {@link SyncStatus} prop.
 */
export const SyncCenterOverlay: React.FC<SyncCenterOverlayProps> = ({
  open,
  onClose,
  sync,
}) => {
  const conflicts = sync.ops.filter((o) => o.status === "conflict");
  const failed = sync.ops.filter((o) => o.status === "failed");
  const waiting = sync.ops.filter(
    (o) => o.status === "pending" || o.status === "syncing",
  );
  const isEmpty = sync.ops.length === 0;

  const footer = (
    <Button
      fullWidth
      onClick={() => void sync.syncNow()}
      disabled={!sync.online || sync.syncing}
    >
      {sync.syncing ? "Syncing…" : "Sync now"}
    </Button>
  );

  return (
    <ResponsiveOverlay
      open={open}
      onClose={onClose}
      title="Sync center"
      width={480}
      footer={isEmpty ? undefined : footer}
    >
      {isEmpty ? (
        <p className="py-10 text-center text-sm text-app-muted">
          All changes are synced.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {conflicts.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-red-400">
                Conflicts
              </h3>
              <ul className="flex flex-col gap-2">
                {conflicts.map((op) => (
                  <li
                    key={op.id}
                    className="rounded-xl border border-app-border bg-app-input p-3"
                  >
                    <div className="flex items-center gap-2">
                      <CloudAlert
                        size={14}
                        className="shrink-0 text-red-400"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-app-text">
                        {opLabel(op)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-app-muted">
                      {op.conflictKind === "missing"
                        ? "Deleted on server"
                        : "Server changed first"}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => void sync.resolveConflict(op, "mine")}
                      >
                        Keep mine
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void sync.resolveConflict(op, "theirs")}
                      >
                        Take theirs
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {failed.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-app-text">
                Failed
              </h3>
              <ul className="flex flex-col gap-2">
                {failed.map((op) => (
                  <li
                    key={op.id}
                    className="rounded-xl border border-app-border bg-app-input p-3"
                  >
                    <div className="flex items-center gap-2">
                      <CloudAlert
                        size={14}
                        className="shrink-0 text-red-400"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-app-text">
                        {opLabel(op)}
                      </span>
                    </div>
                    {op.lastError && (
                      <p className="mt-1 text-xs text-app-red">
                        {op.lastError}
                      </p>
                    )}
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void sync.retryOp(op)}
                      >
                        Retry
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void sync.discardOp(op)}
                      >
                        Discard
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {waiting.length > 0 && (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-app-muted">
                Waiting to sync
              </h3>
              <ul className="flex flex-col gap-2">
                {waiting.map((op) => (
                  <li
                    key={op.id}
                    className="flex items-center gap-2 rounded-xl border border-app-border bg-app-input p-3"
                  >
                    <CloudOff
                      size={14}
                      className="shrink-0 text-amber-400"
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-app-text">
                      {opLabel(op)}
                    </span>
                    <span className="shrink-0 text-xs text-app-muted">
                      {OP_KIND_LABEL[op.op]}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </ResponsiveOverlay>
  );
};

export default SyncCenterOverlay;
