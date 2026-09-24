import {
  useState,
  useMemo,
  useTransition,
  type Dispatch,
  type SetStateAction,
  type TransitionStartFunction,
} from "react";
import { useNavigate } from "react-router";
import { ROUTES } from "../../../app/routes/routes";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  PhoneCall,
  RefreshCw,
  RotateCcw,
  Search,
  Stethoscope,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { useConsultation } from "../../opd/hooks/useConsultation";
import { PP, RB } from "../constants/appointment.constants";
import { StatusBadge } from "./StatusBadge";
import { Avatar } from "./Avatar";
import type {
  AppointmentStatus,
  UserRole,
} from "../types/appointment-screen.types";
import type { AppointmentRecord } from "../types/appointment.types";
import { Pagination } from "../../../common/components/Pagination";
import {
  getTodayDateString,
  normalizeDateString,
} from "../../../lib/time-utils";

type AppointmentSetter = Dispatch<SetStateAction<string>>;

type WorkspaceHeaderProps = {
  onBackToDirectory?: () => void;
  isNurse: boolean;
  isDoctor: boolean;
  onRefresh?: () => void;
  startTransition: TransitionStartFunction;
  isPending: boolean;
  onStartConsultation?: (apt?: AppointmentRecord | null) => void;
  currentPatient: AppointmentRecord | null;
};

type WorkspaceFiltersProps = {
  searchQuery: string;
  setSearchQuery: AppointmentSetter;
  statusFilter: string;
  setStatusFilter: AppointmentSetter;
  visitTypeFilter: string;
  setVisitTypeFilter: AppointmentSetter;
  timeFilter: string;
  setTimeFilter: AppointmentSetter;
  handleResetFilters: () => void;
};

type WorkspaceKPIProps = {
  isNurse: boolean;
  totalCount: number;
  waitingPatients: AppointmentRecord[];
  checkedInPatients: AppointmentRecord[];
  inConsultationPatients: AppointmentRecord[];
  readyPatients: AppointmentRecord[];
  completedCount: number;
};

type WorkspaceCurrentPatientProps = {
  currentPatient: AppointmentRecord | null;
  onPatientSelect?: (id: number | string) => void;
  isDoctor: boolean;
  onStartConsultation?: (apt?: AppointmentRecord | null) => void;
};

type WorkspaceQueueTableProps = {
  filteredQueue: AppointmentRecord[];
  paginatedQueue: AppointmentRecord[];
  onViewDetails: (apt: AppointmentRecord) => void;
  onPatientSelect?: (id: number | string) => void;
  isNurse: boolean;
  isDoctor: boolean;
  onStartConsultation?: (apt?: AppointmentRecord | null) => void;
  onUpdateStatus: (
    aptId: string | number,
    status: AppointmentStatus,
    toastMsg: string,
  ) => void;
  onBackToDirectory?: () => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  pageSize: number;
};

const WorkspaceHeader = ({
  onBackToDirectory,
  isNurse,
  isDoctor,
  onRefresh,
  startTransition,
  isPending,
  onStartConsultation,
  currentPatient,
}: WorkspaceHeaderProps) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 ">
    <div className="flex items-center gap-3">
      <button
        onClick={onBackToDirectory}
        className="p-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-600 transition-colors"
        title="Back to Directory"
      >
        <ArrowLeft size={18} />
      </button>
      <div>
        <div
          className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-0.5"
          style={{ fontFamily: PP }}
        >
          {isNurse
            ? "Nurse / Appointment Management / Patient Queue"
            : isDoctor
              ? "Doctor / Appointment Management / Queue Management"
              : ""}
        </div>
        <h1
          className="text-xl font-bold text-[#111827] flex items-center gap-2"
          style={{ fontFamily: PP }}
        >
          <Clock size={22} className="text-[#009688]" />{" "}
          {isNurse
            ? "Patient Queue"
            : isDoctor
              ? "Today's Consultation Queue"
              : "Today's OPD Consultation Queue"}
        </h1>
        <p className="text-xs text-[#64748B] mt-0.5">
          {isNurse
            ? "Monitor today's consultation queue."
            : isDoctor
              ? "Monitor your patient queue and start consultations."
              : "Reception Desk Patient Flow & Token Arrival Manager"}
        </p>
      </div>
    </div>

    <div className="flex items-center gap-3 shrink-0">
      <button
        onClick={() => {
          if (onRefresh) {
            onRefresh();
          } else {
            startTransition(async () => {
              await new Promise((r) => setTimeout(r, 500));
            });
          }
        }}
        className="px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
      >
        <RefreshCw size={13} className={isPending ? "animate-spin" : ""} />{" "}
        Refresh Queue
      </button>

      {isDoctor ? (
        <button
          onClick={() => onStartConsultation?.(currentPatient)}
          className="px-4 py-2 rounded-xl bg-[#009688] text-white text-xs font-bold hover:bg-[#00796B] transition-colors flex items-center gap-1.5 shadow-sm"
          style={{ fontFamily: PP }}
        >
          <Stethoscope size={14} /> Start Consultation
        </button>
      ) : (
        <button
          onClick={onBackToDirectory}
          className="px-4 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#0c3d8a] transition-colors flex items-center gap-1.5 shadow-sm"
          style={{ fontFamily: PP }}
        >
          Close Queue Panel
        </button>
      )}
    </div>
  </div>
);

