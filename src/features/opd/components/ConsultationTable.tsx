import React, { useMemo } from "react";
import {
  Stethoscope,
  Calendar,
  UserCheck,
  Building,
  Filter,
  Tag,
  RotateCcw,
} from "lucide-react";
import type { ConsultationRecord, OauthRole } from "../types/consultation";
import { StatusChip } from "./StatusChip";
import { ConsultationActionMenu } from "./ConsultationActionMenu";
import { DataTable, type Column } from "../../../common/components/DataTable";

const PP = "'Poppins', system-ui, sans-serif";

export interface ConsultationTableProps {
  role: OauthRole;
  filteredConsultations: ConsultationRecord[];
  isLoading: boolean;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  filterDate?: string;
  onDateChange?: (val: string) => void;
  filterDoctor?: string;
  onDoctorChange?: (val: string) => void;
  filterDepartment?: string;
  onDepartmentChange?: (val: string) => void;
  filterStatus?: string;
  onStatusChange?: (val: string) => void;
  filterVisitType?: string;
  onVisitTypeChange?: (val: string) => void;
  doctorOptions?: Array<{ value: string; label: string }>;
  departmentOptions?: Array<{ value: string; label: string }>;
  visibleFilters?: Array<"status" | "visitType" | "doctor" | "department">;
  onStartConsultation?: (id: string) => void;
  onOpenConsultation?: (id: string) => void;
  onCallPatient?: (item: ConsultationRecord) => void;
  onCancelConsultation?: (item: ConsultationRecord) => void;
  onViewDetails?: (id: string) => void;
  onViewHistory?: (mrn: string) => void;
  onPatientSelect?: (mrn: string) => void;
  onPrint?: (item: ConsultationRecord) => void;
  onResetFilters: () => void;
  canStartConsultation?: boolean;
  canPrint?: boolean;
  calledPatientIds?: Set<string>;
}

const visitTypeColors: Record<string, string> = {
  "First Visit": "bg-blue-50 text-blue-700",
  Walk: "bg-amber-50 text-amber-700",
  "Walk-In": "bg-amber-50 text-amber-700",
  Follow: "bg-purple-50 text-purple-700",
  "Follow-up": "bg-purple-50 text-purple-700",
};

const getVisitTypeColor = (visitType: string): string => {
  return visitTypeColors[visitType] || "bg-slate-100 text-slate-600";
};

interface FormattableAppointmentItem extends Partial<ConsultationRecord> {
  appointmentNumber?: string | number;
  appointmentCode?: string | number;
  appointmentNo?: string | number;
  apptNumber?: string | number;
  apptId?: string | number;
  appointmentDate?: string;
  createdAt?: string;
}

const formatAppointmentFormattedId = (
  item?: FormattableAppointmentItem | null,
): string => {
  if (!item) return "—";
  const rawNum =
    item.appointmentNumber ||
    item.appointmentCode ||
    item.appointmentNo ||
    item.apptNumber;

  if (rawNum && typeof rawNum === "string" && rawNum.trim()) {
    const s = rawNum.trim().toUpperCase();
    if (s.startsWith("APT-")) return s;
    return `APT-${s}`;
  }

  const idVal =
    item.appointmentId ||
    item.apptId ||
    item.id ||
    item.tokenNo ||
    item.queueNumber;

  if (!idVal || idVal === "—") return "—";

  const strVal = String(idVal).trim();
  if (strVal.toUpperCase().startsWith("APT-")) {
    return strVal.toUpperCase();
  }

  const numStr = strVal.replace(/\D+/g, "");

  const rawDate =
    item.appointmentDate ||
    item.visitDate ||
    item.date ||
    item.createdAt ||
    new Date().toISOString().split("T")[0];

  const dateClean = String(rawDate).replace(/\D+/g, "").slice(0, 8);
  const formattedDate = dateClean.length === 8 ? dateClean : "20260828";
  const paddedNum = numStr ? numStr.padStart(4, "0").slice(-4) : "0001";

  return `APT-${formattedDate}-${paddedNum}`;
};

