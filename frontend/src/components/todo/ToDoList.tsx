import React from "react";
import {
  CheckCircle2,
  Circle,
  CircleDashed,
  ArrowRightCircle,
} from "lucide-react";
import { todoData, type ToDoItem, type ToDoStatus } from "./todoData";
import { Badge } from "../ui/Badge";

const StatusIcon = ({ status }: { status: ToDoStatus }) => {
  switch (status) {
    case "FINISHED":
      return <CheckCircle2 className="w-6 h-6 text-app-green" />;
    case "STARTED":
      return <ArrowRightCircle className="w-6 h-6 text-app-purple" />;
    case "EVALUATION":
      return <CircleDashed className="w-6 h-6 text-app-yellow" />;
    case "PLANNED":
    default:
      return <Circle className="w-6 h-6 text-app-muted" />;
  }
};

const StatusBadge = ({ status }: { status: ToDoStatus }) => {
  switch (status) {
    case "FINISHED":
      return (
        <Badge tone="green" size="md">
          Completed
        </Badge>
      );
    case "STARTED":
      return (
        <Badge tone="purple" size="md">
          Started
        </Badge>
      );
    case "EVALUATION":
      return (
        <Badge tone="yellow" size="md">
          Evaluating
        </Badge>
      );
    case "PLANNED":
    default:
      return (
        <Badge tone="neutral" size="md">
          Planned
        </Badge>
      );
  }
};

const ToDoCard: React.FC<{ item: ToDoItem }> = ({ item }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const showLimit = 3;
  const hasMore = (item.subtasks?.length || 0) > showLimit;
  const displayedSubtasks = isExpanded
    ? item.subtasks
    : item.subtasks?.slice(0, showLimit);

  return (
    <div className="bg-app-input border border-app-border rounded-2xl p-6 backdrop-blur-sm transition-all hover:bg-app-hover flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <StatusIcon status={item.status} />
          <h3 className="text-xl font-bold text-app-text">{item.title}</h3>
        </div>
        <StatusBadge status={item.status} />
      </div>

      {item.description && (
        <p className="text-app-muted text-sm leading-relaxed pl-9">
          {item.description}
        </p>
      )}

      {item.subtasks && item.subtasks.length > 0 && (
        <div className="pl-9 mt-2">
          <ul className="space-y-2">
            {displayedSubtasks?.map((task, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-app-muted"
              >
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                {task}
              </li>
            ))}
          </ul>

          {hasMore && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="mt-3 text-xs font-medium text-app-purple hover:text-app-pink flex items-center gap-1 transition-colors"
            >
              {isExpanded
                ? "Show less"
                : `+${item.subtasks.length - showLimit} more subtasks (show more)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const ToDoList: React.FC = () => {
  const finished = todoData.filter((i) => i.status === "FINISHED");
  const started = todoData.filter((i) => i.status === "STARTED");
  const planned = todoData.filter((i) => i.status === "PLANNED");
  const evaluation = todoData.filter((i) => i.status === "EVALUATION");

  return (
    <div className="max-w-4xl xl:max-w-6xl mx-auto space-y-12 pb-24">
      {started.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-app-purple animate-pulse"></span>
            Currently In Progress
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {started.map((item) => (
              <ToDoCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {planned.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-app-muted">
            <span className="w-3 h-3 rounded-full bg-app-muted"></span>
            Future Roadmap
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {planned.map((item) => (
              <ToDoCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {evaluation.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-app-muted">
            <span className="w-3 h-3 rounded-full bg-app-yellow"></span>
            Under Evaluation
          </h2>
          <p className="text-sm text-app-muted mb-6">
            Ideas being considered — not confirmed yet.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {evaluation.map((item) => (
              <ToDoCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {finished.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-app-muted">
            <span className="w-3 h-3 rounded-full bg-app-green"></span>
            Recently Shipped
          </h2>
          <div className="grid md:grid-cols-2 gap-6 opacity-80">
            {finished.map((item) => (
              <ToDoCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ToDoList;