const WorkspaceFilters = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  visitTypeFilter,
  setVisitTypeFilter,
  timeFilter,
  setTimeFilter,
  handleResetFilters,
}: WorkspaceFiltersProps) => (
  <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-3">
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      <div className="relative flex-1">
        <Search
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          aria-label="Input field"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Patient Name, MRN, or Token Number…"
          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0D47A1] focus:bg-white transition-colors"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <select
          aria-label="Select option"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2.5 py-2 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0D47A1] text-slate-700 font-medium"
        >
          <option value="All">All Statuses</option>
          <option value="Waiting">Waiting</option>
          <option value="Checked-In">Checked-In</option>
          <option value="In Progress">In Consultation</option>
          <option value="Completed">Completed</option>
        </select>

        <select
          aria-label="Select option"
          value={visitTypeFilter}
          onChange={(e) => setVisitTypeFilter(e.target.value)}
          className="px-2.5 py-2 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0D47A1] text-slate-700 font-medium"
        >
          <option value="All">All Visit Types</option>
          <option value="First Visit">First Visit</option>
          <option value="Follow-up">Follow-up</option>
          <option value="Walk-In">Walk-In</option>
        </select>

        <select
          aria-label="Select option"
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="px-2.5 py-2 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0D47A1] text-slate-700 font-medium"
        >
          <option value="All">All Slots</option>
          <option value="Morning">Morning</option>
          <option value="Afternoon">Afternoon</option>
        </select>

        <button
          onClick={handleResetFilters}
          className="p-2 rounded-xl border border-[#E5E7EB] bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
          title="Reset Filters"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  </div>
);

const WorkspaceKPIs = ({
  isNurse,
  totalCount,
  waitingPatients,
  checkedInPatients,
  inConsultationPatients,
  readyPatients,
  completedCount,
}: WorkspaceKPIProps) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between">
      <div>
        <div className="text-xs text-[#64748B] font-medium">
          {isNurse ? "Today's Queue" : "Today's Appointments"}
        </div>
        <div
          className="text-2xl font-bold text-[#0D47A1] mt-0.5"
          style={{ fontFamily: PP }}
        >
          {totalCount}
        </div>
        <div className="text-[10px] text-slate-400 font-medium mt-1">
          Total in queue
        </div>
      </div>
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#0D47A1] shrink-0">
        <Calendar size={18} />
      </div>
    </div>

    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between">
      <div>
        <div className="text-xs text-[#64748B] font-medium">
          Waiting Patients
        </div>
        <div
          className="text-2xl font-bold text-[#F59E0B] mt-0.5"
          style={{ fontFamily: PP }}
        >
          {waitingPatients.length}
        </div>
        <div className="text-[10px] text-amber-600 font-medium mt-1">
          In lounge
        </div>
      </div>
      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[#F59E0B] shrink-0">
        <Users size={18} />
      </div>
    </div>

    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between">
      <div>
        <div className="text-xs text-[#64748B] font-medium">
          {isNurse ? "Checked-In Patients" : "Currently In Consultation"}
        </div>
        <div
          className="text-2xl font-bold text-[#009688] mt-0.5"
          style={{ fontFamily: PP }}
        >
          {isNurse ? checkedInPatients.length : inConsultationPatients.length}
        </div>
        <div className="text-[10px] text-teal-600 font-medium mt-1">
          {isNurse ? "Arrived at clinic" : "Active doctor room"}
        </div>
      </div>
      <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#009688] shrink-0">
        <UserCheck size={18} />
      </div>
    </div>

    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between">
      <div>
        <div className="text-xs text-[#64748B] font-medium">
          {isNurse ? "Ready For Consultation" : "Completed Consultations"}
        </div>
        <div
          className="text-2xl font-bold text-[#4DB6AC] mt-0.5"
          style={{ fontFamily: PP }}
        >
          {isNurse ? readyPatients.length : completedCount}
        </div>
        <div className="text-[10px] text-teal-600 font-medium mt-1">
          {isNurse ? "Prepped & waiting" : "Checked out"}
        </div>
      </div>
      <div className="w-10 h-10 rounded-xl bg-teal-50/60 flex items-center justify-center text-[#009688] shrink-0">
        <Stethoscope size={18} />
      </div>
    </div>

    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between col-span-2 sm:col-span-1">
      <div>
        <div className="text-xs text-[#64748B] font-medium">
          Completed Consultations
        </div>
        <div
          className="text-2xl font-bold text-[#66BB6A] mt-0.5"
          style={{ fontFamily: PP }}
        >
          {completedCount}
        </div>
        <div className="text-[10px] text-green-600 font-medium mt-1">
          Checked out
        </div>
      </div>
      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#66BB6A] shrink-0">
        <CheckCircle2 size={18} />
      </div>
    </div>
  </div>
);

