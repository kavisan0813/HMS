import React, { useState } from "react";
import {
  Eye,
  Printer,
  Download,
  Edit3,
  ChevronDown,
  Plus,
  FileText,
  Clock,
  Pill,
  Calendar,
  Filter,
  RotateCcw,
} from "lucide-react";
import type { UnifiedPrescription } from "../types/prescription.types";
import { PrescriptionStatusBadge } from "./PrescriptionStatusBadge";
import { DataTable } from "../../../common/components/DataTable";

const PP = "'Poppins', system-ui, sans-serif";

const Avatar: React.FC<{ name: string }> = ({ name }) => {
  const initials =
    name
      .split(" ")
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "P";
  return (
    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
      {initials}
    </div>
  );
};

interface PrescriptionTableProps {
  role: "patient" | "doctor" | "admin";
  prescriptions: UnifiedPrescription[];
  onView: (rx: UnifiedPrescription) => void;
  onEdit?: (rxId: string) => void;
  onPrint: (rx: UnifiedPrescription) => void;
  onDownload: (rxId: string) => void;
  onDuplicate?: (rxId: string) => void;
  onViewHistory?: (mrn: string) => void;
  onViewConsultation?: (consultId: string) => void;
  searchTerm?: string;
  setSearchTerm?: (val: string) => void;
  selectedStatus?: string;
  setSelectedStatus?: (val: string) => void;
  selectedDept?: string;
  setSelectedDept?: (val: string) => void;
  dateRange?: string;
  setDateRange?: (val: string) => void;
  onReset?: () => void;
}

