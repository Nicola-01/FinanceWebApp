import React, { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faRotateLeft } from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button.tsx";

interface LayoutEditBarProps {
  hiddenCount: number;
  onReset: () => void;
  onDone: () => void;
}

/**
 * Floating toolbar shown while a page's layout is being edited. It takes the place of the
 * mobile bottom dock (see the `body[data-layout-editing]` rule in index.css) until Done.
 */
export const LayoutEditBar: React.FC<LayoutEditBarProps> = ({
  hiddenCount,
  onReset,
  onDone,
}) => {
  useEffect(() => {
    document.body.dataset.layoutEditing = "";
    return () => {
      delete document.body.dataset.layoutEditing;
    };
  }, []);

  return (
    <div
      role="toolbar"
      aria-label="Layout editing"
      className="fixed bottom-6 left-1/2 z-[1150] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-[16px] border border-app-border bg-app-raised py-1.5 pl-4 pr-1.5 text-sm shadow-[0_16px_40px_-12px_rgb(0_0_0/0.7)] max-md:bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] max-md:left-3 max-md:right-3 max-md:translate-x-0"
    >
      <span className="text-app-muted">
        Editing layout
        {hiddenCount > 0 ? ` · ${hiddenCount} hidden` : ""}
      </span>
      <Button variant="ghost" onClick={onReset} aria-label="Reset layout">
        <FontAwesomeIcon icon={faRotateLeft} />
        <span className="max-md:sr-only">Reset</span>
      </Button>
      <Button variant="primary" onClick={onDone}>
        <FontAwesomeIcon icon={faCheck} />
        Done
      </Button>
    </div>
  );
};
