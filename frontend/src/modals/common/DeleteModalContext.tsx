import React, { createContext, useContext } from "react";
import type { DeleteModalHandle } from "./DeleteModal";

const DeleteModalContext =
  createContext<React.RefObject<DeleteModalHandle | null> | null>(null);

export const useDeleteModal = () => {
  const context = useContext(DeleteModalContext);
  if (!context) {
    throw new Error("useDeleteModal must be used within a DeleteModalProvider");
  }
  return context;
};

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
