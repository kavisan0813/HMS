import { lazy } from "react";
import { useAuthStore } from "../../features/auth/store/auth.store";
import { usePatientPortal } from "../../features/patients/context/usePatientPortal";

const SuperAdminDashboard = lazy(() =>
  import("../../features/dashboard/pages/SuperAdminDashboard").then((m) => ({
    default: m.SuperAdminDashboard,
  })),
);

const HospitalAdminDashboard = lazy(() =>
  import("../../features/dashboard/pages/HospitalAdminDashboard").then((m) => ({
    default: m.HospitalAdminDashboard,
  })),
);

const DoctorDashboard = lazy(() =>
  import("../../features/dashboard/pages/DoctorDashboard").then((m) => ({
    default: m.DoctorDashboard,
  })),
);

const NurseDashboard = lazy(() =>
  import("../../features/dashboard/pages/NurseDashboard").then((m) => ({
    default: m.NurseDashboard,
  })),
);

const ReceptionDashboard = lazy(() =>
  import("../../features/dashboard/pages/ReceptionDashboard").then((m) => ({
    default: m.ReceptionDashboard,
  })),
);

const AccountantDashboard = lazy(() =>
  import("../../features/dashboard/pages/AccountantDashboard").then((m) => ({
    default: m.AccountantDashboard,
  })),
);

const PatientDashboard = lazy(() =>
  import("../../features/dashboard/pages/PatientDashboard").then((m) => ({
    default: m.PatientDashboard,
  })),
);

export function DashboardDispatcher() {
  const user = useAuthStore((s) => s.user);
  const portal = usePatientPortal();

  if (!user || !user.role) {
    return <HospitalAdminDashboard />;
  }

  const role = String(user.role).toUpperCase();
  switch (role) {
    case "SUPER_ADMIN":
    case "SUPER-ADMIN":
      return <SuperAdminDashboard />;

    case "ADMIN":
    case "HOSPITAL_ADMIN":
    case "HOSPITAL-ADMIN":
      return <HospitalAdminDashboard />;

    case "DOCTOR":
      return <DoctorDashboard />;

    case "NURSE":
      return <NurseDashboard />;

    case "RECEPTIONIST":
      return <ReceptionDashboard />;

    case "ACCOUNTANT":
      return <AccountantDashboard />;

    case "PATIENT":
      return (
        <PatientDashboard
          activePatient={portal?.activePatient || undefined}
          familyMembers={portal?.familyMembers || []}
          onSwitchPatient={(member) => portal?.switchToPatient(member)}
        />
      );

    default:
      return <HospitalAdminDashboard />;
  }
}
