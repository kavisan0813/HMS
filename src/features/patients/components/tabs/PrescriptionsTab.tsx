import { useState, useEffect } from "react";
import { Eye, Printer, RotateCcw, Pill } from "lucide-react";
import type {
  Patient,
  ApiPatientPrescription,
} from "../../types/patient.types";
import { PP, RB } from "../../../doctors/constants/doctors.constants";
import { patientsApi } from "../../api/patient.api";
import { PrescriptionDetailsModal } from "./PrescriptionDetailsModal";
import { DataTable } from "../../../../common/components/DataTable";

export interface PrescriptionsTabProps {
  patient: Patient;
  canEdit: boolean;
  isOwnProfile: boolean;
}

function formatIssueDate(rawDate?: string): string {
  if (!rawDate || rawDate === "—") return "—";
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return rawDate;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (err) {
    console.log(err);
    return rawDate;
  }
}

function getDisplayPrescriptionId(rx: ApiPatientPrescription): string {
  if (rx.prescriptionId && rx.prescriptionId.trim())
    return rx.prescriptionId.trim();
  const idStr = String(rx.id || "").trim();
  if (idStr.startsWith("RX-")) return idStr;
  if (/^\d{8}-\d{4}$/.test(idStr)) return `RX-${idStr}`;
  return idStr ? `RX-${idStr}` : "RX-20260826-0000";
}

function getDisplayEncounterId(
  rx: ApiPatientPrescription,
  displayRxId: string,
): string {
  const obj = rx as unknown as Record<string, unknown>;
  if (obj.encounterId && String(obj.encounterId).trim()) {
    const enc = String(obj.encounterId).trim();
    return enc.startsWith("ENC-") ? enc : `ENC-${enc}`;
  }
  if (obj.encounterNumber && String(obj.encounterNumber).trim()) {
    const enc = String(obj.encounterNumber).trim();
    return enc.startsWith("ENC-") ? enc : `ENC-${enc}`;
  }
  return `ENC-${displayRxId}`;
}

function getMedicineCount(rx: ApiPatientPrescription): number {
  const obj = rx as unknown as Record<string, unknown>;
  if (Array.isArray(rx.medicines) && rx.medicines.length > 0) {
    return rx.medicines.length;
  }
  if (
    Array.isArray(obj.medications) &&
    (obj.medications as unknown[]).length > 0
  ) {
    return (obj.medications as unknown[]).length;
  }
  if (Array.isArray(obj.items) && (obj.items as unknown[]).length > 0) {
    return (obj.items as unknown[]).length;
  }
  if (typeof rx.medicineCount === "number" && rx.medicineCount > 0) {
    return rx.medicineCount;
  }
  if (
    typeof obj.totalMedicines === "number" &&
    (obj.totalMedicines as number) > 0
  ) {
    return obj.totalMedicines as number;
  }
  if (
    typeof obj.medicationCount === "number" &&
    (obj.medicationCount as number) > 0
  ) {
    return obj.medicationCount as number;
  }
  return typeof rx.medicineCount === "number" ? rx.medicineCount : 0;
}

function renderStatusBadge(status?: string) {
  const s = (status || "FINALIZED").toUpperCase().trim();
  let badgeStyle = "bg-emerald-50 text-emerald-600 border-emerald-200";
  let displayLabel = status || "Completed";

  if (s === "DRAFT" || s === "PENDING") {
    badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
    displayLabel = s === "DRAFT" ? "Draft" : "Pending";
  } else if (s === "CANCELLED" || s === "ARCHIVED") {
    badgeStyle = "bg-red-50 text-red-600 border-red-200";
    displayLabel = s === "CANCELLED" ? "Cancelled" : "Archived";
  } else if (
    s === "COMPLETED" ||
    s === "FINALIZED" ||
    s === "ISSUED" ||
    s === "ACTIVE"
  ) {
    badgeStyle = "bg-emerald-50 text-emerald-600 border-emerald-200";
    displayLabel =
      s === "COMPLETED"
        ? "Completed"
        : s === "FINALIZED"
          ? "Finalized"
          : "Issued";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeStyle}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {displayLabel}
    </span>
  );
}

