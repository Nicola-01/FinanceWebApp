import { createContext, useContext } from "react";
import type {
  Subscription,
  Tag,
  Transaction,
  Wallet,
} from "../../types/domain";
import type {
  DateRangeValue,
  PresetType,
} from "../../components/datePicker/CustomDatePicker.tsx";
import type { TabType } from "./walletTabs";

export interface WalletContextType {
  wallet: Wallet;
  transactions: Transaction[];
  subscriptions: Subscription[];
  filteredTransactions: Transaction[];
  pendingTransactions: Transaction[];
  /** Imports still on the "To categorise" placeholder, across every period. */
  toCategorise: Transaction[];
  /** True while the list shows only `toCategorise` (auto-off once it empties). */
  onlyToCategorise: boolean;
  setOnlyToCategorise: (on: boolean) => void;
  tags: Tag[];
  isLoading: boolean;
  selectedTags: string[] | null;
  setSelectedTags: (tags: string[] | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
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
