import React, { useEffect, useState } from "react";
import { listAspsps, connectBank, type Aspsp } from "../../api/bankApi";
import { CustomSelect } from "../../components/ui/CustomSelect";
import { Input } from "../../components/ui/Input";
import { FieldLabel } from "../../components/ui/FieldLabel";
import Button from "../../components/ui/Button";
import { triggerToast } from "../../components/ui/ToastNotification.tsx";
import { getApiErrorTitle } from "../../utils/apiError";
import { toLocalIsoDate } from "../../utils/localDate";

const COUNTRY = "IT";

// The backend accepts at most two years of history, up to today.
const minImportFrom = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 2);
  return toLocalIsoDate(d);
};

const defaultImportFrom = () => {
  const d = new Date();
  d.setDate(d.getDate() - 90);
  return toLocalIsoDate(d);
};

/** Picks a bank + history start, then hands the browser over to the bank's consent page. */
export const ConnectBankForm: React.FC<{ walletId: string }> = ({
  walletId,
}) => {
  const [aspsps, setAspsps] = useState<Aspsp[]>([]);
  const [aspsp, setAspsp] = useState("");
  const [importFrom, setImportFrom] = useState(defaultImportFrom);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listAspsps(COUNTRY)
      .then(setAspsps)
      .catch((e) =>
        triggerToast(getApiErrorTitle(e, "Could not load banks"), false),
      );
  }, []);

  const submit = async () => {
    setBusy(true);
    try {
      const { url } = await connectBank(walletId, {
        aspspName: aspsp,
        country: COUNTRY,
        importFrom,
      });
      window.location.assign(url);
    } catch (e) {
      triggerToast(getApiErrorTitle(e, "Could not start bank link"), false);
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <FieldLabel>Bank</FieldLabel>
        <CustomSelect
          value={aspsp}
          onChange={setAspsp}
          options={aspsps.map((a) => ({ value: a.name, label: a.name }))}
        />
      </div>
      <div>
        <FieldLabel>Import transactions from</FieldLabel>
        <Input
          type="date"
          min={minImportFrom()}
          max={toLocalIsoDate(new Date())}
          value={importFrom}
          onChange={(e) => setImportFrom(e.target.value)}
        />
      </div>
      <Button onClick={submit} disabled={!aspsp || !importFrom || busy}>
        Continue to bank
      </Button>
    </div>
  );
};
