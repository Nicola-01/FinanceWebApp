import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTableCellsLarge } from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/ui/Button.tsx";

/** Quiet entry point to layout editing, placed at the end of a page's widgets. */
export const CustomizePageButton: React.FC<{ onClick: () => void }> = ({
  onClick,
}) => (
  <div className="flex justify-center pt-2">
    <Button variant="ghost" onClick={onClick}>
      <FontAwesomeIcon icon={faTableCellsLarge} />
      Customize this page
    </Button>
  </div>
);
