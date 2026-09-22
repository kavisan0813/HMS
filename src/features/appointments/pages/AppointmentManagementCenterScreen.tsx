import { useState, useMemo, useEffect, useReducer } from "react";
import { useNavigate } from "react-router";
import { ROUTES } from "../../../app/routes/routes";
import {
  CheckCircle2,
  ChevronRight,
  Search,
  Filter,
  X,
  Plus,
  Eye,
  RotateCcw,
  Building2,
  Ban,
  Calendar as CalendarIcon,
  Stethoscope,
  User,
  UserPlus,
  Clock,
  Calendar,
  UserCheck,
  ArrowLeft,
} from "lucide-react";
import { DataTable } from "../../../common/components/DataTable";
import { PP, RB } from "../constants/appointment.constants";
import { appointmentService } from "../services/appointment.service";
import { useAppointments } from "../hooks/useAppointments";
import {
  formatTime,
  to24Hour,
  getTodayDateString,
  normalizeDateString,
} from "../../../lib/time-utils";
import type { AppointmentRecord } from "../types/appointment.types";
import type { UserRole } from "../types/appointment-screen.types";
import { DockableQueueWorkspace } from "../components/DockableQueueWorkspace";
import { BookAppointmentDrawer } from "../components/BookAppointmentDrawer";
import { EditAppointmentDrawer } from "../components/EditAppointmentDrawer";
import { AppointmentDetailsDrawer } from "../components/AppointmentDetailsDrawer";
import { RescheduleAppointmentConfirmationDialog } from "../components/RescheduleAppointmentConfirmationDialog";
import { CancelAppointmentConfirmationDialog } from "../components/CancelAppointmentConfirmationDialog";
import { StatusBadge } from "../components/StatusBadge";
import { Avatar } from "../components/Avatar";
import { CheckInConfirmationModal } from "../../reception/components/CheckInConfirmationModal";
import { AppointmentDatePickerFilter } from "../components/AppointmentDatePickerFilter";
import { useAuthStore } from "../../auth/store/auth.store";
import type { Props } from "../components/Appointment/Appoinment";

interface FilterState {
  searchQuery: string;
  statusFilter: string;
  doctorFilter: string;
  deptFilter: string;
  visitTypeFilter: string;
}

type FilterAction = {
  type: "SET_FIELD";
  field: keyof FilterState;
  value: string;
};

const filterReducer = (
  state: FilterState,
  action: FilterAction,
): FilterState => ({
  ...state,
  [action.field]: action.value,
});

