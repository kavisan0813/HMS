import { useMemo } from "react";
import {
  X,
  Filter,
  RotateCcw,
  Edit,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Users,
  UserCheck,
  Phone,
} from "lucide-react";
import type { Patient } from "../types/patient.types";
import type { PatientFilterValues } from "./PatientFilters";
import { usePermissions } from "../../../permissions/usePermissions";
import { extractDoctorName } from "../api/mapApiPatientToPatientRecord";
import { DataTable, type Column } from "../../../common/components/DataTable";

const PP = "'Poppins', system-ui, sans-serif";
const RB = "'Roboto', system-ui, sans-serif";

function calculateAge(dateOfBirth?: string): number {
  if (!dateOfBirth) return 0;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age : 0;
}

const PATIENT_TABLE_COLORS = [
  "bg-[#0D47A1]",
  "bg-[#009688]",
  "bg-violet-600",
  "bg-rose-500",
  "bg-amber-600",
];

const PATIENT_TABLE_SIZES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

function Avatar({
  name,
  size = "sm",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const color =
    PATIENT_TABLE_COLORS[name.charCodeAt(0) % PATIENT_TABLE_COLORS.length];
  return (
    <div
      className={`${PATIENT_TABLE_SIZES[size]} ${color} rounded-full flex items-center justify-center text-white font-semibold shrink-0 shadow-2xs`}
    >
      {initials}
    </div>
  );
}

/**
 * Integrated Patient Workspace Container built on top of the shared common DataTable.
 */
export function PatientTable({
  patients,
  totalCount,
  isLoading,
  selectedPatientId,
  activeActionMenuId,
  filterValues,
  onFilterChange,
  onResetFilters,
  hasActiveFilters,
  onSelectRow,
  onToggleActionMenu,
  onViewProfile,
  onEditPatient,
  onBookAppointment,
  onActivatePatient,
  onDeactivatePatient,
  userRole,
  doctorMap,
}: {
  patients: Patient[];
  totalCount: number;
  isLoading: boolean;
  selectedPatientId: string | null;
  activeActionMenuId: string | null;
  filterValues?: PatientFilterValues;
  onFilterChange?: (patch: Partial<PatientFilterValues>) => void;
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
  doctorMap?: Record<string | number, string>;
  onSelectRow: (p: Patient) => void;
  onOpenQuickView?: (p: Patient) => void;
  onToggleActionMenu: (id: string | null) => void;
  onViewProfile: (id: string) => void;
  onEditPatient?: (p: Patient) => void;
  onBookAppointment?: (p: Patient) => void;
  onActivatePatient?: (p: Patient) => void;
  onDeactivatePatient?: (p: Patient) => void;
  onViewMedicalHistory?: (id: string) => void;
  onViewAppointments?: (id: string) => void;
  onGenerateBill?: (id: string) => void;
  userRole?: string;
}) {
  const permissions = usePermissions();
  const activeRole = (
    userRole ||
    permissions.role ||
    "RECEPTIONIST"
  ).toUpperCase();

  const isDoctor = activeRole === "DOCTOR";
  const isReceptionist = activeRole === "RECEPTIONIST";
  const canEdit = permissions.can("PATIENT_EDIT");

  // Active filter chips
  const activeFiltersChips = useMemo(() => {
    if (!filterValues) return [];
    const chips: { label: string; clear: () => void }[] = [];
    if (filterValues.searchQuery.trim()) {
      chips.push({
        label: `Search: "${filterValues.searchQuery}"`,
        clear: () => onFilterChange?.({ searchQuery: "" }),
      });
    }
    if (filterValues.genderFilter && filterValues.genderFilter !== "All") {
      chips.push({
        label: `Gender: ${filterValues.genderFilter}`,
        clear: () => onFilterChange?.({ genderFilter: "All" }),
      });
    }
    if (filterValues.statusFilter && filterValues.statusFilter !== "All") {
      chips.push({
        label: `Status: ${filterValues.statusFilter}`,
        clear: () => onFilterChange?.({ statusFilter: "All" }),
      });
    }
    if (
      filterValues.registrationTypeFilter &&
      filterValues.registrationTypeFilter !== "All"
    ) {
      chips.push({
        label: `Type: ${filterValues.registrationTypeFilter}`,
        clear: () => onFilterChange?.({ registrationTypeFilter: "All" }),
      });
    }
    return chips;
  }, [filterValues, onFilterChange]);

  // Column definitions for Patient Management with dynamic role-based visibility
  const columns: Column<Patient>[] = useMemo(
    () => [
      {
        key: "mrn",
        label: "MRN",
        sortable: true,
        getValue: (p) => p.mrn || String(p.id),
        render: (p) => {
          const mrn = p.mrn || String(p.id);
          return (
            <span className="font-mono text-xs font-bold text-[#0D47A1] bg-blue-50 px-2 py-1 rounded border border-blue-100 inline-block shadow-2xs">
              {mrn}
            </span>
          );
        },
      },
      {
        key: "name",
        label: "PATIENT",
        sortable: true,
        getValue: (p) => (p.patientName || p.name || "").toLowerCase(),
        render: (p) => {
          const name = (p.patientName || p.name || "Patient").trim();
          return (
            <div className="flex items-center gap-3">
              <Avatar name={name} size="sm" />
              <span
                className="font-bold text-[#111827] text-xs group-hover:text-[#0D47A1] transition-colors"
                style={{ fontFamily: PP }}
              >
                {name}
              </span>
            </div>
          );
        },
      },
      {
        key: "age_gender",
        label: "AGE/GENDER",
        sortable: true,
        getValue: (p) => {
          const rawP = p as unknown as Record<string, unknown>;
          const dobStr =
            p.dateOfBirth ||
            p.dob ||
            (rawP.birthDate as string) ||
            (rawP.date_of_birth as string) ||
            "";
          return Number(p.age) > 0 ? Number(p.age) : calculateAge(dobStr);
        },
        render: (p) => {
          const rawP = p as unknown as Record<string, unknown>;
          const dobStr =
            p.dateOfBirth ||
            p.dob ||
            (rawP.birthDate as string) ||
            (rawP.date_of_birth as string) ||
            "";
          const calculatedAge = calculateAge(dobStr);
          const age =
            p.age !== undefined && p.age !== null && Number(p.age) > 0
              ? Number(p.age)
              : rawP.patientAge !== undefined && Number(rawP.patientAge) > 0
                ? Number(rawP.patientAge)
                : calculatedAge;
          const gender =
            p.gender === "FEMALE" || p.gender === "F"
              ? "Female"
              : p.gender === "MALE" || p.gender === "M"
                ? "Male"
                : "Other";

          return (
            <span className="text-xs text-slate-700 font-medium">
              {age > 0 ? `${age} Y · ${gender}` : gender}
            </span>
          );
        },
      },
      {
        key: "phone",
        label: "MOBILE",
        sortable: true,
        getValue: (p) => p.phone || "",
        render: (p) => (
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-mono">
            <Phone size={12} className="text-slate-400" />
            {p.phone || "-"}
          </div>
        ),
      },
      {
        key: "email",
        label: "EMAIL",
        sortable: true,
        visible: !isDoctor && !isReceptionist,
        getValue: (p) => p.email || "",
        render: (p) => (
          <span className="text-xs text-slate-700">{p.email || "-"}</span>
        ),
      },
      {
        key: "blood_group",
        label: "BLOOD GROUP",
        sortable: true,
        visible: isDoctor,
        getValue: (p) => p.bloodGroup || "",
        render: (p) => (
          <span className="text-xs font-bold text-[#009688]">
            {p.bloodGroup
              ? p.bloodGroup
                  .replace("_POSITIVE", "+")
                  .replace("_NEGATIVE", "-")
                  .replace("UNKNOWN", "N/A")
              : "-"}
          </span>
        ),
      },
      {
        key: "category",
        label: "CATEGORY",
        sortable: true,
        visible: !isDoctor && !isReceptionist,
        getValue: (p) => p.patientCategory || "",
        render: (p) => (
          <span className="text-xs text-slate-700 capitalize font-medium">
            {(p.patientCategory || "GENERAL").toLowerCase().replace(/_/g, " ")}
          </span>
        ),
      },
      {
        key: "reg_type",
        label: "REG. TYPE",
        sortable: true,
        visible: !isDoctor,
        getValue: (p) => p.registrationType || "",
        render: (p) => {
          const regType = (p.registrationType || "WALK_IN")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          return (
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                regType.toUpperCase().includes("ONLINE")
                  ? "bg-blue-50 text-[#0D47A1] border-blue-200"
                  : "bg-teal-50 text-teal-700 border-teal-200"
              }`}
            >
              {regType}
            </span>
          );
        },
      },
      {
        key: "assigned_doctor",
        label: "ASSIGNED DOCTOR",
        sortable: true,
        visible: false,
        getValue: (p) =>
          extractDoctorName(p, doctorMap) || p.assignedDoctor || "N/A",
        render: (p) => (
          <div className="flex items-center gap-1.5 text-xs text-slate-700">
            <UserCheck size={14} className="text-[#009688]" />
            <span className="font-medium text-[#111827]">
              {extractDoctorName(p, doctorMap) || p.assignedDoctor || "-"}
            </span>
          </div>
        ),
      },
      {
        key: "reg_date",
        label: "REGISTRATION DATE",
        sortable: true,
        visible: !isDoctor,
        getValue: (p) => {
          const rawDate =
            p.registrationDate ||
            (p as unknown as Record<string, unknown>).registeredDate ||
            (p as unknown as Record<string, unknown>).createdAt;
          return rawDate ? String(rawDate) : "";
        },
        render: (p) => {
          const rawDate =
            p.registrationDate ||
            (p as unknown as Record<string, unknown>).registeredDate ||
            (p as unknown as Record<string, unknown>).createdAt;
          const regDate = rawDate
            ? typeof rawDate === "string"
              ? rawDate.split("T")[0]
              : String(rawDate).split("T")[0]
            : "-";
          return (
            <span className="text-xs text-slate-600 font-mono">{regDate}</span>
          );
        },
      },
      {
        key: "visit_count",
        label: "VISIT COUNT",
        sortable: true,
        visible: isDoctor,
        getValue: (p) => p.visitCount ?? 0,
        render: (p) => (
          <span className="text-xs text-slate-700 font-medium">
            {p.visitCount ?? 0}
          </span>
        ),
      },
      {
        key: "last_visit",
        label: "LAST VISIT",
        sortable: true,
        visible: isDoctor,
        getValue: (p) => p.lastVisitDate || "",
        render: (p) => (
          <span className="text-xs text-slate-700 font-medium">
            {p.lastVisitDate || "-"}
          </span>
        ),
      },
      {
        key: "next_appointment",
        label: "NEXT APPOINTMENT",
        sortable: true,
        visible: isDoctor,
        getValue: (p) => p.nextAppointmentDate || "",
        render: (p) => (
          <span className="text-xs text-slate-700">
            {p.nextAppointmentDate || "-"}
          </span>
        ),
      },
      {
        key: "status",
        label: "STATUS",
        sortable: true,
        visible: !isDoctor,
        getValue: (p) => p.status || "",
        render: (p) => {
          const statusStr = (p.status || "ACTIVE").toUpperCase();
          if (statusStr === "ACTIVE") {
            return (
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full text-[11px] font-bold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            );
          }
          if (statusStr === "ADMITTED") {
            return (
              <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-800 px-2.5 py-1 rounded-full text-[11px] font-bold border border-purple-200">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                Admitted
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              {statusStr.charAt(0) + statusStr.slice(1).toLowerCase()}
            </span>
          );
        },
      },
      {
        key: "actions",
        label: "ACTIONS",
        sortable: false,
        align: "right",
        visible: true,
        render: (p) => {
          const mrn = p.mrn || String(p.id);
          const statusStr = (p.status || "ACTIVE").toUpperCase();

          return (
            <div
              className="flex items-center justify-end gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => onViewProfile(mrn)}
                className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#0D47A1] transition-colors cursor-pointer"
                title="View Patient Profile"
              >
                <Eye size={13} />
              </button>

              {onBookAppointment && !isDoctor && (
                <button
                  onClick={() => onBookAppointment(p)}
                  className="p-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-[#009688] transition-colors cursor-pointer"
                  title="Book Appointment"
                >
                  <Calendar size={13} />
                </button>
              )}

              {canEdit && onEditPatient && (
                <button
                  onClick={() => onEditPatient(p)}
                  className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                  title="Edit Patient Details"
                >
                  <Edit size={13} />
                </button>
              )}

              {statusStr === "INACTIVE"
                ? onActivatePatient && (
                    <button
                      onClick={() => onActivatePatient(p)}
                      className="p-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 transition-colors cursor-pointer"
                      title="Activate Patient"
                    >
                      <CheckCircle2 size={13} />
                    </button>
                  )
                : onDeactivatePatient && (
                    <button
                      onClick={() => onDeactivatePatient(p)}
                      className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                      title="Deactivate Patient"
                    >
                      <AlertTriangle size={13} />
                    </button>
                  )}
            </div>
          );
        },
      },
    ],
    [
      isDoctor,
      isReceptionist,
      doctorMap,
      canEdit,
      onViewProfile,
      onBookAppointment,
      onEditPatient,
      onActivatePatient,
      onDeactivatePatient,
    ],
  );

  // Filter selectors row JSX
  const filterToolbar = filterValues && onFilterChange && (
    <div className="bg-slate-50/80 border border-[#E5E7EB] rounded-xl p-2.5 shadow-2xs">
      {/* Compact Filter Selectors Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Gender Filter */}
          <div className="flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E5E7EB] rounded-lg text-slate-700 font-medium">
            <span className="text-slate-400 text-[11px]">Gender:</span>
            <select
              aria-label="Gender filter"
              value={filterValues.genderFilter}
              onChange={(e) => onFilterChange({ genderFilter: e.target.value })}
              className="bg-transparent font-semibold outline-none cursor-pointer text-[#0D47A1] text-xs"
            >
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E5E7EB] rounded-lg text-slate-700 font-medium">
            <span className="text-slate-400 text-[11px]">Status:</span>
            <select
              aria-label="Status filter"
              value={filterValues.statusFilter}
              onChange={(e) => onFilterChange({ statusFilter: e.target.value })}
              className="bg-transparent font-semibold outline-none cursor-pointer text-[#0D47A1] text-xs"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Admitted">Admitted</option>
              <option value="Discharged">Discharged</option>
            </select>
          </div>

          {/* Registration Type Filter */}
          <div className="flex items-center gap-1 px-2.5 py-1 bg-white border border-[#E5E7EB] rounded-lg text-slate-700 font-medium">
            <span className="text-slate-400 text-[11px]">Type:</span>
            <select
              aria-label="Registration type filter"
              value={filterValues.registrationTypeFilter}
              onChange={(e) =>
                onFilterChange({ registrationTypeFilter: e.target.value })
              }
              className="bg-transparent font-semibold outline-none cursor-pointer text-[#0D47A1] text-xs"
            >
              <option value="All">All Reg Types</option>
              <option value="ONLINE">Online</option>
              <option value="WALK_IN">Walk-In</option>
            </select>
          </div>
        </div>

        {/* Clear All Filters Button */}
        {hasActiveFilters && onResetFilters && (
          <button
            onClick={onResetFilters}
            className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs shrink-0"
            style={{ fontFamily: PP }}
          >
            <RotateCcw size={12} /> Clear Filters
          </button>
        )}
      </div>

      {/* Active Filter Chips Strip */}
      {activeFiltersChips.length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5 pt-1.5 mt-1.5 border-t border-slate-200/70 text-xs">
          <span className="text-[11px] font-medium text-slate-500 mr-1 flex items-center gap-1">
            <Filter size={11} /> Active filters:
          </span>
          {activeFiltersChips.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#0D47A1] border border-blue-200 text-[11px] font-semibold"
            >
              {chip.label}
              <button
                onClick={chip.clear}
                className="hover:text-red-600 rounded-full p-0.2 cursor-pointer"
              >
                <X size={11} />
              </button>
            </span>
          ))}
          {onResetFilters && (
            <button
              onClick={onResetFilters}
              className="text-[11px] text-[#0D47A1] hover:underline font-bold ml-2 cursor-pointer"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Backdrop for action popup menus */}
      {activeActionMenuId && (
        <div
          role="presentation"
          className="fixed inset-0 z-20 bg-transparent"
          onClick={() => onToggleActionMenu(null)}
        />
      )}

      {/* Common Shared DataTable Component */}
      <DataTable
        data={patients}
        columns={columns}
        loading={isLoading}
        getRowId={(p) => p.mrn || String(p.id)}
        selectedRowId={selectedPatientId}
        onRowClick={onSelectRow}
        title={
          <>
            <Users size={18} className="text-[#0D47A1]" /> Patient Queue
            Workspace
          </>
        }
        subtitle="Real-time patient registry, identity details, and clinical actions."
        headerBadge={
          <span
            className="text-xs font-semibold text-[#0D47A1] bg-blue-50 px-3 py-1 rounded-xl border border-blue-100"
            style={{ fontFamily: RB }}
          >
            Showing {patients.length} of {totalCount} Patients
          </span>
        }
        searchable={true}
        searchPlaceholder=" Search patient by Name, MRN, Phone number, or Email..."
        searchValue={filterValues?.searchQuery}
        onSearchChange={(val) => onFilterChange?.({ searchQuery: val })}
        toolbar={filterToolbar}
        emptyTitle="No patient records match criteria."
        emptySubtitle="Try adjusting your search query or clear applied filters to view all hospital patients."
        emptyAction={
          hasActiveFilters && onResetFilters ? (
            <button
              onClick={onResetFilters}
              className="px-4 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-semibold hover:bg-[#0c3d8a] transition-colors cursor-pointer"
              style={{ fontFamily: PP }}
            >
              Reset All Filters
            </button>
          ) : undefined
        }
        pagination={true}
        totalCount={totalCount}
      />
    </>
  );
}
