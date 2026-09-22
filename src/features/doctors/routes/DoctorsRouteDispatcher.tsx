import { lazy } from "react";
import { useAuthStore } from "../../auth/store/auth.store";

const DoctorDirectoryPage = lazy(() =>
  import("../pages/DoctorDirectoryPage").then((m) => ({
    default: m.DoctorDirectoryPage,
  })),
);

const DoctorManagementPage = lazy(() =>
  import("../pages/DoctorManagementPage").then((m) => ({
    default: m.DoctorManagementPage,
  })),
);

export function DoctorsRouteDispatcher() {
  const role = useAuthStore((s) => s.user?.role);
  const r = String(role ?? "").toUpperCase();
  if (r === "PATIENT") return <DoctorDirectoryPage />;
  return <DoctorManagementPage />;
}
