import { lazy, Suspense } from "react";
import { useAuthStore } from "../../auth/store/auth.store";

const AppointmentManagementCenterScreen = lazy(() =>
  import("../../appointments/pages/AppointmentManagementCenterScreen").then(
    (m) => ({
      default: m.AppointmentManagementCenterScreen,
    }),
  ),
);

export function DoctorAppointmentsScreen({
  onStartConsultation,
}: {
  onStartConsultation?: (id: number) => void;
}) {
  const { user } = useAuthStore();
  const doctorId =
    user?.doctorProfile?.doctorId ??
    user?.doctorId ??
    (String(user?.role || "").toUpperCase() === "DOCTOR"
      ? user?.id
      : undefined);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-100 items-center justify-center text-sm text-slate-500">
          Loading appointments...
        </div>
      }
    >
      <AppointmentManagementCenterScreen
        userRole="Doctor"
        doctorId={doctorId}
        onStartConsultation={() => onStartConsultation?.(1)}
      />
    </Suspense>
  );
}
