import React from "react";
import type { DeleteModalHandle } from "./DeleteModal";
import { DeleteModalContext } from "./DeleteModalContext";

export const DeleteModalProvider: React.FC<{
  deleteModalRef: React.RefObject<DeleteModalHandle | null>;
  children: React.ReactNode;
}> = ({ deleteModalRef, children }) => {
  return (
    <DeleteModalContext.Provider value={deleteModalRef}>
      {children}
    </DeleteModalContext.Provider>
  );
};
