import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as walletOps from "../../api/walletOps";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTags } from "@fortawesome/free-solid-svg-icons";
import { ModalDialog } from "../common/ModalDialog";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { Input } from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { type IconKey, ICONS } from "../../utils/icons";
import { IconColorSelector } from "../../components/icon/IconColorSelector.tsx";
import { getApiErrorTitle } from "../../utils/apiError";

export interface CreateTagModalHandle {
  openModal: () => void;
}

interface Props {
  walletId: string;
  onSuccess: () => void;
}

export const CreateTagModal = forwardRef<CreateTagModalHandle, Props>(
  ({ walletId, onSuccess }, ref) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const selectorRef = useRef<HTMLDivElement>(null);

    const [name, setName] = useState("");
    const [iconKey, setIconKey] = useState<IconKey>("tag");
    const [colorHex, setColorHex] = useState("var(--color-app-green)");
    const [showSelectors, setShowSelectors] = useState(false);
    const [loading, setLoading] = useState(false);

    useImperativeHandle(ref, () => ({
      openModal: () => {
        setName("");
        setIconKey("tag");
        setColorHex("var(--color-app-green)");
        dialogRef.current?.showModal();
      },
    }));

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          selectorRef.current &&
          !selectorRef.current.contains(e.target as Node)
        ) {
          setShowSelectors(false);
        }
      };
      if (showSelectors)
        document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [showSelectors]);

    const handleSubmit = async () => {
      if (name.trim().length < 2)
        return triggerToast("Name must be at least 2 characters", false);

      setLoading(true);
      try {
        const payload = {
          name: name.trim(),
          icon: iconKey,
          colorHex,
          parentName: null, // This modal only creates top-level (parent) categories.
        };

        // Offline-aware: online this sends the same POST /tags/{walletId};
        // offline it enqueues the create and the overlay renders the pending
        // tag, so either outcome is treated as success.
        await walletOps.createTag(walletId, payload);
        triggerToast("Parent Tag created!", true);
        onSuccess();
        dialogRef.current?.close();
      } catch (err: unknown) {
        triggerToast(getApiErrorTitle(err, "Error creating tag"), false);
      } finally {
        setLoading(false);
      }
    };

    return (
      <ModalDialog
        ref={dialogRef}
        title={
          <>
            <FontAwesomeIcon icon={faTags} className="text-app-green" /> New
            Main Category
          </>
        }
        subtitle="Organize your transactions better."
        footer={
          <Button
            variant="primary"
            fullWidth
            ripple
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Creating…" : "Create Category"}
          </Button>
        }
      >
        <div id="create-tag-form" className="space-y-5 text-left">
          <div className="relative mb-6 flex flex-col items-center">
            <button
              type="button"
              onClick={() => setShowSelectors(!showSelectors)}
              className="group flex h-16 w-16 cursor-pointer items-center justify-center rounded-2xl border border-app-border bg-app-input text-2xl shadow-lg transition-all duration-300 hover:scale-105 hover:bg-app-surface"
              style={{ color: colorHex }}
              title="Change Icon or Color"
            >
              <FontAwesomeIcon icon={ICONS[iconKey] || ICONS["tag"]} />
            </button>

            {showSelectors && (
              <div className="absolute top-20 z-50">
                <IconColorSelector
                  ref={selectorRef}
                  iconValue={iconKey}
                  onChangeIcon={setIconKey}
                  colorValue={colorHex}
                  onChangeColor={setColorHex}
                />
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 ml-1 block text-xs font-medium uppercase tracking-wider text-app-muted">
              Category Name *
            </label>
            <Input
              type="text"
              placeholder="e.g. Shopping"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>
      </ModalDialog>
    );
  },
);
