import React, { useState } from "react";
import { faCircleHalfStroke } from "@fortawesome/free-solid-svg-icons";
import { todoData, type ToDoItem, type ToDoStatus } from "./todoData";
import { StatusPill } from "../ui/StatusPill";
import { Badge } from "../ui/Badge";
import Button from "../ui/Button";

const SUBTASK_LIMIT = 3;

// Display order of the groups; empty groups are not rendered.
const GROUPS: { status: ToDoStatus; label: string; note?: string }[] = [
  { status: "STARTED", label: "In progress" },
  { status: "PLANNED", label: "Planned" },
  {
    status: "EVALUATION",
    label: "Under evaluation",
    note: "Ideas being considered, not confirmed yet.",
  },
  { status: "FINISHED", label: "Done" },
];

const StatusChip: React.FC<{ status: ToDoStatus }> = ({ status }) => {
  switch (status) {
    case "FINISHED":
      return <StatusPill status="ok">Completed</StatusPill>;
    case "STARTED":
      return (
        <StatusPill status="warn" icon={faCircleHalfStroke}>
          In progress
        </StatusPill>
      );
    case "EVALUATION":
      return (
        <Badge tone="neutral" variant="subtle" size="sm">
          Evaluating
        </Badge>
      );
    case "PLANNED":
    default:
      return (
        <Badge tone="neutral" variant="subtle" size="sm">
          Planned
        </Badge>
      );
  }
};

const ToDoRowV2: React.FC<{ item: ToDoItem }> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  const subtasks = item.subtasks ?? [];
  const hasMore = subtasks.length > SUBTASK_LIMIT;
  const shown = expanded ? subtasks : subtasks.slice(0, SUBTASK_LIMIT);

  return (
    <li className="flex min-h-14 flex-col gap-2 px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h4 className="text-[15px] font-semibold text-app-text">
            {item.title}
          </h4>
          {item.description && (
            <p className="text-[13px] text-app-muted">{item.description}</p>
          )}
        </div>
        <div className="shrink-0">
          <StatusChip status={item.status} />
        </div>
      </div>

      {subtasks.length > 0 && (
        <div>
          <ul className="list-disc pl-5 text-[13px] text-app-muted marker:text-app-faint">
            {shown.map((task) => (
              <li key={task}>{task}</li>
            ))}
          </ul>
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded
                ? "Show less"
                : `Show ${subtasks.length - SUBTASK_LIMIT} more subtasks`}
            </Button>
          )}
        </div>
      )}
    </li>
  );
};

/** UI v2 roadmap list: one grouped card per status, hairline-divided rows. */
const ToDoListV2: React.FC = () => (
  <div className="flex flex-col gap-6 pb-24">
    {GROUPS.map(({ status, label, note }) => {
      const items = todoData.filter((i) => i.status === status);
      if (items.length === 0) return null;
      return (
        <section key={status}>
          <h3 className="mb-2 px-1 text-[13px] text-app-muted">{label}</h3>
          {note && (
            <p className="-mt-1 mb-2 px-1 text-[13px] text-app-faint">{note}</p>
          )}
          <ul className="divide-y divide-app-border overflow-hidden rounded-[var(--r-card)] bg-app-card shadow-[var(--box-ring)]">
            {items.map((item) => (
              <ToDoRowV2 key={item.id} item={item} />
            ))}
          </ul>
        </section>
      );
    })}
  </div>
);

export default ToDoListV2;
