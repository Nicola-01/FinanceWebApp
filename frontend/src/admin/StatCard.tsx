import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: IconDefinition;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color,
}) => {
  return (
    <div
      className="
            flex items-center gap-5 p-6
            theme-bg-page-transparent border border-app-border rounded-2xl
            backdrop-blur-lg transition-all duration-300
            {/*hover:-translate-y-1 hover:theme-border-default*/}
        "
    >
      {/* Icon Wrapper */}
      <div
        className="
                    flex justify-center items-center
                    w-[60px] h-[60px] rounded-full
                    bg-app-input text-2xl shrink-0
                "
        style={{ color: color }}
      >
        <FontAwesomeIcon icon={icon} />
      </div>

      {/* Info */}
      <div className="flex flex-col">
        <h4 className="text-sm font-medium text-app-muted m-0 uppercase tracking-wider">
          {title}
        </h4>
        <p className="text-2xl font-bold theme-text-default mt-1 m-0">
          {value}
        </p>
      </div>
    </div>
  );
};
