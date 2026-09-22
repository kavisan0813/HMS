import { lazy } from "react";
import { useAuthStore } from "../../auth/store/auth.store";

const PatientMyBillsPage = lazy(() =>
  import("../../billing/pages/PatientMyBillsPage").then((m) => ({
    default: m.PatientMyBillsPage,
  })),
);

const BillingManagementPage = lazy(() =>
  import("../../billing/pages/BillingManagementPage").then((m) => ({
    default: m.BillingManagementPage,
  })),
);

export function PatientBillingRouteDispatcher() {
  const role = useAuthStore((s) => s.user?.role);
  const isPatient = String(role || "").toUpperCase() === "PATIENT";

  return isPatient ? <PatientMyBillsPage /> : <BillingManagementPage />;
}
