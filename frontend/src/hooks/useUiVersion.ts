import { useSyncExternalStore } from "react";
import {
  getUiVersion,
  setUiVersion,
  subscribeUiVersion,
  type UiVersion,
} from "../utils/uiVersion";

export function useUiVersion(): [UiVersion, (v: UiVersion) => void] {
  const version = useSyncExternalStore(subscribeUiVersion, getUiVersion);
  return [version, setUiVersion];
}
