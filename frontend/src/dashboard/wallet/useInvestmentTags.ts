import { useMemo } from "react";
import { investmentTagNames } from "../../utils/investments";
import { useWalletContext } from "./WalletContext.tsx";

/** Names of the wallet's investment tags (flagged, or under a flagged parent). */
export function useInvestmentTags(): Set<string> {
  const { tags } = useWalletContext();
  return useMemo(() => investmentTagNames(tags), [tags]);
}