export function PatientPrescriptionsTab({
  patient,
  isOwnProfile,
}: PrescriptionsTabProps) {
  const [prescriptions, setPrescriptions] = useState<ApiPatientPrescription[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [prevMrn, setPrevMrn] = useState<string | null>(null);
  const [selectedPrescription, setSelectedPrescription] =
    useState<ApiPatientPrescription | null>(null);

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  if (patient.mrn !== prevMrn) {
    setPrevMrn(patient.mrn);
    setLoading(true);
  }

  useEffect(() => {
    let cancelled = false;
    patientsApi
      .getPrescriptions(patient.mrn)
      .then((data) => {
        if (!cancelled) setPrescriptions(data || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patient.mrn]);

  const safePrescriptions = Array.isArray(prescriptions) ? prescriptions : [];

  const filtered = safePrescriptions.filter((rx) => {
    if (
      isOwnProfile &&
      (rx.status === "Cancelled" || rx.status === "Archived")
    ) {
      return false;
    }
    if (statusFilter !== "ALL") {
      const rxStatus = (rx.status || "FINALIZED").toUpperCase();
      if (rxStatus !== statusFilter) return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const rxId = getDisplayPrescriptionId(rx).toLowerCase();
      const encId = getDisplayEncounterId(rx, rxId).toLowerCase();
      const docName = (rx.doctorName || "").toLowerCase();
      const dept = (rx.department || "").toLowerCase();
      return (
        rxId.includes(term) ||
        encId.includes(term) ||
        docName.includes(term) ||
        dept.includes(term)
      );
    }
    return true;
  });

  const isFilterActive = searchTerm.trim() !== "" || statusFilter !== "ALL";

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-xs text-[#64748B]">
        Loading prescriptions...
      </div>
    );
  }

  return (
    <div className="space-y-4" style={{ fontFamily: RB }}>
      {/* Main Table View using common DataTable */}
      <DataTable<ApiPatientPrescription>
        data={filtered}
        columns={[
          {
            key: "id",
            label: "PRESCRIPTION ID",
            sortable: true,
            getValue: (rx) => getDisplayPrescriptionId(rx),
            render: (rx) => {
              const displayRxId = getDisplayPrescriptionId(rx);
              return (
                <button
                  type="button"
                  onClick={() => setSelectedPrescription(rx)}
                  className="font-mono font-bold text-[#0D47A1] hover:underline text-left cursor-pointer"
                >
                  {displayRxId}
                </button>
              );
            },
          },
          {
            key: "encounterId",
            label: "ENCOUNTER ID",
            sortable: true,
            getValue: (rx) =>
              getDisplayEncounterId(rx, getDisplayPrescriptionId(rx)),
            render: (rx) => (
              <span className="font-mono font-medium text-slate-700">
                {getDisplayEncounterId(rx, getDisplayPrescriptionId(rx))}
              </span>
            ),
          },
          {
            key: "date",
            label: "ISSUE DATE",
            sortable: true,
            getValue: (rx) => rx.date || "",
            render: (rx) => (
              <span className="text-slate-700 font-medium">
                {formatIssueDate(rx.date)}
              </span>
            ),
          },
          {
            key: "doctorName",
            label: "DOCTOR NAME",
            sortable: true,
            getValue: (rx) => rx.doctorName || "Doctor",
            render: (rx) => (
              <span className="font-bold text-[#111827]">
                {rx.doctorName || "Doctor"}
              </span>
            ),
          },
          {
            key: "medicines",
            label: "TOTAL MEDICINES",
            sortable: true,
            getValue: (rx) => getMedicineCount(rx),
            render: (rx) => {
              const medCount = getMedicineCount(rx);
              return (
                <span className="font-semibold text-[#009688]">
                  {medCount} Medicine{medCount !== 1 ? "s" : ""}
                </span>
              );
            },
          },
          {
            key: "status",
            label: "STATUS",
            sortable: true,
            getValue: (rx) => rx.status || "",
            render: (rx) => renderStatusBadge(rx.status),
          },
          {
            key: "actions",
            label: "ACTIONS",
            sortable: false,
            align: "right",
            render: (rx) => (
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedPrescription(rx)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0D47A1] text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  style={{ fontFamily: PP }}
                >
                  <Eye size={14} /> View
                </button>
                <button
                  type="button"
                  aria-label="Print Prescription"
                  onClick={() => {
                    setSelectedPrescription(rx);
                    setTimeout(() => window.print(), 300);
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                  title="Print Prescription"
                >
                  <Printer size={15} />
                </button>
              </div>
            ),
          },
        ]}
        getRowId={(rx) => rx.id}
        title="Prescription Records"
        subtitle="Complete record of doctor prescriptions, dosages, and issue history."
        headerBadge={
          <span className="text-xs font-semibold text-[#0D47A1] bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 font-mono">
            {filtered.length} Prescriptions
          </span>
        }
        searchable={true}
        searchPlaceholder=" Search by Prescription ID, Doctor, Department or Medicine..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        toolbar={
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">
                Filter Status:
              </span>
              <select
                aria-label="Status filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-[#0D47A1] cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="FINALIZED">Finalized</option>
                <option value="ISSUED">Issued</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            {isFilterActive && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-semibold text-[#0D47A1] hover:underline px-2 py-1 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} /> Clear Filters
              </button>
            )}
          </div>
        }
        emptyTitle="No prescription records found"
        emptySubtitle="No prescription records match your search criteria or status filter."
        emptyIcon={<Pill size={28} />}
        emptyAction={
          isFilterActive ? (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-[#0D47A1] text-white text-xs font-semibold rounded-xl hover:bg-[#0c3d8a] cursor-pointer"
              style={{ fontFamily: PP }}
            >
              Clear Filters
            </button>
          ) : undefined
        }
        pagination={true}
      />

      {/* Prescription Detail & Print Modal */}
      <PrescriptionDetailsModal
        prescriptionId={selectedPrescription?.id ?? null}
        initialData={selectedPrescription}
        patient={patient}
        isOpen={Boolean(selectedPrescription)}
        onClose={() => setSelectedPrescription(null)}
      />
    </div>
  );
}
