import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import api from "../../api/axiosConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWallet, faCheck } from "@fortawesome/free-solid-svg-icons";
import { ModalDialog } from "../common/ModalDialog";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import type { CurrencyCode } from "../../utils/currencies";

// Importiamo i nostri nuovi componenti puliti!
import { type IconKey, ICONS } from "../../utils/icons";
import { CurrencySelector } from "../../components/selectors/CurrencySelector.tsx";
import { IconColorSelector } from "../../components/icon/IconColorSelector.tsx";

// import {IconPickerButton} from "../components/IconPickerButton.tsx";

export interface CreateWalletModalHandle {
  openModal: () => void;
}

interface Props {
  onSuccess: (walletId: string) => void;
}

export const CreateWalletModal = forwardRef<CreateWalletModalHandle, Props>(
  ({ onSuccess }, ref) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    // Stati
    const [name, setName] = useState("");
    const [iconKey, setIconKey] = useState<IconKey>("wallet");
    const [color, setColor] = useState("var(--color-app-green)");
    const [currency, setCurrency] = useState<CurrencyCode>("EUR");
    const [loading, setLoading] = useState(false);
    const [showSelectors, setShowSelectors] = useState(false);

    const selectorRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useImperativeHandle(ref, () => ({
      openModal: () => {
        setName("");
        setIconKey("wallet");
        setColor("var(--color-app-green)");
        setCurrency("EUR");
        dialogRef.current?.showModal();
      },
    }));

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (
          selectorRef.current &&
          !selectorRef.current.contains(target) &&
          buttonRef.current &&
          !buttonRef.current.contains(target)
        ) {
          setShowSelectors(false);
        }
      };

      if (showSelectors)
        document.addEventListener("mousedown", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [showSelectors]);

    const handleSubmit = async () => {
      if (!name) return triggerToast("WalletCard name is required", false);

      setLoading(true);
      try {
        // Il backend riceverà la chiave testuale dell'icona (es. "piggyBank")
        const response = await api.post("/wallets", {
          name,
          icon: iconKey,
          color,
          currency,
        });
        triggerToast("WalletCard created successfully!", true);
        onSuccess(response.data.id);
        dialogRef.current?.close();
      } catch (err: any) {
        triggerToast(
          err.response?.data?.title || "Error creating wallet",
          false,
        );
      } finally {
        setLoading(false);
      }
    };

    // @ts-ignore
    return (
      <ModalDialog
        ref={dialogRef}
        title={
          <>
            <FontAwesomeIcon icon={faWallet} className="text-app-green" /> New
            Wallet
          </>
        }
        subtitle="Organize your finances with a custom wallet."
        rightActions={[
          {
            icon: <FontAwesomeIcon icon={faCheck} className="text-xl" />,
            onClick: async () => {
              if (!loading) await handleSubmit();
            },
            hoverColor: "hover:text-app-green",
            disabled: loading,
          },
        ]}
      >
        <div id="create-wallet-form" className="space-y-5 text-left">
          {/* Anteprima Icona Real-time */}
          <div className="relative mb-6 flex flex-col items-center">
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setShowSelectors(!showSelectors)}
              className="group flex h-16 w-16 cursor-pointer items-center justify-center rounded-2xl border border-app-border bg-app-input text-2xl shadow-lg transition-all duration-300 hover:scale-105 hover:bg-app-surface"
              style={{ color: color }}
              title="Change Icon or Color"
            >
              <FontAwesomeIcon icon={ICONS[iconKey]} />
            </button>

            <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-app-muted">
              Click icon to edit
            </span>

            {showSelectors && (
              <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50">
                <IconColorSelector
                  ref={selectorRef}
                  iconValue={iconKey}
                  onChangeIcon={setIconKey}
                  colorValue={color}
                  onChangeColor={setColor}
                />
              </div>
            )}
          </div>

          {/*<IconPickerButton*/}
          {/*    icon={iconKey} color={color}*/}
          {/*    onIconChange={setIconKey}*/}
          {/*    onColorChange={setColor}*/}
          {/*    isOpen={showSelectors} onToggle={setShowSelectors}*/}
          {/*/>*/}

          <div>
            <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
              Wallet Name
            </label>
            <input
              className="h-[48px] w-full rounded-xl border border-app-border bg-app-input px-4 text-app-text outline-none transition-all focus:border-app-green"
              type="text"
              placeholder="e.g. Personal Savings"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Input Valuta */}
          <CurrencySelector value={currency} onChange={setCurrency} />
        </div>
      </ModalDialog>
    );
  },
);
