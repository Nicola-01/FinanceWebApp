import { createContext, useContext } from "react";
import type { Subscription, Tag, Transaction, Wallet } from "../../utils/types";
import type {
  DateRangeValue,
  PresetType,
} from "../../components/DataPicker/CustomDatePicker.tsx";
import type { TabType } from "./walletTabs";

export interface WalletContextType {
  wallet: Wallet;
  transactions: Transaction[];
  subscriptions: Subscription[];
  filteredTransactions: Transaction[];
  tags: Tag[];
  isLoading: boolean;
  selectedTags: string[] | null;
  setSelectedTags: (tags: string[] | null) => void;
  dateRange: DateRangeValue;
  setDateRange: (range: DateRangeValue) => void;
  datePreset: PresetType;
  setDatePreset: (preset: PresetType) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  fetchData: (signal?: AbortSignal) => Promise<void>;
  handleAddTag: (newTag: Partial<Tag>) => Promise<boolean>;
  handleUpdateTag: (
    oldName: string,
    updatedTag: Partial<Tag>,
  ) => Promise<boolean>;
  handleDeleteTag: (tagName: string) => Promise<boolean>;
  handleUpdateWallet: (updatedWallet: Partial<Wallet>) => Promise<boolean>;
  onWalletDelete: () => void;
}

export const WalletContext = createContext<WalletContextType | undefined>(
  undefined,
);

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }
  return context;
};