export const PrescriptionTable: React.FC<PrescriptionTableProps> = ({
  role,
  prescriptions,
  onView,
  onEdit,
  onPrint,
  onDownload,
  onDuplicate,
  onViewHistory,
  onViewConsultation,
  searchTerm = "",
  setSearchTerm,
  selectedStatus = "All",
  setSelectedStatus,
  dateRange = "All",
  setDateRange,
  onReset,
}) => {
  const [openMoreMenuId, setOpenMoreMenuId] = useState<string | null>(null);

  const formatDateTimeDisplay = (rawStr?: string) => {
    if (!rawStr || rawStr === "—") return "—";
    try {
      const d = new Date(rawStr);
      if (isNaN(d.getTime())) return rawStr;
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (err) {
      console.log(err);
      return rawStr;
    }
  };

  if (role === "patient") {
    const hasActiveFilters =
      Boolean(searchTerm) || selectedStatus !== "All" || dateRange !== "All";

    return (
      <DataTable<UnifiedPrescription>
        data={prescriptions}
        columns={[
          {
            key: "prescriptionId",
            label: "PRESCRIPTION ID",
            sortable: true,
            getValue: (rx) => rx.prescriptionId || rx.id,
            render: (rx) => {
              const displayRxId = rx.prescriptionId || rx.id;
              return (
                <button
                  onClick={() => onView(rx)}
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
              rx.encounterId
                ? `ENC-${rx.encounterId}`
                : rx.encounterNumber || (rx.id ? `ENC-${rx.id}` : "—"),
            render: (rx) => {
              const displayEncId = rx.encounterId
                ? `ENC-${rx.encounterId}`
                : rx.encounterNumber || (rx.id ? `ENC-${rx.id}` : "—");
              return (
                <span className="font-mono font-medium text-slate-700">
                  {displayEncId}
                </span>
              );
            },
          },
          {
            key: "date",
            label: "ISSUE DATE",
            sortable: true,
            getValue: (rx) => rx.consultationDate || rx.date || "",
            render: (rx) => (
              <span className="text-slate-700 font-medium">
                {formatDateTimeDisplay(rx.consultationDate || rx.date)}
              </span>
            ),
          },
          {
            key: "doctorName",
            label: "DOCTOR NAME",
            sortable: true,
            getValue: (rx) => rx.doctorName || "Attending Doctor",
            render: (rx) => (
              <span
                className="font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                {rx.doctorName || "Attending Doctor"}
              </span>
            ),
          },
          {
            key: "totalMedicines",
            label: "TOTAL MEDICINES",
            sortable: true,
            getValue: (rx) =>
              rx.medicines && rx.medicines.length > 0
                ? rx.medicines.length
                : rx.totalMedicines || rx.medicineCount || 0,
            render: (rx) => {
              const medCount =
                rx.medicines && rx.medicines.length > 0
                  ? rx.medicines.length
                  : rx.totalMedicines || rx.medicineCount || 0;
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
            getValue: (rx) => rx.status,
            render: (rx) => <PrescriptionStatusBadge status={rx.status} />,
          },
          {
            key: "actions",
            label: "ACTIONS",
            sortable: false,
            align: "right",
            render: (rx) => (
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={() => onView(rx)}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#0D47A1] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  style={{ fontFamily: PP }}
                >
                  <Eye size={13} /> View
                </button>
                <button
                  aria-label="Print Prescription"
                  onClick={() => onPrint(rx)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  <Printer size={14} />
                </button>
              </div>
            ),
          },
        ]}
        getRowId={(rx) => rx.id}
        title="My Prescriptions"
        subtitle="Complete digital record of doctor prescriptions, medication dosages, and issue dates."
        headerBadge={
          <span className="text-xs font-semibold text-[#0D47A1] bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 font-mono">
            {prescriptions.length} Prescriptions
          </span>
        }
        searchable={true}
        searchPlaceholder=" Search by Prescription ID, Doctor, Department, Diagnosis or Medicine..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        toolbar={
          <div className="bg-slate-50/80 border border-[#E5E7EB] rounded-xl p-2.5 space-y-2 shadow-2xs text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
                <Calendar size={13} className="text-slate-400" />
                <span className="text-slate-400 text-[11px]">Date:</span>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange?.(e.target.value)}
                  className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
                >
                  <option value="All">All Dates</option>
                  <option value="Today">Today</option>
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
                <Filter size={13} className="text-slate-400" />
                <span className="text-slate-400 text-[11px]">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus?.(e.target.value)}
                  className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
                >
                  <option value="All">All Statuses</option>
                  <option value="Issued">Issued</option>
                  <option value="Completed">Completed</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={onReset}
                  className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs shrink-0 ml-auto"
                  style={{ fontFamily: PP }}
                >
                  <RotateCcw size={12} /> Clear Filters
                </button>
              )}
            </div>
          </div>
        }
        emptyTitle="No Prescriptions Found"
        emptySubtitle="No prescription records match your current filter criteria or search query."
        emptyIcon={<Pill size={28} />}
        emptyAction={
          hasActiveFilters ? (
            <button
              onClick={onReset}
              className="px-4 py-2 bg-[#0D47A1] text-white text-xs font-semibold rounded-xl hover:bg-blue-900 cursor-pointer"
              style={{ fontFamily: PP }}
            >
              Clear All Filters
            </button>
          ) : undefined
        }
        pagination={true}
      />
    );
  }

  // Doctor or Admin View rendered via common DataTable
  return (
    <>
      {openMoreMenuId && (
        <div
          role="presentation"
          className="fixed inset-0 z-20 bg-transparent"
          onClick={() => setOpenMoreMenuId(null)}
        />
      )}
      <DataTable<UnifiedPrescription>
        data={prescriptions}
        columns={[
          {
            key: "id",
            label: "PRESCRIPTION ID",
            sortable: true,
            getValue: (rx) => rx.id,
            render: (rx) => (
              <span className="font-mono font-semibold text-[#0D47A1]">
                {rx.id}
              </span>
            ),
          },
          {
            key: "patientName",
            label: "PATIENT NAME",
            sortable: true,
            getValue: (rx) => rx.patientName || "Patient",
            render: (rx) => (
              <div className="flex items-center gap-2 font-semibold text-[#111827]">
                <Avatar name={rx.patientName || "Patient"} />
                <span>{rx.patientName || "Patient"}</span>
              </div>
            ),
          },
          {
            key: "mrn",
            label: "MRN",
            sortable: true,
            getValue: (rx) => rx.mrn || "",
            render: (rx) => (
              <span className="font-mono text-slate-600 font-medium">
                {rx.mrn || "—"}
              </span>
            ),
          },
          {
            key: "consultationId",
            label: "CONSULTATION ID",
            sortable: true,
            getValue: (rx) => rx.consultationId || "",
            render: (rx) =>
              rx.consultationId ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewConsultation?.(rx.consultationId);
                  }}
                  className="font-mono hover:underline hover:text-[#0D47A1] text-slate-600 font-medium cursor-pointer"
                >
                  {rx.consultationId}
                </button>
              ) : (
                <span className="text-slate-400">—</span>
              ),
          },
          {
            key: "department",
            label: "DEPARTMENT",
            sortable: true,
            getValue: (rx) => rx.department || "",
            render: (rx) => (
              <span className="text-slate-600 font-medium">
                {rx.department || "—"}
              </span>
            ),
          },
          {
            key: "consultationDate",
            label: "CONSULTATION DATE",
            sortable: true,
            getValue: (rx) => rx.consultationDate || "",
            render: (rx) => (
              <span className="text-slate-600 font-medium">
                {rx.consultationDate || "—"}
              </span>
            ),
          },
          {
            key: "medicineCount",
            label: "MEDICINES",
            sortable: true,
            getValue: (rx) => rx.medicineCount || 0,
            render: (rx) => (
              <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md font-medium">
                <Pill size={12} className="text-[#009688]" />
                {rx.medicineCount} Medicines
              </span>
            ),
          },
          {
            key: "followup",
            label: "FOLLOW-UP",
            sortable: true,
            getValue: (rx) => (rx.followup ? `Yes (${rx.followupDate})` : "No"),
            render: (rx) =>
              rx.followup ? (
                <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  Yes ({rx.followupDate})
                </span>
              ) : (
                <span className="text-xs font-medium text-slate-400">No</span>
              ),
          },
          {
            key: "status",
            label: "STATUS",
            sortable: true,
            getValue: (rx) => rx.status,
            render: (rx) => <PrescriptionStatusBadge status={rx.status} />,
          },
          {
            key: "actions",
            label: "ACTIONS",
            sortable: false,
            visible: role !== "admin",
            align: "right",
            render: (rx) => (
              <div
                className="flex items-center justify-end gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => onView(rx)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-[#0D47A1] hover:bg-blue-50 transition-colors cursor-pointer"
                  title="View Full Prescription"
                >
                  <Eye size={14} />
                </button>
                {rx.status === "Draft" ? (
                  <button
                    onClick={() => onEdit?.(rx.id)}
                    className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                    title="Edit Draft Prescription"
                  >
                    <Edit3 size={14} />
                  </button>
                ) : (
                  <button
                    disabled
                    className="p-1.5 text-slate-300 cursor-not-allowed"
                    title="Only Draft prescriptions can be edited"
                  >
                    <Edit3 size={14} />
                  </button>
                )}
                <button
                  onClick={() => onPrint(rx)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                  title="Print Prescription"
                >
                  <Printer size={14} />
                </button>
                <button
                  onClick={() => onDownload(rx.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-[#0D47A1] hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Download PDF"
                >
                  <Download size={14} />
                </button>
                <div className="relative">
                  <button
                    aria-label="Action"
                    onClick={() =>
                      setOpenMoreMenuId(openMoreMenuId === rx.id ? null : rx.id)
                    }
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <ChevronDown size={14} />
                  </button>
                  {openMoreMenuId === rx.id && (
                    <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-30 text-left">
                      <button
                        onClick={() => {
                          setOpenMoreMenuId(null);
                          onDuplicate?.(rx.id);
                        }}
                        className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <Plus size={13} /> Duplicate Prescription
                      </button>
                      <button
                        onClick={() => {
                          setOpenMoreMenuId(null);
                          onViewHistory?.(rx.mrn);
                        }}
                        className="w-full px-3 py-2 text-xs text-[#0D47A1] hover:bg-blue-50 flex items-center gap-2 font-medium cursor-pointer"
                      >
                        <Clock size={13} /> Prescription History
                      </button>
                      {rx.consultationId && (
                        <button
                          onClick={() => {
                            setOpenMoreMenuId(null);
                            onViewConsultation?.(rx.consultationId);
                          }}
                          className="w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <FileText size={13} /> View Consultation
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ),
          },
        ]}
        getRowId={(rx) => rx.id}
        onRowClick={(rx) => onView(rx)}
        title="Prescription Records"
        subtitle="Doctor & clinical prescription workspace"
        headerBadge={
          <span className="text-xs font-semibold text-[#0D47A1] bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 font-mono">
            Showing {prescriptions.length} prescriptions
          </span>
        }
        searchable={true}
        searchPlaceholder=" Search prescription by ID, patient name, MRN, department..."
        pagination={true}
      />
    </>
  );
};
