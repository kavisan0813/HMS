import {
  Stethoscope,
  Eye,
  Edit,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Building2,
  Clock,
  Filter,
  Award,
  RotateCcw,
} from "lucide-react";
import type {
  DoctorRecord,
  DoctorAvailability,
  DoctorStatus,
} from "../types/doctors.types";
import { usePermissions } from "../../../permissions/usePermissions";
import { PP } from "../constants/doctors.constants";
import { UserAvatar } from "../../../common/components/UserAvatar";
import { DataTable, type Column } from "../../../common/components/DataTable";

function getAvailabilityBadgeStyle(avail: DoctorAvailability) {
  switch (avail) {
    case "Available Today":
      return {
        bg: "bg-[#E6F4F1] text-[#009688] border-teal-200",
        dot: "bg-[#009688]",
      };
    case "On Duty":
      return {
        bg: "bg-blue-50 text-[#0D47A1] border-blue-200",
        dot: "bg-[#0D47A1]",
      };
    case "On Call":
      return {
        bg: "bg-purple-50 text-purple-700 border-purple-200",
        dot: "bg-purple-600",
      };
    case "On Leave":
      return {
        bg: "bg-amber-50 text-[#F59E0B] border-amber-200",
        dot: "bg-[#F59E0B]",
      };
    case "Out of Office":
      return {
        bg: "bg-slate-100 text-slate-600 border-slate-200",
        dot: "bg-slate-400",
      };
  }
}

function getStatusBadgeStyle(status: DoctorStatus) {
  switch (status) {
    case "Active":
      return {
        bg: "bg-emerald-50 text-[#66BB6A] border-emerald-200",
        dot: "bg-[#66BB6A]",
      };
    case "Inactive":
      return {
        bg: "bg-[#FEE2E2] text-[#EF4444] border-red-200",
        dot: "bg-[#EF4444]",
      };
    case "On Leave":
    default:
      return {
        bg: "bg-amber-50 text-[#F59E0B] border-amber-200",
        dot: "bg-[#F59E0B]",
      };
  }
}

export interface DoctorTableProps {
  doctors: DoctorRecord[];
  filteredDoctors: DoctorRecord[];
  isLoading: boolean;
  sortColumn?: keyof DoctorRecord;
  sortDirection?: "asc" | "desc";
  onSort?: (col: keyof DoctorRecord) => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  deptFilter?: string;
  setDeptFilter?: (val: string) => void;
  specialtyFilter?: string;
  setSpecialtyFilter?: (val: string) => void;
  availabilityFilter?: string;
  setAvailabilityFilter?: (val: string) => void;
  statusFilter?: string;
  setStatusFilter?: (val: string) => void;
  experienceFilter?: string;
  setExperienceFilter?: (val: string) => void;
  departments?: string[];
  specialties?: string[];
  onViewProfile: (doc: DoctorRecord) => void;
  onQuickView: (doc: DoctorRecord) => void;
  onEdit?: (doc: DoctorRecord) => void;
  onViewSchedule?: (doc: DoctorRecord) => void;
  onDeactivate?: (doc: DoctorRecord) => void;
  onActivate?: (doc: DoctorRecord) => void;
  onResetPassword?: (doc: DoctorRecord) => void;
  onAddDoctor?: () => void;
  onResetFilters: () => void;
}