const WorkspaceCurrentPatient = ({
  currentPatient,
  onPatientSelect,
  isDoctor,
  onStartConsultation,
}: WorkspaceCurrentPatientProps) => (
  <div className="lg:col-span-12 bg-linear-to-r from-teal-900 via-[#009688] to-[#0D47A1] rounded-2xl p-5 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    {currentPatient ? (
      <>
        <div className="flex items-center gap-4">
          <Avatar name={currentPatient.patientName} size="lg" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold bg-white/20 px-2 py-0.5 rounded text-white">
                {currentPatient.tokenNo}
              </span>
              <span className="text-xs font-semibold text-teal-100 bg-white/10 px-2 py-0.5 rounded">
                {currentPatient.status}
              </span>
              <span className="text-xs text-teal-200 font-mono">
                {currentPatient.timeSlot}
              </span>
            </div>
            <h3
              className="text-lg font-bold text-white mt-1"
              style={{ fontFamily: PP }}
            >
              {currentPatient.patientName}
            </h3>
            <div className="text-xs text-teal-100 mt-0.5">
              {currentPatient.mrn} · {currentPatient.patientAge} yrs /{" "}
              {currentPatient.patientGender} · Waiting:{" "}
              <strong className="text-white font-mono">
                {currentPatient.waitingTimeMinutes || 12} mins
              </strong>
            </div>
            <div className="text-xs text-teal-100/90 mt-1.5 bg-black/10 px-3 py-1.5 rounded-xl border border-white/10">
              <strong>Chief Complaint:</strong>{" "}
              {currentPatient.chiefComplaint ||
                "Chest pain and shortness of breath upon mild exertion."}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
          {onPatientSelect && (
            <button
              onClick={() => onPatientSelect(currentPatient.patientId)}
              className="px-4 py-2.5 rounded-xl bg-white text-[#009688] text-xs font-bold hover:bg-teal-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
              style={{ fontFamily: PP }}
            >
              <User size={15} /> View Patient Profile
            </button>
          )}
          {isDoctor && (
            <button
              onClick={() => onStartConsultation?.(currentPatient)}
              className="px-4 py-2.5 rounded-xl bg-white text-[#009688] text-xs font-bold hover:bg-teal-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
              style={{ fontFamily: PP }}
            >
              <Stethoscope size={15} /> Start Consultation
            </button>
          )}
        </div>
      </>
    ) : (
      <div className="py-2 text-xs text-teal-100">
        No patient is currently active or waiting in queue.
      </div>
    )}
  </div>
);

