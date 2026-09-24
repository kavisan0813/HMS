import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useAuthStore } from "../../auth/store/auth.store";
import { usePatientPortal } from "../../patients/context/usePatientPortal";
import {
  usePrescription,
  usePrescriptionDetails,
  usePrescriptionFilters,
  usePrescriptionActions,
} from "../hooks/usePrescription";
import type { UnifiedPrescription } from "../types/prescription.types";

// Extracted Subcomponents
import { PrescriptionHeader } from "../components/PrescriptionHeader";
import { PrescriptionSummaryCard } from "../components/PrescriptionSummaryCard";
import { PrescriptionFilters } from "../components/PrescriptionFilters";
import { PrescriptionTable } from "../components/PrescriptionTable";
import { PrescriptionLoader } from "../components/PrescriptionLoader";
import { PrescriptionEmptyState } from "../components/PrescriptionEmptyState";
import {
  PrescriptionDetailsModal,
  PrescriptionPrintModal,
} from "../components/PrescriptionPreview";

const RB = "'Roboto', system-ui, sans-serif";

export const PrescriptionManagementPage: React.FC<{
  onNewPrescription?: () => void;
  onViewConsultation?: (consultId: string) => void;
}> = ({ onNewPrescription, onViewConsultation }) => {
  const user = useAuthStore((s) => s.user);
  const roleRaw = String(user?.role ?? "").toUpperCase();

  const role: "patient" | "doctor" | "admin" =
    roleRaw === "PATIENT"
      ? "patient"
      : roleRaw === "DOCTOR"
        ? "doctor"
        : "admin";

  const portal = usePatientPortal();
  const activePatient = portal?.activePatient || undefined;
  const patientName = activePatient?.patientName || user?.fullName || "Patient";
  const activeMrn =
    role === "patient"
      ? activePatient?.mrn || user?.patientId || ""
      : undefined;

  // Filter doctor prescriptions by name if in doctor role
  const doctorNameFilter = role === "doctor" ? user?.fullName : undefined;

  const { prescriptions, loading, toastMsg, showToast, triggerRefresh } =
    usePrescription(activeMrn, doctorNameFilter);

  const { selectedPrescription, loadDetails, closeDetails } =
    usePrescriptionDetails();

  const { filters, setFilterValue, resetFilters } = usePrescriptionFilters();

  const { handlePrint, handleDownload, handleDuplicate } =
    usePrescriptionActions(showToast);

  // Modal view states
  const [fullViewRx, setFullViewRx] = useState<UnifiedPrescription | null>(
    null,
  );
  const [printPreviewRx, setPrintPreviewRx] =
    useState<UnifiedPrescription | null>(null);

  const handleResetAll = () => {
    resetFilters();
  };

  const handleApply = () => {
    triggerRefresh();
  };

  if (fullViewRx) {
    return (
      <PrescriptionDetailsModal
        prescription={selectedPrescription || fullViewRx}
        onClose={() => {
          setFullViewRx(null);
          closeDetails();
        }}
        onDownload={() => handleDownload(fullViewRx.id)}
      />
    );
  }

  return (
    <div
      className="flex-1 bg-[#F1F5F9] overflow-y-auto flex flex-col font-sans relative p-6 space-y-6 pb-20"
      style={{ fontFamily: RB }}
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#111827] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 transition-opacity duration-200">
          <CheckCircle2 size={16} className="text-[#66BB6A]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header component */}
      <PrescriptionHeader
        role={role}
        patientName={patientName}
        onNewPrescription={onNewPrescription}
      />

      {/* KPI Cards */}
      <PrescriptionSummaryCard role={role} prescriptions={prescriptions} />

      {/* Filter Toolbar (Only for Doctor/Admin, Patient filters are embedded directly inside DataTable) */}
      {role !== "patient" && (
        <PrescriptionFilters
          role={role}
          searchTerm={filters.searchTerm}
          setSearchTerm={(val) => setFilterValue("searchTerm", val)}
          selectedStatus={filters.status}
          setSelectedStatus={(val) => setFilterValue("status", val)}
          selectedDept={filters.dept}
          setSelectedDept={(val) => setFilterValue("dept", val)}
          dateRange={filters.dateRange}
          setDateRange={(val) => setFilterValue("dateRange", val)}
          onReset={handleResetAll}
          onApply={handleApply}
        />
      )}

      {/* Data list / table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
          <PrescriptionLoader />
        </div>
      ) : role !== "patient" && prescriptions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
          <PrescriptionEmptyState onReset={handleResetAll} />
        </div>
      ) : (
        <PrescriptionTable
          role={role}
          prescriptions={prescriptions}
          onView={(rx) => {
            setFullViewRx(rx);
            loadDetails(rx.id);
          }}
          onEdit={onNewPrescription}
          onPrint={(rx) => setPrintPreviewRx(rx)}
          onDownload={handleDownload}
          onDuplicate={handleDuplicate}
          onViewConsultation={onViewConsultation}
          searchTerm={filters.searchTerm}
          setSearchTerm={(val) => setFilterValue("searchTerm", val)}
          selectedStatus={filters.status}
          setSelectedStatus={(val) => setFilterValue("status", val)}
          selectedDept={filters.dept}
          setSelectedDept={(val) => setFilterValue("dept", val)}
          dateRange={filters.dateRange}
          setDateRange={(val) => setFilterValue("dateRange", val)}
          onReset={handleResetAll}
        />
      )}

      {/* Print Preview Modal */}
      {printPreviewRx && (
        <PrescriptionPrintModal
          prescription={printPreviewRx}
          onClose={() => setPrintPreviewRx(null)}
          onPrint={() => {
            handlePrint(printPreviewRx.id);
            setPrintPreviewRx(null);
          }}
        />
      )}
    </div>
  );
};
