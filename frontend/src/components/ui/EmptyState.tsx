import React from "react";

export interface EmptyStateProps {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  className = "",
}) => (
  <div className={"px-4 py-12 text-center text-app-muted " + className}>
    <img src="/icon.svg" alt="" className="mx-auto mb-3 w-24 -rotate-6" />
    <h3 className="mb-1 font-display text-xl font-[650] text-app-text">
      {title}
    </h3>
    {description && <p>{description}</p>}
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </div>
);