const WorkspaceQueueTable = ({
  filteredQueue,
  paginatedQueue,
  onViewDetails,
  onPatientSelect,
  isNurse,
  isDoctor,
  onStartConsultation,
  onUpdateStatus,
  onBackToDirectory,
  currentPage,
  totalPages,
  setCurrentPage,
  pageSize,
}: WorkspaceQueueTableProps) => (
  <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col">
    <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between bg-slate-50/50">
      <h3
        className="text-sm font-bold text-[#111827] flex items-center gap-2"
        style={{ fontFamily: PP }}
      >
        <Clock size={16} className="text-[#0D47A1]" /> Patient Queue List
      </h3>
      <span className="text-xs text-[#64748B]">
        Showing{" "}
        <strong className="text-[#111827]">{filteredQueue.length}</strong> queue
        entries
      </span>
    </div>

    <div className="overflow-x-auto max-h-125 overflow-y-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="sticky top-0 bg-slate-50 border-b border-[#E5E7EB] z-10">
          <tr className="text-[#64748B] font-bold" style={{ fontFamily: PP }}>
            <th className="px-4 py-3.5">Token Number</th>
            <th className="px-4 py-3.5">Patient</th>
            <th className="px-4 py-3.5">MRN</th>
            <th className="px-4 py-3.5">Appointment Time</th>
            <th className="px-4 py-3.5">Visit Type</th>
            <th className="px-4 py-3.5">Queue Status</th>
            <th className="px-4 py-3.5">Waiting Time</th>
            <th className="px-4 py-3.5">Priority</th>
            <th className="px-4 py-3.5 text-right">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 text-[#111827]">
          {paginatedQueue.map((q) => (
            <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-4 py-3.5">
                <span className="font-mono font-bold text-[#0D47A1] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                  {q.tokenNo}
                </span>
              </td>

              <td className="px-4 py-3.5 font-bold text-[#111827]">
                <div className="flex items-center gap-2">
                  <Avatar name={q.patientName} size="sm" />
                  <div>
                    <div>{q.patientName}</div>
                    <div className="text-[10px] text-slate-400 font-mono font-normal">
                      {q.patientAge}y / {q.patientGender}
                    </div>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3.5 font-mono text-slate-600 font-semibold">
                {q.mrn}
              </td>

              <td className="px-4 py-3.5 font-mono text-[#0D47A1] font-bold">
                {q.timeSlot}
              </td>

              <td className="px-4 py-3.5 font-medium text-slate-700">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-[#009688] border border-teal-100">
                  {q.visitType}
                </span>
              </td>

              <td className="px-4 py-3.5">
                <StatusBadge status={q.status} />
              </td>

              <td className="px-4 py-3.5 font-mono font-bold text-[#F59E0B]">
                {q.waitingTimeMinutes
                  ? `${q.waitingTimeMinutes} mins`
                  : "10 mins"}
              </td>

              <td className="px-4 py-3.5">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${q.priority === "High" || q.priority === "Urgent" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}
                >
                  {q.priority || "Normal"}
                </span>
              </td>

              <td className="px-4 py-3.5 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => onViewDetails(q)}
                    className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-blue-50 text-[#0D47A1] transition-colors"
                    title="View Appointment Details"
                  >
                    <Eye size={14} />
                  </button>

                  {onPatientSelect && (
                    <button
                      onClick={() => onPatientSelect(q.patientId)}
                      className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-teal-50 text-[#009688] transition-colors"
                      title="View Patient Profile"
                    >
                      <User size={14} />
                    </button>
                  )}

                  {isNurse ? null : isDoctor ? (
                    <button
                      onClick={() => onStartConsultation?.(q)}
                      className="px-2.5 py-1 rounded-lg bg-[#009688] hover:bg-[#00796B] text-white text-[11px] font-bold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                      title="Start Consultation"
                    >
                      <Stethoscope size={12} /> Start Consultation
                    </button>
                  ) : (
                    <>
                      {(q.status === "Scheduled" ||
                        q.status === "Booked" ||
                        q.status === "BOOKED") && (
                          <button
                            onClick={() =>
                              onUpdateStatus(
                                q.id,
                                "Checked-In",
                                "Patient checked in successfully.",
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-[#0D47A1] text-white text-[11px] font-bold hover:bg-[#0c3d8a] transition-colors flex items-center gap-1 shadow-xs"
                          >
                            <CheckCircle2 size={12} /> Check-In Patient
                          </button>
                        )}

                      {q.status === "Waiting for Doctor" && (
                        <button
                          onClick={() =>
                            onUpdateStatus(
                              q.id,
                              "Called",
                              "Patient called for consultation.",
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-teal-50 text-[#009688] text-[11px] font-bold border border-teal-200 hover:bg-teal-100 transition-colors flex items-center gap-1"
                        >
                          <PhoneCall size={12} /> Call Patient
                        </button>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}

          {filteredQueue.length === 0 && (
            <tr>
              <td colSpan={9} className="py-12 text-center text-slate-400">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Users size={32} className="text-slate-300" />
                  <div
                    className="text-sm font-medium text-slate-600"
                    style={{ fontFamily: PP }}
                  >
                    No patients are currently waiting.
                  </div>
                  <button
                    onClick={onBackToDirectory}
                    className="mt-2 px-4 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#0c3d8a] transition-colors"
                    style={{ fontFamily: PP }}
                  >
                    View My Appointments
                  </button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      pageSize={pageSize}
      totalCount={filteredQueue.length}
    />
  </div>
);

export function DockableQueueWorkspace({
  appointments,
  onUpdateStatus,
  onViewDetails,
  onBackToDirectory,
  onPatientSelect,
  userRole = "Receptionist",
  onStartConsultation,
  onRefresh,
}: {
  appointments: AppointmentRecord[];
  onUpdateStatus: (
    aptId: string | number,
    status: AppointmentStatus,
    toastMsg: string,
  ) => void;
  onViewDetails: (apt: AppointmentRecord) => void;
  onBookClick?: () => void;
  onBackToDirectory?: () => void;
  onPatientSelect?: (id: number | string) => void;
  userRole?: UserRole;
  onStartConsultation?: (apt?: AppointmentRecord | null) => void;
  onRefresh?: () => void;
}) {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [doctorFilter] = useState("All");
  const [deptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [visitTypeFilter, setVisitTypeFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState("All");

  const isDoctor = userRole === "Doctor";
  const isNurse = userRole === "Nurse";

  const { startConsultation: apiStartConsultation } = useConsultation();

  const handleStartConsultationAction = async (
    apt?: AppointmentRecord | null,
  ) => {
    const targetApt = apt || currentPatient;
    const fallbackId = targetApt?.id || targetApt?.appointmentId;

    if (targetApt) {
      try {
        // Trigger Encounter API (POST /api/v1/encounters & PATCH /api/v1/doctor/appointments/{id}/start)
        const encRes = await apiStartConsultation(targetApt).catch((err) => {
          console.warn("Encounter API start consultation warning:", err);
          return null;
        });

        const encId =
          encRes?.encounterId || encRes?.consultationId || fallbackId;

        // Call parent callback if provided
        onStartConsultation?.(targetApt);

        // Always navigate to Start Consultation workspace
        if (encId) {
          navigate(
            ROUTES.DOCTOR_CONSULTATION_ID
              ? ROUTES.DOCTOR_CONSULTATION_ID.replace(
                ":consultationId",
                String(encId),
              )
              : `/doctor/consultation/${encId}`,
          );
        } else {
          navigate(ROUTES.DOCTOR_CONSULTATION);
        }
      } catch (err) {
        console.error(
          "Failed to execute encounter start consultation API:",
          err,
        );
        onStartConsultation?.(targetApt);
        if (fallbackId) {
          navigate(
            ROUTES.DOCTOR_CONSULTATION_ID
              ? ROUTES.DOCTOR_CONSULTATION_ID.replace(
                ":consultationId",
                String(fallbackId),
              )
              : `/doctor/consultation/${fallbackId}`,
          );
        }
      }
    } else {
      onStartConsultation?.(null);
      navigate(ROUTES.DOCTOR_CONSULTATION);
    }
  };

  const todayStr = getTodayDateString();

  const todayQueue = useMemo(() => {
    // Doctor-eligible statuses: only show patients ready for consultation
    const doctorEligibleStatuses = new Set([
      "Waiting for Doctor",
      "Waiting",
      "Called",
      "In Consultation",
      "In Progress",
      "Completed",
    ]);

    let list = appointments.filter(
      (a) => normalizeDateString(a.appointmentDate) === todayStr,
    );
    if (isDoctor) {
      // Doctors only see patients ready for consultation — NOT waiting for vitals or just checked-in
      // Filter by current user's doctorId when available, otherwise show all eligible
      list = list.filter((a) => doctorEligibleStatuses.has(a.status));
    }
    return list;
  }, [appointments, todayStr, isDoctor]);

  const waitingPatients = todayQueue.filter(
    (a) => a.status === "Waiting for Doctor" || a.status === "Waiting",
  );
  const checkedInPatients = todayQueue.filter(
    (a) => a.status === "Checked-In" || a.status === "Waiting for Vitals",
  );
  const inConsultationPatients = todayQueue.filter(
    (a) => a.status === "In Consultation" || a.status === "In Progress",
  );
  const readyPatients = todayQueue.filter(
    (a) =>
      a.status === "In Consultation" ||
      a.status === "In Progress" ||
      a.status === "Called" ||
      a.status === "Waiting for Doctor",
  );
  const completedPatients = todayQueue.filter((a) => a.status === "Completed");

  const totalCount = todayQueue.length;
  const completedCount = completedPatients.length;

  // Current Patient (In Progress or first Waiting/Checked-In)
  // Doctors must NOT see patients who are still waiting for nurse vitals
  const currentPatient =
    readyPatients[0] ||
    waitingPatients.filter(
      (a) => a.status !== "Waiting for Vitals" && a.status !== "Checked-In",
    )[0] ||
    null;

  const filteredQueue = useMemo(() => {
    return todayQueue.filter((q) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const match =
          String(q.tokenNo || "")
            .toLowerCase()
            .includes(query) ||
          q.patientName.toLowerCase().includes(query) ||
          String(q.id).toLowerCase().includes(query) ||
          String(q.mrn || "")
            .toLowerCase()
            .includes(query);
        if (!match) return false;
      }
      if (doctorFilter !== "All" && q.doctorName !== doctorFilter) return false;
      if (deptFilter !== "All" && q.department !== deptFilter) return false;
      if (statusFilter !== "All" && q.status !== statusFilter) return false;
      if (visitTypeFilter !== "All" && q.visitType !== visitTypeFilter)
        return false;
      if (
        timeFilter === "Morning" &&
        (String(q.timeSlot || "").includes("PM") ||
          parseInt(String(q.timeSlot || "0")) >= 12)
      )
        return false;
      if (timeFilter === "Afternoon" && String(q.timeSlot || "").includes("AM"))
        return false;
      return true;
    });
  }, [
    todayQueue,
    searchQuery,
    doctorFilter,
    deptFilter,
    statusFilter,
    visitTypeFilter,
    timeFilter,
  ]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(filteredQueue.length / pageSize);
  const paginatedQueue = filteredQueue.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setVisitTypeFilter("All");
    setTimeFilter("All");
  };

  return (
    <div
      className="space-y-6 transition-opacity duration-200"
      style={{ fontFamily: RB }}
    >
      <WorkspaceHeader
        onBackToDirectory={onBackToDirectory}
        isNurse={isNurse}
        isDoctor={isDoctor}
        onRefresh={onRefresh}
        startTransition={startTransition}
        isPending={isPending}
        onStartConsultation={handleStartConsultationAction}
        currentPatient={currentPatient}
      />

      <WorkspaceFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        visitTypeFilter={visitTypeFilter}
        setVisitTypeFilter={setVisitTypeFilter}
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        handleResetFilters={handleResetFilters}
      />

      <WorkspaceKPIs
        isNurse={isNurse}
        totalCount={totalCount}
        waitingPatients={waitingPatients}
        checkedInPatients={checkedInPatients}
        inConsultationPatients={inConsultationPatients}
        readyPatients={readyPatients}
        completedCount={completedCount}
      />

      {(isDoctor || isNurse) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <WorkspaceCurrentPatient
            currentPatient={currentPatient}
            onPatientSelect={onPatientSelect}
            isDoctor={isDoctor}
            onStartConsultation={handleStartConsultationAction}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 space-y-4">
          <WorkspaceQueueTable
            filteredQueue={filteredQueue}
            paginatedQueue={paginatedQueue}
            onViewDetails={onViewDetails}
            onPatientSelect={onPatientSelect}
            isNurse={isNurse}
            isDoctor={isDoctor}
            onStartConsultation={handleStartConsultationAction}
            onUpdateStatus={onUpdateStatus}
            onBackToDirectory={onBackToDirectory}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
          />
        </div>
      </div>
    </div>
  );
}