export const ConsultationTable: React.FC<ConsultationTableProps> = ({
  role,
  filteredConsultations,
  isLoading,
  searchQuery = "",
  onSearchChange,
  filterDate = "",
  onDateChange,
  filterDoctor = "All",
  onDoctorChange,
  filterDepartment = "All",
  onDepartmentChange,
  filterStatus = "All",
  onStatusChange,
  filterVisitType = "All",
  onVisitTypeChange,
  doctorOptions = [],
  departmentOptions = [],
  visibleFilters = ["status", "visitType", "doctor", "department"],
  onStartConsultation,
  onOpenConsultation,
  onCallPatient,
  onCancelConsultation,
  onViewDetails,
  onResetFilters,
  canStartConsultation,
  calledPatientIds,
}) => {
  const roleStr = String(role || "").toLowerCase();
  const isDoctorRole = roleStr === "doctor";
  const isRoleAdmin = roleStr.includes("admin");

  const hasFilter = (
    filter: "status" | "visitType" | "doctor" | "department",
  ) => visibleFilters.includes(filter);

  const columns: Column<ConsultationRecord>[] = useMemo(
    () => [
      {
        key: "tokenNo",
        label: "TOKEN",
        sortable: true,
        getValue: (item) => String(item.tokenNo || item.queueNumber || "—"),
        render: (item) => (
          <span className="font-mono text-xs font-bold text-[#0D47A1]">
            {String(item.tokenNo || item.queueNumber || "—")}
          </span>
        ),
      },
      {
        key: "patientName",
        label: "PATIENT",
        sortable: true,
        getValue: (item) => item.patientName,
        render: (item) => (
          <div>
            <span
              className="font-bold text-[#111827] block text-xs"
              style={{ fontFamily: PP }}
            >
              {item.patientName}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              MRN: {item.mrn}
            </span>
          </div>
        ),
      },
      {
        key: "doctorName",
        label: "DOCTOR & DEPT",
        sortable: true,
        getValue: (item) => item.doctorName || item.doctor,
        render: (item) => (
          <div>
            <span className="font-semibold text-slate-800 block text-xs">
              {item.doctorName || item.doctor}
            </span>
            <span className="text-[10px] text-slate-500">
              {item.department}
            </span>
          </div>
        ),
      },
      {
        key: "appointmentId",
        label: "APPOINTMENT ID",
        sortable: true,
        getValue: (item) => formatAppointmentFormattedId(item),
        render: (item) => (
          <span className="font-mono text-xs font-semibold text-[#0D47A1]">
            {formatAppointmentFormattedId(item)}
          </span>
        ),
      },
      {
        key: "visitType",
        label: "VISIT TYPE",
        sortable: true,
        getValue: (item) => item.visitType,
        render: (item) => (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getVisitTypeColor(item.visitType)}`}
          >
            {item.visitType}
          </span>
        ),
      },
      {
        key: "consultationTime",
        label: "TIME",
        sortable: true,
        getValue: (item) =>
          String(item.appointmentTime || item.time || item.date || "—"),
        render: (item) => (
          <span className="font-mono text-xs text-slate-600">
            {String(item.appointmentTime || item.time || item.date || "—")}
          </span>
        ),
      },
      {
        key: "status",
        label: "STATUS",
        sortable: true,
        getValue: (item) => item.status,
        render: (item) => <StatusChip status={item.status} />,
      },
      {
        key: "actions",
        label: "ACTIONS",
        sortable: false,
        align: "right",
        visible: !isRoleAdmin,
        render: (item) => (
          <div onClick={(e) => e.stopPropagation()}>
            <ConsultationActionMenu
              item={item}
              role={role}
              onStartConsultation={onStartConsultation}
              onOpenConsultation={onOpenConsultation}
              onCallPatient={onCallPatient}
              onCancelConsultation={onCancelConsultation}
              onViewDetails={onViewDetails}
              canStartConsultation={isDoctorRole ? true : canStartConsultation}
              calledPatientIds={calledPatientIds}
            />
          </div>
        ),
      },
    ],
    [
      isDoctorRole,
      isRoleAdmin,
      role,
      onStartConsultation,
      onOpenConsultation,
      onCallPatient,
      onCancelConsultation,
      onViewDetails,
      canStartConsultation,
      calledPatientIds,
    ],
  );

  const toolbar = (
    <div className="bg-slate-50/80 border border-[#E5E7EB] rounded-xl p-2.5 space-y-2 shadow-2xs text-xs">
      <div className="flex items-center gap-2 flex-wrap">
        {onDateChange && (
          <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
            <Calendar size={13} className="text-slate-400" />
            <span className="text-slate-400 text-[11px]">Date:</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
            />
          </div>
        )}

        {hasFilter("doctor") && onDoctorChange && doctorOptions.length > 0 && (
          <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
            <UserCheck size={13} className="text-slate-400" />
            <span className="text-slate-400 text-[11px]">Doctor:</span>
            <select
              aria-label="Doctor filter"
              value={filterDoctor}
              onChange={(e) => onDoctorChange(e.target.value)}
              className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
            >
              {doctorOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {hasFilter("department") &&
          onDepartmentChange &&
          departmentOptions.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
              <Building size={13} className="text-slate-400" />
              <span className="text-slate-400 text-[11px]">Department:</span>
              <select
                aria-label="Department filter"
                value={filterDepartment}
                onChange={(e) => onDepartmentChange(e.target.value)}
                className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
              >
                {departmentOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

        {hasFilter("status") && onStatusChange && (
          <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
            <Filter size={13} className="text-slate-400" />
            <span className="text-slate-400 text-[11px]">Status:</span>
            <select
              aria-label="Status filter"
              value={filterStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
            >
              <option value="All">All Statuses</option>
              <option value="Waiting">Waiting</option>
              <option value="In Consultation">In Consultation</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        )}

        {hasFilter("visitType") && onVisitTypeChange && (
          <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
            <Tag size={13} className="text-slate-400" />
            <span className="text-slate-400 text-[11px]">Visit Type:</span>
            <select
              aria-label="Visit type filter"
              value={filterVisitType}
              onChange={(e) => onVisitTypeChange(e.target.value)}
              className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
            >
              <option value="All">All Visit Types</option>
              <option value="First Visit">First Visit</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Walk-In">Walk-In</option>
            </select>
          </div>
        )}

        <button
          onClick={onResetFilters}
          className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs shrink-0 ml-auto"
          style={{ fontFamily: PP }}
        >
          <RotateCcw size={12} /> Clear Filters
        </button>
      </div>
    </div>
  );

  return (
    <DataTable<ConsultationRecord>
      data={filteredConsultations}
      columns={columns}
      loading={isLoading}
      getRowId={(item) => item.id}
      onRowClick={(item) => onViewDetails?.(item.id)}
      title="OPD Consultations"
      subtitle="Outpatient encounter records and consultation status roster."
      headerBadge={
        <span className="text-xs font-semibold text-[#0D47A1] bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 font-mono">
          {filteredConsultations.length} Consultations
        </span>
      }
      searchable={true}
      searchPlaceholder=" Search by Patient Name, MRN, Consultation ID, Doctor..."
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      toolbar={toolbar}
      emptyTitle="No consultation records available."
      emptySubtitle="There are no matching consultation records for the selected operational filters."
      emptyIcon={<Stethoscope size={28} />}
      emptyAction={
        <button
          onClick={onResetFilters}
          className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 cursor-pointer"
          style={{ fontFamily: PP }}
        >
          Reset Filters
        </button>
      }
      pagination={true}
    />
  );
};
