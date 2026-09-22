import { useAuthStore } from "../../auth/store/auth.store";
import { DoctorDirectoryPage } from "../pages/DoctorDirectoryPage";
import { DoctorManagementPage } from "../pages/DoctorManagementPage";

export function DoctorsRouteDispatcher() {
  const role = useAuthStore((s) => s.user?.role);
  const r = String(role ?? "").toUpperCase();
  if (r === "PATIENT") return <DoctorDirectoryPage />;
  return <DoctorManagementPage />;
}