export function DoctorTable({
  doctors,
  filteredDoctors,
  isLoading,
  searchQuery,
  onSearchChange,
  deptFilter = "All",
  setDeptFilter,
  specialtyFilter = "All",
  setSpecialtyFilter,
  availabilityFilter = "All",
  setAvailabilityFilter,
  statusFilter = "All",
  setStatusFilter,
  experienceFilter = "All",
  setExperienceFilter,
  departments = [],
  specialties = [],
  onViewProfile,
  onQuickView,
  onEdit,
  onViewSchedule,
  onDeactivate,
  onActivate,
  onResetPassword,
  onResetFilters,
}: DoctorTableProps) {
  const { can } = usePermissions();

  const columns: Column<DoctorRecord>[] = [
    {
      key: "id",
      label: "DOCTOR ID",
      sortable: true,
      getValue: (doc) => doc.id,
      render: (doc) => (
        <button
          onClick={() => onViewProfile(doc)}
          className="font-mono font-bold text-[#0D47A1] hover:underline text-left cursor-pointer"
        >
          {doc.id}
        </button>
      ),
    },
    {
      key: "name",
      label: "DOCTOR NAME",
      sortable: true,
      getValue: (doc) => doc.name,
      render: (doc) => {
        const contactDetails = [doc.empId, doc.regNumber].filter(
          (val): val is string => Boolean(val && val.trim() && val !== "—"),
        );
        return (
          <div
            onClick={() => onViewProfile(doc)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <UserAvatar
              name={doc.name}
              size="sm"
              src={doc.photoUrl || doc.photo || undefined}
            />
            <div>
              <span
                className="font-bold text-[#111827] block group-hover:text-[#0D47A1] transition-colors text-xs"
                style={{ fontFamily: PP }}
              >
                {doc.name}
              </span>
              {can("DOCTOR_CONTACT_VIEW") && contactDetails.length > 0 && (
                <span className="text-[10px] text-[#64748B] font-mono block">
                  {contactDetails.join(" • ")}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "department",
      label: "DEPARTMENT",
      sortable: true,
      getValue: (doc) => doc.department,
      render: (doc) => (
        <span className="font-semibold text-[#111827]">{doc.department}</span>
      ),
    },
    {
      key: "specialty",
      label: "SPECIALTY",
      sortable: true,
      getValue: (doc) => doc.specialty,
      render: (doc) => <span className="text-slate-700">{doc.specialty}</span>,
    },
    {
      key: "qualification",
      label: "QUALIFICATION",
      sortable: true,
      getValue: (doc) => doc.qualification,
      render: (doc) => (
        <span
          className="text-[#64748B] max-w-37.5 truncate block"
          title={doc.qualification}
        >
          {doc.qualification}
        </span>
      ),
    },
    {
      key: "experienceYrs",
      label: "EXPERIENCE",
      sortable: true,
      getValue: (doc) => doc.experienceYrs,
      render: (doc) => (
        <span className="font-medium text-[#111827]">
          {doc.experienceYrs} Yrs
        </span>
      ),
    },
    {
      key: "consultationFee",
      label: "FEE",
      sortable: true,
      visible: can("DOCTOR_FEE_VIEW"),
      getValue: (doc) => doc.consultationFee,
      render: (doc) => (
        <span className="font-bold text-[#0D47A1]" style={{ fontFamily: PP }}>
          ${doc.consultationFee}
        </span>
      ),
    },
    {
      key: "availability",
      label: "AVAILABILITY",
      sortable: true,
      getValue: (doc) => doc.availability,
      render: (doc) => {
        const availBadge = getAvailabilityBadgeStyle(doc.availability);
        return (
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border inline-flex items-center gap-1.5 ${availBadge.bg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${availBadge.dot}`} />
            {doc.availability}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "STATUS",
      sortable: true,
      getValue: (doc) => doc.status,
      render: (doc) => {
        const statusBadge = getStatusBadgeStyle(doc.status);
        return (
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium border inline-flex items-center gap-1.5 ${statusBadge.bg}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
            {doc.status}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "ACTIONS",
      sortable: false,
      align: "right",
      render: (doc) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {can("DOCTOR_PROFILE_VIEW") && (
            <button
              onClick={() => onQuickView(doc)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#0D47A1] hover:bg-blue-50 transition-colors cursor-pointer"
              title="View Quick Details Drawer"
            >
              <Eye size={15} />
            </button>
          )}

          {can("DOCTOR_EDIT") && onEdit && (
            <button
              onClick={() => onEdit(doc)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
              title="Edit Doctor Profile"
            >
              <Edit size={15} />
            </button>
          )}

          {can("DOCTOR_SCHEDULE_VIEW") && onViewSchedule && (
            <button
              onClick={() => onViewSchedule(doc)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
              title="View Schedule & Practice Hours"
            >
              <Calendar size={15} />
            </button>
          )}

          {can("DOCTOR_DEACTIVATE") && onResetPassword && (
            <button
              onClick={() => onResetPassword(doc)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
              title="Reset Password"
            >
              <KeyRound size={15} />
            </button>
          )}

          {can("DOCTOR_DEACTIVATE") &&
            onActivate &&
            doc.status === "Inactive" && (
              <button
                onClick={() => onActivate(doc)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                title="Activate Doctor"
              >
                <CheckCircle2 size={15} />
              </button>
            )}

          {can("DOCTOR_DEACTIVATE") &&
            onDeactivate &&
            doc.status !== "Inactive" && (
              <button
                onClick={() => onDeactivate(doc)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Deactivate Doctor"
              >
                <AlertTriangle size={15} />
              </button>
            )}
        </div>
      ),
    },
  ];

  const hasActiveFilters =
    deptFilter !== "All" ||
    specialtyFilter !== "All" ||
    availabilityFilter !== "All" ||
    statusFilter !== "All" ||
    experienceFilter !== "All";

  const filterToolbar = (
    <div className="bg-slate-50/80 border border-[#E5E7EB] rounded-xl p-2.5 space-y-2 shadow-2xs text-xs">
      <div className="flex items-center gap-2 flex-wrap">
        {setDeptFilter && (
          <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
            <Building2 size={13} className="text-slate-400" />
            <span className="text-slate-400 text-[11px]">Dept:</span>
            <select
              aria-label="Department filter"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
            >
              <option value="All">All Departments</option>
              {departments.map((deptName) => (
                <option key={deptName} value={deptName}>
                  {deptName}
                </option>
              ))}
            </select>
          </div>
        )}

        {setSpecialtyFilter && specialties.length > 0 && (
          <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
            <Stethoscope size={13} className="text-slate-400" />
            <span className="text-slate-400 text-[11px]">Specialty:</span>
            <select
              aria-label="Specialty filter"
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
            >
              <option value="All">All Specialties</option>
              {specialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>
        )}

        {setAvailabilityFilter && (
          <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
            <Clock size={13} className="text-slate-400" />
            <span className="text-slate-400 text-[11px]">Availability:</span>
            <select
              aria-label="Availability filter"
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
            >
              <option value="All">All Availability</option>
              <option value="Available Today">Available Today</option>
              <option value="On Duty">On Duty</option>
              <option value="On Call">On Call</option>
              <option value="On Leave">On Leave</option>
              <option value="Out of Office">Out of Office</option>
            </select>
          </div>
        )}

        {setStatusFilter && (
          <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
            <Filter size={13} className="text-slate-400" />
            <span className="text-slate-400 text-[11px]">Status:</span>
            <select
              aria-label="Status filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        )}

        {setExperienceFilter && (
          <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg text-slate-700 font-medium">
            <Award size={13} className="text-slate-400" />
            <span className="text-slate-400 text-[11px]">Experience:</span>
            <select
              aria-label="Experience filter"
              value={experienceFilter}
              onChange={(e) => setExperienceFilter(e.target.value)}
              className="bg-transparent font-semibold text-[#0D47A1] outline-none cursor-pointer text-xs"
            >
              <option value="All">All Experience</option>
              <option value="0-5 Years">0 - 5 Years</option>
              <option value="5-10 Years">5 - 10 Years</option>
              <option value="10-15 Years">10 - 15 Years</option>
              <option value="15+ Years">15+ Years</option>
            </select>
          </div>
        )}

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs shrink-0 ml-auto"
            style={{ fontFamily: PP }}
          >
            <RotateCcw size={12} /> Clear Filters
          </button>
        )}
      </div>
    </div>
  );

  return (
    <DataTable<DoctorRecord>
      data={filteredDoctors}
      columns={columns}
      loading={isLoading}
      getRowId={(doc) => doc.id}
      title="Doctor Directory Table"
      subtitle="Complete registry of hospital doctors, specialties, schedules, and profile actions."
      headerBadge={
        <span className="text-xs font-semibold text-[#0D47A1] bg-blue-50 px-3 py-1 rounded-xl border border-blue-100 font-mono">
          Showing {filteredDoctors.length} of {doctors.length} Doctors
        </span>
      }
      searchable={true}
      searchPlaceholder=" Search Doctor by Name, ID, Department, Specialty..."
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      toolbar={filterToolbar}
      emptyTitle="No doctors found."
      emptySubtitle="No doctor records matched your search query or selected filter options."
      emptyIcon={<Stethoscope size={28} />}
      emptyAction={
        <button
          onClick={onResetFilters}
          className="px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
        >
          Reset Filters
        </button>
      }
      pagination={true}
    />
  );
}
