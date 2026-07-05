import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreateWalletWizard,
  type CreateWalletWizardHandle,
} from "./CreateWalletWizard";

/**
 * TEMPORARY preview harness (reachable at /wizard-mock) that mounts the REAL
 * wallet-creation wizard, auto-opened, so the flow can be reviewed end to end.
 * Removed together with the /wizard-mock route in the integration phase.
 *
 * Note: completing the wizard hits the real API, so you must be logged in for
 * the final "create" phase to succeed; the step screens can be reviewed either
 * way.
 */
export default function CreateWalletWizardMock() {
  const navigate = useNavigate();
  const ref = useRef<CreateWalletWizardHandle>(null);

  useEffect(() => {
    ref.current?.openModal();
  }, []);

  return (
    <div className="min-h-screen bg-app-bg">
      <CreateWalletWizard
        ref={ref}
        onSuccess={(id) => navigate(`/dashboard/${id}`)}
      />
    </div>
  );
}
