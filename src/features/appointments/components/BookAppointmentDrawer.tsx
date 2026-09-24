import { lazy, Suspense } from "react";
import type { AppointmentRecord } from "../types/appointment.types";

const BookAppointmentScreen = lazy(() =>
  import("../pages/BookAppointmentScreen").then((m) => ({
    default: m.BookAppointmentScreen,
  })),
);

export function BookAppointmentDrawer({
  isOpen,
  onClose,
  onBookSuccess,
  onPatientSelect,
  onRegisterNewPatientClick,
}: {
  isOpen: boolean;
  onClose: () => void;
  onBookSuccess: (newApt: AppointmentRecord) => void;
  onPatientSelect?: (id: number | string) => void;
  onRegisterNewPatientClick?: () => void;
  isWalkInPreset?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F1F5F9] w-full min-h-full">
      <Suspense
        fallback={
          <div className="flex min-h-75 items-center justify-center text-sm text-slate-500">
            Loading appointment booking...
          </div>
        }
      >
        <BookAppointmentScreen
          role="receptionist"
          onBack={onClose}
          onRegisterNewPatientClick={() => {
            onClose();
            if (onRegisterNewPatientClick) onRegisterNewPatientClick();
          }}
          onBookSuccess={(apt: AppointmentRecord) => {
            if (onBookSuccess) onBookSuccess(apt);
            onClose();
          }}
          onPatientSelect={(mrn: string) => {
            if (onPatientSelect) onPatientSelect(mrn);
          }}
        />
      </Suspense>
    </div>
  );
}