export function AppointmentManagementCenterScreen({
  onPatientSelect,
  onStartConsultation,
  onBookAppointmentClick,
  userRole: userRoleProp,
  onBack,
  onRegisterNewPatientClick,
  onRegisterPatientClick,
}: Props) {
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const activeRoleStr = authUser?.role
    ? String(authUser.role).toUpperCase() === "NURSE"
      ? "Nurse"
      : String(authUser.role).toUpperCase() === "DOCTOR"
        ? "Doctor"
        : "Receptionist"
    : "Receptionist";
  const userRole = userRoleProp || activeRoleStr;
  const todayDateStr = getTodayDateString();
  const [dateFilter, setDateFilter] = useState<string>(todayDateStr);
  const normalizedRole = String(userRole || "").toUpperCase();
  const isDoctor = normalizedRole === "DOCTOR";
  const isNurse = normalizedRole === "NURSE";

  const [filters, dispatch] = useReducer(filterReducer, {
    searchQuery: "",
    statusFilter: "All",
    doctorFilter: "All",
    deptFilter: "All",
    visitTypeFilter: "All",
  });
  const setFilter = (field: keyof FilterState, value: string) =>
    dispatch({ type: "SET_FIELD", field, value });

  const { appointments, setAppointments, refetch } = useAppointments(
    userRole as UserRole,
    dateFilter || undefined,
    {
      doctorId:
        filters.doctorFilter !== "All" ? filters.doctorFilter : undefined,
      status: filters.statusFilter !== "All" ? filters.statusFilter : undefined,
    },
  );
  const [viewMode, setViewMode] = useState<"directory" | "queue">("directory");
  const [deptOptions, setDeptOptions] = useState<string[]>([]);
  const [statusTab, setStatusTab] = useState<string>("All");

  useEffect(() => {
    appointmentService
      .listDepartments()
      .then((data) => {
        const names = data.flatMap((d) =>
          d.departmentName ? [d.departmentName] : [],
        );
        setDeptOptions(names);
      })
      .catch(() => {});
  }, []);

  // Sorting - Default Appointment Time Ascending
  const [sortColumn] = useState<keyof AppointmentRecord>("timeSlot");
  const [sortDirection] = useState<"asc" | "desc">("asc");

  // Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Drawer States
  const [showBookDrawer, setShowBookDrawer] = useState(false);
  const [isWalkInPreset, setIsWalkInPreset] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [detailsApt, setDetailsApt] = useState<AppointmentRecord | null>(null);
  const [editingApt, setEditingApt] = useState<AppointmentRecord | null>(null);

  // Dialog States
  const [rescheduleApt, setRescheduleApt] = useState<AppointmentRecord | null>(
    null,
  );
  const [cancelApt, setCancelApt] = useState<AppointmentRecord | null>(null);
  const [checkInConfirmationApt, setCheckInConfirmationApt] =
    useState<AppointmentRecord | null>(null);
  const [checkInConfirmationToken, setCheckInConfirmationToken] =
    useState<string>("");

  const triggerToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // --- ROLE-BASED APPOINTMENT FILTERING ---
  const roleAppointments = useMemo(() => {
    return appointments;
  }, [appointments]);

  // --- SUMMARY KPI COUNTS ---
  const todayAppointments = roleAppointments.filter(
    (a) => normalizeDateString(a.appointmentDate) === todayDateStr,
  );
  const totalTodayCount = todayAppointments.length;
  const checkedInCount = todayAppointments.filter(
    (a) => a.status === "Checked-In",
  ).length;
  const waitingCount = todayAppointments.filter(
    (a) =>
      a.status === "Waiting" ||
      a.status === "Checked-In" ||
      a.status === "Waiting for Vitals" ||
      a.status === "Waiting for Doctor" ||
      a.status === "Called",
  ).length;
  const inConsultationCount = todayAppointments.filter(
    (a) => a.status === "In Consultation" || a.status === "In Progress",
  ).length;
  const completedCheckInsCount = todayAppointments.filter(
    (a) => a.status === "Completed",
  ).length;
  const walkInCount = todayAppointments.filter(
    (a) => a.visitType === "Walk-In" || a.isWalkIn,
  ).length;
  const followUpCount = roleAppointments.filter(
    (a) => a.visitType === "Follow-up",
  ).length;

  // Doctor List
  const doctorsList = useMemo(() => {
    const filteredByDept =
      filters.deptFilter !== "All"
        ? appointments.filter((a) => a.department === filters.deptFilter)
        : appointments;
    return Array.from(new Set(filteredByDept.map((a) => a.doctorName)));
  }, [appointments, filters.deptFilter]);

  // --- Filtered & Sorted Appointments ---
  const filteredAppointments = useMemo(() => {
    const filtered = roleAppointments.filter((apt) => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const match =
          String(apt.id).toLowerCase().includes(q) ||
          apt.patientName.toLowerCase().includes(q) ||
          apt.doctorName.toLowerCase().includes(q) ||
          String(apt.patientPhone || "")
            .toLowerCase()
            .includes(q) ||
          String(apt.mrn || "")
            .toLowerCase()
            .includes(q);
        if (!match) return false;
      }
      if (filters.statusFilter !== "All") {
        const matchesStatus =
          apt.status === filters.statusFilter ||
          (filters.statusFilter === "Waiting" &&
            (apt.status === "Waiting" ||
              apt.status === "Waiting for Vitals" ||
              apt.status === "Waiting for Doctor" ||
              apt.status === "Called")) ||
          (filters.statusFilter === "In Consultation" &&
            (apt.status === "In Consultation" || apt.status === "In Progress"));
        if (!matchesStatus) return false;
      }
      if (
        filters.doctorFilter !== "All" &&
        apt.doctorName !== filters.doctorFilter
      )
        return false;
      if (filters.deptFilter !== "All" && apt.department !== filters.deptFilter)
        return false;
      if (
        dateFilter &&
        normalizeDateString(apt.appointmentDate) !==
          normalizeDateString(dateFilter)
      )
        return false;
      if (
        filters.visitTypeFilter !== "All" &&
        apt.visitType !== filters.visitTypeFilter
      )
        return false;
      return true;
    });

    return filtered.toSorted((a, b) => {
      let valA = (a as unknown as Record<string, unknown>)[sortColumn];
      let valB = (b as unknown as Record<string, unknown>)[sortColumn];
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if ((valA ?? "") < (valB ?? "")) return sortDirection === "asc" ? -1 : 1;
      if ((valA ?? "") > (valB ?? "")) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [roleAppointments, filters, dateFilter, sortColumn, sortDirection]);

  const handleBookSuccess = async (newApt: AppointmentRecord) => {
    await refetch();
    if (newApt.isWalkIn) {
      triggerToast(`Walk-in patient registered & checked in successfully.`);
    } else {
      triggerToast(`Appointment booked successfully.`);
    }
  };

  const handleOpenEditDrawer = (apt: AppointmentRecord) => {
    setEditingApt(apt);
    setShowEditDrawer(true);
  };

  const handleSaveEditAppointment = (updated: AppointmentRecord) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a)),
    );
    triggerToast(`Appointment updated successfully.`);
  };

  const handleConfirmRescheduleWithDetails = async (
    aptId: string | number,
    newDate: string,
    newTimeSlot: string,
    reason: string,
  ) => {
    await appointmentService.rescheduleAppointment(aptId, {
      appointmentDate: newDate,
      startTime: to24Hour(newTimeSlot),
      reason,
    });
    await refetch();
    triggerToast(`Appointment rescheduled successfully.`);
    setRescheduleApt(null);
  };

  const handleConfirmCancelWithDetails = async (
    aptId: string | number,
    reason: string,
  ) => {
    await appointmentService.cancelAppointment(aptId, { reason });
    await refetch();
    triggerToast(`Appointment cancelled successfully.`);
    setCancelApt(null);
  };

  const handleCheckInPatient = async (
    aptOrId: AppointmentRecord | string | number,
  ) => {
    const targetApt =
      typeof aptOrId === "object"
        ? aptOrId
        : appointments.find((a) => String(a.id) === String(aptOrId)) || null;
    const aptId = typeof aptOrId === "object" ? aptOrId.id : aptOrId;

    try {
      const res = await appointmentService.receptionCheckIn(aptId);
      await refetch();

      interface CheckInResponse {
        tokenNumber?: string | number;
        token?: string | number;
        data?: {
          tokenNumber?: string | number;
          token?: string | number;
        };
      }
      const checkInRes = res as unknown as CheckInResponse;
      const tokenNo =
        checkInRes?.tokenNumber ||
        checkInRes?.token ||
        checkInRes?.data?.tokenNumber ||
        checkInRes?.data?.token ||
        targetApt?.tokenNo ||
        `TK-${aptId}`;

      if (targetApt) {
        setCheckInConfirmationApt(targetApt);
        setCheckInConfirmationToken(String(tokenNo));
      }

      triggerToast(`Patient checked in successfully.`);
    } catch (err) {
      const error = err as Error | null | undefined;
      triggerToast(
        error?.message || "Check-in is only allowed on the appointment date.",
      );
    }
  };

  return (
    <div
      className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F1F5F9]"
      style={{ fontFamily: RB }}
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-5 right-5 z-50 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 transition-opacity duration-200 ${toastType === "error" ? "bg-[#EF4444]" : "bg-[#111827]"}`}
        >
          <CheckCircle2
            size={16}
            className={
              toastType === "error" ? "text-red-200" : "text-[#66BB6A]"
            }
          />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* RENDER QUEUE WORKSPACE IF IN QUEUE VIEW MODE */}
      {viewMode === "queue" ? (
        <DockableQueueWorkspace
          appointments={appointments}
          onUpdateStatus={(id, st, msg) => {
            if (st === "Checked-In") handleCheckInPatient(id);
            else triggerToast(msg);
          }}
          onViewDetails={(apt) => setDetailsApt(apt)}
          onBookClick={() => {
            setIsWalkInPreset(false);
            setShowBookDrawer(true);
          }}
          onBackToDirectory={() => setViewMode("directory")}
          onPatientSelect={onPatientSelect}
          onStartConsultation={(apt) => {
            if (onStartConsultation) {
              onStartConsultation(apt);
            } else {
              const targetId = typeof apt === "object" && apt ? apt.id : apt;
              if (targetId) {
                navigate(
                  ROUTES.DOCTOR_CONSULTATION_ID
                    ? ROUTES.DOCTOR_CONSULTATION_ID.replace(
                        ":consultationId",
                        String(targetId),
                      )
                    : `/doctor/consultation/${targetId}`,
                );
              } else {
                navigate(ROUTES.DOCTOR_CONSULTATION);
              }
            }
          }}
        />
      ) : (
        <>
          {/* ── 1. PAGE HEADER & BREADCRUMB ── */}
          {userRole === "Nurse" ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1
                    className="text-xl font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    Assigned Appointments
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-[#009688] border border-teal-200">
                    Nurse Workspace (Read Only)
                  </span>
                </div>
                <div
                  className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1"
                  style={{ fontFamily: RB }}
                >
                  <span>Nurse</span>
                  <ChevronRight size={13} className="text-slate-300" />
                  <span>Appointment Management</span>
                  <ChevronRight size={13} className="text-slate-300" />
                  <span className="font-medium text-[#111827]">
                    Assigned Appointments
                  </span>
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  Monitor today's patient appointments.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setViewMode("queue")}
                  className="px-3.5 py-2.5 rounded-xl border border-[#0D47A1] bg-blue-50 text-xs font-bold text-[#0D47A1] hover:bg-blue-100 transition-colors flex items-center gap-1.5 shadow-xs"
                  style={{ fontFamily: PP }}
                >
                  <Clock size={15} /> Today's Queue
                </button>
              </div>
            </div>
          ) : userRole === "Doctor" ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1
                    className="text-xl font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    My Appointments
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-[#009688] border border-teal-200">
                    Doctor Workspace
                  </span>
                </div>
                <div
                  className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1"
                  style={{ fontFamily: RB }}
                >
                  <span>Doctor</span>
                  <ChevronRight size={13} className="text-slate-300" />
                  <span className="font-medium text-[#111827]">
                    Appointment Management
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={onBack ? onBack : () => navigate(-1)}
                  className="px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-[#111827] hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  style={{ fontFamily: PP }}
                >
                  <ArrowLeft size={14} /> Back
                </button>

                <button
                  onClick={() => setViewMode("queue")}
                  className="px-3.5 py-2.5 rounded-xl border border-[#0D47A1] bg-blue-50 text-xs font-bold text-[#0D47A1] hover:bg-blue-100 transition-colors flex items-center gap-1.5 shadow-xs"
                  style={{ fontFamily: PP }}
                >
                  <Clock size={15} /> Today's Queue
                </button>

                <button
                  onClick={() => {
                    const nextApt = roleAppointments.find(
                      (a) =>
                        a.status === "Checked-In" ||
                        a.status === "Waiting" ||
                        a.status === "In Progress" ||
                        a.status === "Waiting for Doctor" ||
                        a.status === "Called",
                    );
                    if (nextApt && onStartConsultation)
                      onStartConsultation(nextApt);
                    else if (nextApt && onPatientSelect)
                      onPatientSelect(nextApt.patientId);
                    else
                      triggerToast("No active patient ready for consultation.");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#009688] text-white text-xs font-bold hover:bg-[#00796B] transition-colors flex items-center gap-2 shadow-sm"
                  style={{ fontFamily: PP }}
                >
                  <Stethoscope size={15} /> Start Consultation
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1
                    className="text-xl font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    {userRole === "Hospital Admin" || userRole === "Super Admin"
                      ? "Hospital Appointment Control Center"
                      : "Appointment Management"}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${userRole === "Hospital Admin" || userRole === "Super Admin" ? "bg-blue-50 text-[#0D47A1] border-blue-200" : "bg-teal-50 text-[#009688] border-teal-200"}`}
                  >
                    {userRole === "Hospital Admin"
                      ? "Hospital Admin"
                      : userRole === "Super Admin"
                        ? "Super Admin"
                        : "Reception Desk"}
                  </span>
                </div>
                <div
                  className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1"
                  style={{ fontFamily: RB }}
                >
                  <span>
                    {userRole === "Hospital Admin"
                      ? "Hospital Administration"
                      : "Front Desk Reception"}
                  </span>
                  <ChevronRight size={13} className="text-slate-300" />
                  <span className="font-medium text-[#111827]">
                    {userRole === "Hospital Admin"
                      ? "Enterprise Appointments & Operations"
                      : "Today's Appointment Desk"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => {
                    if (onBookAppointmentClick) {
                      onBookAppointmentClick();
                    } else {
                      navigate(ROUTES.BOOK_APPOINTMENT);
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#0c3d8a] transition-colors flex items-center gap-2 shadow-sm"
                  style={{ fontFamily: PP }}
                >
                  <Plus size={15} /> Book Appointment
                </button>
              </div>
            </div>
          )}
          {/* ── 2. KPI CARDS ROW (TOP SECTION) ── */}
          {userRole === "Doctor" ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#64748B] font-medium">
                    Today's Appointments
                  </div>
                  <div
                    className="text-2xl font-bold text-[#111827] mt-0.5"
                    style={{ fontFamily: PP }}
                  >
                    {totalTodayCount}
                  </div>
                  <div className="text-[10px] text-[#0D47A1] font-medium mt-1">
                    My schedule today
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#0D47A1]">
                  <Calendar size={18} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#64748B] font-medium">
                    Patients Waiting
                  </div>
                  <div
                    className="text-2xl font-bold text-[#F59E0B] mt-0.5"
                    style={{ fontFamily: PP }}
                  >
                    {waitingCount}
                  </div>
                  <div className="text-[10px] text-amber-600 font-medium mt-1">
                    Arrived in lounge
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-[#F59E0B]">
                  <Clock size={18} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#64748B] font-medium">
                    In Consultation
                  </div>
                  <div
                    className="text-2xl font-bold text-[#009688] mt-0.5"
                    style={{ fontFamily: PP }}
                  >
                    {inConsultationCount}
                  </div>
                  <div className="text-[10px] text-teal-600 font-medium mt-1">
                    Active in room
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-[#009688]">
                  <Stethoscope size={18} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#64748B] font-medium">
                    Completed Today
                  </div>
                  <div
                    className="text-2xl font-bold text-[#66BB6A] mt-0.5"
                    style={{ fontFamily: PP }}
                  >
                    {completedCheckInsCount}
                  </div>
                  <div className="text-[10px] text-green-600 font-medium mt-1">
                    Finished visits
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-[#66BB6A]">
                  <CheckCircle2 size={18} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#64748B] font-medium">
                    Follow-up Visits
                  </div>
                  <div
                    className="text-2xl font-bold text-[#0D47A1] mt-0.5"
                    style={{ fontFamily: PP }}
                  >
                    {followUpCount}
                  </div>
                  <div className="text-[10px] text-blue-600 font-medium mt-1">
                    Review patients
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#0D47A1]">
                  <UserCheck size={18} />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#64748B] font-medium">
                    Today's Appointments
                  </div>
                  <div
                    className="text-2xl font-bold text-[#111827] mt-0.5"
                    style={{ fontFamily: PP }}
                  >
                    {totalTodayCount}
                  </div>
                  <div className="text-[10px] text-[#0D47A1] font-medium mt-1">
                    Scheduled today
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#0D47A1]">
                  <Calendar size={18} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#64748B] font-medium">
                    Checked-In Patients
                  </div>
                  <div
                    className="text-2xl font-bold text-[#0D47A1] mt-0.5"
                    style={{ fontFamily: PP }}
                  >
                    {checkedInCount}
                  </div>
                  <div className="text-[10px] text-blue-600 font-medium mt-1">
                    Arrived at desk
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-[#0D47A1]">
                  <UserCheck size={18} />
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
                    {waitingCount}
                  </div>
                  <div className="text-[10px] text-amber-600 font-medium mt-1">
                    In OPD lounge
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-[#F59E0B]">
                  <Clock size={18} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#64748B] font-medium">
                    Completed Check-Ins
                  </div>
                  <div
                    className="text-2xl font-bold text-[#66BB6A] mt-0.5"
                    style={{ fontFamily: PP }}
                  >
                    {completedCheckInsCount}
                  </div>
                  <div className="text-[10px] text-green-600 font-medium mt-1">
                    Consulted & done
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center text-[#66BB6A]">
                  <CheckCircle2 size={18} />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#64748B] font-medium">
                    Walk-In Registrations
                  </div>
                  <div
                    className="text-2xl font-bold text-[#009688] mt-0.5"
                    style={{ fontFamily: PP }}
                  >
                    {walkInCount}
                  </div>
                  <div className="text-[10px] text-teal-600 font-medium mt-1">
                    Direct OPD arrivals
                  </div>
                </div>
                <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-[#009688]">
                  <UserPlus size={18} />
                </div>
              </div>
            </div>
          )}

          {/* ── 3. STANDALONE STATUS TAB NAVBAR (BELOW KPI CARDS / TOP NAVBAR) ── */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-2 shadow-xs flex items-center gap-2 overflow-x-auto">
            {[
              {
                id: "All",
                label: "All Appointments",
                count: roleAppointments.length,
              },
              {
                id: "Waiting",
                label: "Waiting Patients",
                count: roleAppointments.filter(
                  (a) =>
                    a.status === "Waiting" ||
                    a.status === "Waiting for Vitals" ||
                    a.status === "Waiting for Doctor" ||
                    a.status === "Called",
                ).length,
              },
              {
                id: "Checked-In",
                label: "Checked-In",
                count: roleAppointments.filter((a) => a.status === "Checked-In")
                  .length,
              },
              {
                id: "Completed",
                label: "Completed",
                count: roleAppointments.filter((a) => a.status === "Completed")
                  .length,
              },
              {
                id: "Cancelled",
                label: "Cancelled",
                count: roleAppointments.filter((a) => a.status === "Cancelled")
                  .length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusTab(tab.id);
                  if (tab.id !== "All" && tab.id !== "Waiting") {
                    setFilter("statusFilter", tab.id);
                  } else {
                    setFilter("statusFilter", "All");
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  statusTab === tab.id
                    ? "bg-[#0D47A1] text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 border border-[#E5E7EB] hover:bg-slate-100"
                }`}
                style={{ fontFamily: PP }}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    statusTab === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* ── 4. MAIN WORKSPACE CONTAINER: APPOINTMENT DATA TABLE WITH MERGED TOOLBAR ── */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden flex flex-col p-5 space-y-4">
            {/* MERGED SEARCH & FILTER CONTROLS TOOLBAR INSIDE TABLE CONTAINER */}
            <div className="bg-slate-50/80 border border-[#E5E7EB] rounded-xl p-3 space-y-2.5 shadow-2xs">
              {/* Search Input */}
              <div className="relative w-full">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  aria-label="Input field"
                  type="text"
                  value={filters.searchQuery}
                  onChange={(e) => setFilter("searchQuery", e.target.value)}
                  placeholder=" Search by Patient Name, MRN, Appointment ID..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] shadow-2xs transition-all placeholder:text-slate-400"
                />
                {filters.searchQuery && (
                  <button
                    aria-label="Close"
                    onClick={() => setFilter("searchQuery", "")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Filter Controls Row */}
              <div className="flex items-center gap-2 flex-wrap text-xs pt-1 border-t border-slate-200/70">
                <AppointmentDatePickerFilter
                  selectedDate={dateFilter}
                  onChange={setDateFilter}
                />

                <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg">
                  <Filter size={12} className="text-slate-400" />
                  <span className="text-slate-500 font-medium text-[11px]">
                    Status:
                  </span>
                  <select
                    aria-label="Select option"
                    value={filters.statusFilter}
                    onChange={(e) => setFilter("statusFilter", e.target.value)}
                    className="bg-transparent font-semibold text-[#0D47A1] text-xs outline-none cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Booked">Booked</option>
                    <option value="Checked-In">Checked-In</option>
                    <option value="Waiting for Vitals">
                      Waiting for Vitals
                    </option>
                    <option value="Waiting for Doctor">
                      Waiting for Doctor
                    </option>
                    <option value="Called">Called</option>
                    <option value="In Consultation">In Consultation</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="No Show">No Show</option>
                  </select>
                </div>

                {userRole !== "Doctor" && (
                  <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg">
                    <Stethoscope size={12} className="text-slate-400" />
                    <span className="text-slate-500 font-medium text-[11px]">
                      Doctor:
                    </span>
                    <select
                      aria-label="Select option"
                      value={filters.doctorFilter}
                      onChange={(e) =>
                        setFilter("doctorFilter", e.target.value)
                      }
                      className="bg-transparent font-semibold text-[#0D47A1] text-xs outline-none cursor-pointer"
                    >
                      <option value="All">All Doctors</option>
                      {doctorsList.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg">
                  <Building2 size={12} className="text-slate-400" />
                  <span className="text-slate-500 font-medium text-[11px]">
                    Dept:
                  </span>
                  <select
                    aria-label="Select option"
                    value={filters.deptFilter}
                    onChange={(e) => {
                      const selectedDeptVal = e.target.value;
                      setFilter("deptFilter", selectedDeptVal);
                      if (
                        selectedDeptVal !== "All" &&
                        filters.doctorFilter !== "All"
                      ) {
                        const doctorInDept = appointments.some(
                          (a) =>
                            a.department === selectedDeptVal &&
                            a.doctorName === filters.doctorFilter,
                        );
                        if (!doctorInDept) {
                          setFilter("doctorFilter", "All");
                        }
                      }
                    }}
                    className="bg-transparent font-semibold text-[#0D47A1] text-xs outline-none cursor-pointer"
                  >
                    <option value="All">All Departments</option>
                    {deptOptions.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] px-2.5 py-1 rounded-lg">
                  <Building2 size={12} className="text-slate-400" />
                  <span className="text-slate-500 font-medium text-[11px]">
                    Visit Type:
                  </span>
                  <select
                    aria-label="Select option"
                    value={filters.visitTypeFilter}
                    onChange={(e) =>
                      setFilter("visitTypeFilter", e.target.value)
                    }
                    className="bg-transparent font-semibold text-[#0D47A1] text-xs outline-none cursor-pointer"
                  >
                    <option value="All">All Visit Types</option>
                    <option value="First Visit">First Visit</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Walk-In">Walk-In</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setFilter("searchQuery", "");
                    setFilter("statusFilter", "All");
                    setFilter("doctorFilter", "All");
                    setFilter("deptFilter", "All");
                    setDateFilter(todayDateStr);
                    setFilter("visitTypeFilter", "All");
                    triggerToast("Filters reset.");
                  }}
                  className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  title="Reset Filters"
                >
                  <RotateCcw size={12} /> Clear Filters
                </button>
              </div>
            </div>

            {/* ── 4. MAIN WORKSPACE GRID: ENTERPRISE DATA TABLE + RIGHT CONTEXT PANEL ── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Table Column */}
              <div className="lg:col-span-4 space-y-6">
                <DataTable
                  data={filteredAppointments}
                  columns={[
                    {
                      key: "patientName",
                      label: "PATIENT",
                      sortable: true,
                      getValue: (apt) => apt.patientName,
                      render: (apt) => (
                        <div
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              (e.currentTarget as HTMLElement).click();
                            }
                          }}
                          role="button"
                          onClick={() => onPatientSelect?.(apt.patientId)}
                          className="flex items-center gap-2 cursor-pointer hover:underline"
                        >
                          <Avatar name={apt.patientName} size="sm" />
                          <div>
                            <span
                              className="font-bold text-[#111827] block"
                              style={{ fontFamily: PP }}
                            >
                              {apt.patientName}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {apt.patientPhone}
                            </span>
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "appointmentNumber",
                      label: "APPOINTMENT ID",
                      sortable: true,
                      getValue: (apt) => apt.appointmentNumber || apt.id,
                      render: (apt) => (
                        <span className="font-mono font-bold text-[#0D47A1]">
                          {apt.appointmentNumber || apt.id}
                        </span>
                      ),
                    },
                    {
                      key: "mrn",
                      label: "MRN",
                      sortable: true,
                      getValue: (apt) => apt.mrn,
                      render: (apt) => (
                        <span className="font-mono text-[#0D47A1] font-bold">
                          {apt.mrn}
                        </span>
                      ),
                    },
                    {
                      key: "doctorName",
                      label: "DOCTOR",
                      sortable: true,
                      visible: !isDoctor,
                      getValue: (apt) =>
                        typeof apt.doctorName === "string"
                          ? apt.doctorName
                          : (
                              apt.doctorName as unknown as Record<
                                string,
                                string
                              >
                            )?.name || "",
                      render: (apt) => (
                        <div>
                          <div className="font-semibold text-[#111827]">
                            {typeof apt.doctorName === "string"
                              ? apt.doctorName
                              : (
                                  apt.doctorName as unknown as Record<
                                    string,
                                    string
                                  >
                                )?.name ||
                                (
                                  apt.doctorName as unknown as Record<
                                    string,
                                    string
                                  >
                                )?.fullName ||
                                "—"}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {apt.opdRoom}
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "department",
                      label: "DEPARTMENT",
                      sortable: true,
                      visible: !isDoctor,
                      getValue: (apt) =>
                        typeof apt.department === "string"
                          ? apt.department
                          : apt.department?.departmentName ||
                            apt.department?.name ||
                            "",
                      render: (apt) => (
                        <span className="font-medium text-slate-700">
                          {typeof apt.department === "string"
                            ? apt.department
                            : apt.department?.departmentName ||
                              apt.department?.name ||
                              ""}
                        </span>
                      ),
                    },
                    {
                      key: "timeSlot",
                      label: "APPOINTMENT TIME",
                      sortable: true,
                      getValue: (apt) => apt.timeSlot || "",
                      render: (apt) => (
                        <span className="font-mono text-[#0D47A1] font-bold">
                          {formatTime(apt.timeSlot)}
                        </span>
                      ),
                    },
                    {
                      key: "status",
                      label: "STATUS",
                      sortable: true,
                      getValue: (apt) => apt.status,
                      render: (apt) => <StatusBadge status={apt.status} />,
                    },
                    {
                      key: "actions",
                      label: "ACTIONS",
                      sortable: false,
                      align: "right",
                      render: (apt) => (
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isNurse ? (
                            <div className="flex items-center justify-end gap-1.5">
                              {onPatientSelect && (
                                <button
                                  onClick={() => onPatientSelect(apt.patientId)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200 hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                                  title="View Patient Profile"
                                >
                                  <User size={12} /> Profile
                                </button>
                              )}
                              <button
                                onClick={() => setDetailsApt(apt)}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#0D47A1] text-[10px] font-bold border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1 cursor-pointer"
                                title="View Appointment Details"
                              >
                                <Eye size={12} /> View
                              </button>
                            </div>
                          ) : isDoctor ? (
                            <button
                              onClick={() => setDetailsApt(apt)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#0D47A1] text-[10px] font-bold border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1 cursor-pointer"
                              title="View Appointment Details"
                            >
                              <Eye size={12} /> View
                            </button>
                          ) : (
                            <>
                              {(apt.status === "Scheduled" ||
                                apt.status === "Booked" ||
                                apt.status === "BOOKED" ||
                                apt.status === "Confirmed" ||
                                apt.status === "CONFIRMED") && (
                                <button
                                  onClick={() => handleCheckInPatient(apt)}
                                  className="px-2 py-1 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 shadow-xs bg-[#0D47A1] text-white hover:bg-[#0c3d8a] cursor-pointer"
                                  title="Check-In Patient"
                                >
                                  <CheckCircle2 size={12} /> Check-In
                                </button>
                              )}

                              {(apt.status === "Booked" ||
                                apt.status === "Confirmed" ||
                                apt.status === "BOOKED" ||
                                apt.status === "CONFIRMED" ||
                                apt.status === "Scheduled") && (
                                <button
                                  onClick={() => setRescheduleApt(apt)}
                                  className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-teal-50 text-[#009688] transition-colors cursor-pointer"
                                  title="Reschedule Appointment"
                                >
                                  <CalendarIcon size={14} />
                                </button>
                              )}

                              {apt.status !== "Completed" &&
                                apt.status !== "Cancelled" &&
                                apt.status !== "No Show" &&
                                apt.status !== "COMPLETED" &&
                                apt.status !== "CANCELLED" &&
                                apt.status !== "NO_SHOW" && (
                                  <button
                                    onClick={() => setCancelApt(apt)}
                                    className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-red-50 text-[#EF4444] transition-colors cursor-pointer"
                                    title="Cancel Appointment"
                                  >
                                    <Ban size={14} />
                                  </button>
                                )}

                              <button
                                onClick={() => setDetailsApt(apt)}
                                className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-blue-50 text-[#0D47A1] transition-colors cursor-pointer"
                                title="View Appointment Details"
                              >
                                <Eye size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      ),
                    },
                  ]}
                  getRowId={(apt) => apt.id}
                  title={
                    <>
                      <Calendar size={16} className="text-[#0D47A1]" />
                      {userRole === "Doctor"
                        ? "Today's Doctor Consultation Appointments"
                        : "Today's Reception Appointment Workload"}
                    </>
                  }
                  headerBadge={
                    <span className="text-xs text-[#64748B]">
                      Showing{" "}
                      <strong className="text-[#111827]">
                        {filteredAppointments.length}
                      </strong>{" "}
                      appointments
                    </span>
                  }
                  searchable={true}
                  searchPlaceholder=" Search appointments by patient name, MRN, ID, doctor..."
                  emptyTitle="No appointments scheduled today."
                  emptySubtitle="All consultation visits for today are completed or no appointments match filters."
                  emptyIcon={<Calendar size={32} />}
                  pagination={true}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* REUSABLE DRAWERS & DIALOGS */}
      <BookAppointmentDrawer
        isOpen={showBookDrawer}
        onClose={() => {
          setShowBookDrawer(false);
          setIsWalkInPreset(false);
        }}
        onBookSuccess={handleBookSuccess}
        onPatientSelect={onPatientSelect}
        onRegisterNewPatientClick={() => {
          if (onRegisterNewPatientClick) onRegisterNewPatientClick();
          else if (onRegisterPatientClick) onRegisterPatientClick();
        }}
        isWalkInPreset={isWalkInPreset}
      />

      <AppointmentDetailsDrawer
        apt={detailsApt}
        isOpen={!!detailsApt}
        onClose={() => setDetailsApt(null)}
        onEditClick={(aptToEdit) => {
          setDetailsApt(null);
          handleOpenEditDrawer(aptToEdit);
        }}
        onPrintClick={(aptToPrint) => {
          triggerToast(`Printing appointment slip for ${aptToPrint.id}...`);
        }}
        onPatientSelect={onPatientSelect}
        userRole={userRole}
        onStartConsultation={() => {
          setDetailsApt(null);
          onStartConsultation?.(detailsApt || undefined);
        }}
        onError={(msg) => triggerToast(msg, "error")}
        onCheckInSuccess={async (token) => {
          await refetch();
          setDetailsApt(null);
          triggerToast(`Patient checked in successfully. Token: ${token}`);
        }}
      />

      <EditAppointmentDrawer
        apt={editingApt}
        isOpen={showEditDrawer}
        onClose={() => {
          setShowEditDrawer(false);
          setEditingApt(null);
        }}
        onSaveSuccess={handleSaveEditAppointment}
        onRescheduleClick={(aptToReschedule) =>
          setRescheduleApt(aptToReschedule)
        }
        onCancelClick={(aptToCancel) => setCancelApt(aptToCancel)}
        onPatientSelect={onPatientSelect}
      />

      <RescheduleAppointmentConfirmationDialog
        apt={rescheduleApt}
        isOpen={!!rescheduleApt}
        onClose={() => setRescheduleApt(null)}
        onConfirmReschedule={handleConfirmRescheduleWithDetails}
      />

      <CancelAppointmentConfirmationDialog
        apt={cancelApt}
        isOpen={!!cancelApt}
        onClose={() => setCancelApt(null)}
        onConfirmCancel={handleConfirmCancelWithDetails}
      />

      {/* Check-In Confirmation Centered Modal Popup */}
      {checkInConfirmationApt && (
        <CheckInConfirmationModal
          isOpen={!!checkInConfirmationApt}
          onClose={() => setCheckInConfirmationApt(null)}
          tokenNumber={
            checkInConfirmationToken ||
            checkInConfirmationApt.tokenNo ||
            `TK-${checkInConfirmationApt.id}`
          }
          patientName={checkInConfirmationApt.patientName}
          patientMrn={checkInConfirmationApt.mrn || ""}
          doctorName={checkInConfirmationApt.doctorName}
          departmentName={
            typeof checkInConfirmationApt.department === "string"
              ? checkInConfirmationApt.department
              : checkInConfirmationApt.department?.departmentName ||
                checkInConfirmationApt.department?.name ||
                checkInConfirmationApt.department?.departmentCode ||
                ""
          }
          appointmentTime={checkInConfirmationApt.timeSlot}
          status="Waiting for Vitals"
        />
      )}
    </div>
  );
}
