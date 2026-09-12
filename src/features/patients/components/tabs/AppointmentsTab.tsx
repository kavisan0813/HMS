import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Eye,
  Plus,
  RotateCcw,
} from "lucide-react";
import type { Patient, ApiPatientAppointment } from "../../types/patient.types";
import type { AppointmentRecord } from "../../../appointments/types/appointment.types";
import { PP, RB } from "../../../doctors/constants/doctors.constants";
import { patientsApi } from "../../api/patient.api";
import { appointmentService } from "../../../appointments/services/appointment.service";
import { RescheduleAppointmentConfirmationDialog } from "../../../appointments/components/RescheduleAppointmentConfirmationDialog";
import { PatientCancelAppointmentDialog } from "../PatientDialogs";
import { AppointmentDetailsDrawer } from "../../../appointments/components/AppointmentDetailsDrawer";
import { DataTable } from "../../../../common/components/DataTable";

export interface AppointmentsTabProps {
  patient: Patient;
  canEdit: boolean;
  isOwnProfile: boolean;
  onBookAppointment?: (mrn?: string) => void;
}

type TabFilterType = "all" | "upcoming" | "completed" | "cancelled";

const extractCleanString = (val: unknown, fallback: string = ""): string => {
  if (!val) return fallback;
  if (typeof val === "string") {
    const s = val.trim();
    if (!s || s === "[object Object]") return fallback;
    return s;
  }
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    if (
      "fullName" in obj &&
      obj.fullName != null &&
      String(obj.fullName).trim()
    )
      return String(obj.fullName).trim();
    if (
      "doctorName" in obj &&
      obj.doctorName != null &&
      String(obj.doctorName).trim()
    )
      return String(obj.doctorName).trim();
    if (
      "departmentName" in obj &&
      obj.departmentName != null &&
      String(obj.departmentName).trim()
    )
      return String(obj.departmentName).trim();
    if ("name" in obj && obj.name != null && String(obj.name).trim())
      return String(obj.name).trim();
    if ("title" in obj && obj.title != null && String(obj.title).trim())
      return String(obj.title).trim();
    if ("label" in obj && obj.label != null && String(obj.label).trim())
      return String(obj.label).trim();
    if ("display" in obj && obj.display != null && String(obj.display).trim())
      return String(obj.display).trim();
  }
  return fallback;
};

function formatAppointmentId(rawId: string | number): string {
  const str = String(rawId || "").trim();
  if (!str) return "APT-20260826-0001";
  if (str.startsWith("APT-")) return str;
  if (/^\d{8}-\d{4}$/.test(str)) return `APT-${str}`;
  return `APT-${str}`;
}

function renderStatusBadge(status?: string) {
  const s = (status || "Scheduled").trim();
  const upper = s.toUpperCase();
  let badgeStyle = "bg-blue-50 text-[#0D47A1] border-blue-200";

  if (upper === "COMPLETED") {
    badgeStyle = "bg-emerald-50 text-emerald-600 border-emerald-200";
  } else if (upper === "CANCELLED") {
    badgeStyle = "bg-red-50 text-red-600 border-red-200";
  } else if (upper === "NO SHOW" || upper === "NO_SHOW") {
    badgeStyle = "bg-slate-100 text-slate-600 border-slate-200";
  } else if (
    upper === "SCHEDULED" ||
    upper === "CONFIRMED" ||
    upper === "BOOKED" ||
    upper === "PENDING"
  ) {
    badgeStyle = "bg-[#0D47A1]/10 text-[#0D47A1] border-blue-200";
  } else if (upper.includes("CONSULTATION") || upper.includes("CHECKED")) {
    badgeStyle = "bg-sky-50 text-sky-700 border-sky-200";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeStyle}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {s}
    </span>
  );
}

export function PatientAppointmentsTab({
  patient,
  canEdit,
  isOwnProfile,
  onBookAppointment,
}: AppointmentsTabProps) {
  const [appointments, setAppointments] = useState<ApiPatientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [prevMrn, setPrevMrn] = useState<string | null>(null);

  // Search, Status Dropdown, Department Filter, and Active Tab Pill state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusDropdown, setStatusDropdown] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [activeTabPill, setActiveTabPill] = useState<TabFilterType>("all");

  // Dialog & Drawer state
  const [reschedulingAppt, setReschedulingAppt] =
    useState<AppointmentRecord | null>(null);
  const [cancellingAppt, setCancellingAppt] =
    useState<ApiPatientAppointment | null>(null);
  const [selectedDetailsAppt, setSelectedDetailsAppt] =
    useState<AppointmentRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (patient.mrn !== prevMrn) {
    setPrevMrn(patient.mrn);
    setLoading(true);
  }

  const loadAppointmentsData = useCallback(async () => {
    try {
      const data = await patientsApi.getAppointments(patient.mrn);
      setAppointments(data || []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [patient.mrn]);

  useEffect(() => {
    let active = true;

    patientsApi
      .getAppointments(patient.mrn)
      .then((data) => {
        if (active) {
          setAppointments(data || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setAppointments([]);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [patient.mrn]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const safeAppointments = useMemo(
    () => (Array.isArray(appointments) ? appointments : []),
    [appointments],
  );

  // Extract unique departments for dropdown
  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    safeAppointments.forEach((a) => {
      const dept = extractCleanString(a.department, "");
      if (dept) set.add(dept);
    });
    return Array.from(set);
  }, [safeAppointments]);

  // Metric counts
  const counts = useMemo(() => {
    let upcoming = 0;
    let completed = 0;
    let cancelled = 0;

    safeAppointments.forEach((a) => {
      const s = (a.status || "").toUpperCase();
      if (["SCHEDULED", "CONFIRMED", "BOOKED", "PENDING"].includes(s)) {
        upcoming++;
      } else if (s === "COMPLETED") {
        completed++;
      } else if (s === "CANCELLED") {
        cancelled++;
      }
    });

    return {
      all: safeAppointments.length,
      upcoming,
      completed,
      cancelled,
    };
  }, [safeAppointments]);

  // Filtered List based on tab pill, search, dropdowns, and own profile rules
  const filteredAppointments = useMemo(() => {
    return safeAppointments.filter((a) => {
      const statusUpper = (a.status || "").toUpperCase();
      const docName = extractCleanString(
        a.doctor || a.doctorName,
        "",
      ).toLowerCase();
      const deptName = extractCleanString(a.department, "").toLowerCase();
      const apptId = formatAppointmentId(a.id).toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      // Tab Pill Filter
      if (activeTabPill === "upcoming") {
        if (
          !["SCHEDULED", "CONFIRMED", "BOOKED", "PENDING"].includes(statusUpper)
        ) {
          return false;
        }
      } else if (activeTabPill === "completed") {
        if (statusUpper !== "COMPLETED") return false;
      } else if (activeTabPill === "cancelled") {
        if (statusUpper !== "CANCELLED") return false;
      }

      // Own Profile Filter
      if (isOwnProfile && activeTabPill === "all") {
        if (statusUpper === "CANCELLED" || statusUpper === "COMPLETED") {
          return false;
        }
      }

      // Status Dropdown Filter
      if (statusDropdown !== "ALL") {
        if (statusUpper !== statusDropdown) return false;
      }

      // Department Dropdown Filter
      if (departmentFilter !== "ALL") {
        if (deptName !== departmentFilter.toLowerCase()) return false;
      }

      // Search Query
      if (q) {
        return (
          apptId.includes(q) || docName.includes(q) || deptName.includes(q)
        );
      }

      return true;
    });
  }, [
    safeAppointments,
    activeTabPill,
    searchQuery,
    statusDropdown,
    departmentFilter,
    isOwnProfile,
  ]);

  const isFilterActive =
    searchQuery.trim() !== "" ||
    statusDropdown !== "ALL" ||
    departmentFilter !== "ALL" ||
    activeTabPill !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusDropdown("ALL");
    setDepartmentFilter("ALL");
    setActiveTabPill("all");
  };

  const handleConfirmReschedule = async (
    aptId: string | number,
    newDate: string,
    newTimeSlot: string,
    reason: string,
  ) => {
    try {
      await appointmentService.rescheduleAppointment(aptId, {
        appointmentDate: newDate,
        startTime: newTimeSlot,
        reason,
      });
      triggerToast(
        `Appointment ${aptId} rescheduled to ${newDate} at ${newTimeSlot}`,
      );
      loadAppointmentsData();
    } catch {
      triggerToast(`Failed to reschedule appointment ${aptId}`);
    }
  };

  const handleConfirmCancel = async (
    id: string,
    reason: string,
    comments?: string,
  ) => {
    try {
      await appointmentService.cancelAppointment(id, {
        reason: reason || comments || "Patient request",
      });
      triggerToast(`Appointment ${id} cancelled successfully.`);
      loadAppointmentsData();
    } catch {
      triggerToast(`Failed to cancel appointment ${id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-xs text-[#64748B]">
        Loading appointments...
      </div>
    );
  }

  const patientDisplayName = patient.fullName || patient.name || "Patient";

  return (
    <div className="space-y-5" style={{ fontFamily: RB }}>
      {/* Toast Banner */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#111827] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl">
          {toastMsg}
        </div>
      )}

      {/* 1. Header with Book Appointment Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3
            className="text-sm font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            My Appointments
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Manage your upcoming and previous appointments.
          </p>
        </div>

        {onBookAppointment && (
          <button
            type="button"
            onClick={() => onBookAppointment(patient.mrn)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#0c3d8a] transition-colors shadow-sm cursor-pointer"
            style={{ fontFamily: PP }}
          >
            <Plus size={15} /> Book Appointment
          </button>
        )}
      </div>

      {/* 2. KPI Summary Cards (Exact matching screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Upcoming Appointments */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Upcoming Appointments
            </span>
            <div
              className="text-2xl font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              {counts.upcoming}
            </div>
            <span className="text-[10px] text-slate-400 block">
              Scheduled &amp; Confirmed
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0D47A1] flex items-center justify-center shrink-0 border border-blue-100">
            <Calendar size={18} />
          </div>
        </div>

        {/* Completed Appointments */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Completed Appointments
            </span>
            <div
              className="text-2xl font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              {counts.completed}
            </div>
            <span className="text-[10px] text-[#66BB6A] font-semibold block">
              ✔ Past Consultations
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle size={18} />
          </div>
        </div>

        {/* Cancelled Appointments */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Cancelled Appointments
            </span>
            <div
              className="text-2xl font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              {counts.cancelled}
            </div>
            <span className="text-[10px] text-red-500 font-semibold block">
              Cancelled Requests
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0 border border-red-100">
            <XCircle size={18} />
          </div>
        </div>
      </div>

      {/* 3. Search and Dropdown Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by Doctor Name, Appointment ID, Department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0D47A1] focus:bg-white transition-colors"
            />
          </div>

          {/* Status & Department Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusDropdown}
              onChange={(e) => setStatusDropdown(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#0D47A1] cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO SHOW">No Show</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#0D47A1] cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-[#0D47A1] hover:underline px-2 py-1 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={12} /> Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Filter Tab Pills (All / Upcoming / Completed / Cancelled) */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] pb-2 overflow-x-auto">
        {[
          { id: "all", label: "All", count: counts.all },
          { id: "upcoming", label: "Upcoming", count: counts.upcoming },
          { id: "completed", label: "Completed", count: counts.completed },
          { id: "cancelled", label: "Cancelled", count: counts.cancelled },
        ].map((tab) => {
          const isActive = activeTabPill === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTabPill(tab.id as TabFilterType)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-[#0D47A1] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              style={{ fontFamily: PP }}
            >
              {tab.label} <span className="ml-1 opacity-80">{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* 5. Main Appointments Table Card (Exact matching screenshot layout) */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12 text-xs text-[#64748B]">
            No appointments found matching your filters.
          </div>
        ) : (
          <>
            {/* Desktop Table View rendered via common DataTable */}
            <div className="hidden md:block">
              <DataTable<ApiPatientAppointment>
                data={filteredAppointments}
                columns={[
                  {
                    key: "id",
                    label: "APPOINTMENT ID",
                    sortable: true,
                    getValue: (appt) => formatAppointmentId(appt.id),
                    render: (appt) => {
                      const displayApptId = formatAppointmentId(appt.id);
                      const doctorName = extractCleanString(
                        appt.doctor || appt.doctorName,
                        "Doctor",
                      );
                      const formattedDocName = doctorName.startsWith("Dr.")
                        ? doctorName
                        : `Dr. ${doctorName}`;
                      const departmentName = extractCleanString(
                        appt.department,
                        "General OPD",
                      );
                      const apptRecord: AppointmentRecord = {
                        id: String(appt.id),
                        appointmentNumber: String(
                          appt.appointmentNumber || appt.id,
                        ),
                        patientId: patient.id || patient.mrn,
                        patientName: patientDisplayName,
                        patientMrn: patient.mrn,
                        doctorId: appt.doctorId || 1,
                        doctorName: formattedDocName,
                        appointmentDate: appt.date || "",
                        timeSlot: appt.time || "",
                        time: appt.time || "",
                        status: appt.status || "Scheduled",
                        department: departmentName,
                        specialty: appt.specialty || departmentName,
                        reason: appt.reason || "General Consultation",
                        notes: appt.notes || "",
                      };
                      return (
                        <button
                          type="button"
                          onClick={() => setSelectedDetailsAppt(apptRecord)}
                          className="font-mono font-bold text-[#0D47A1] hover:underline text-left cursor-pointer"
                        >
                          {displayApptId}
                        </button>
                      );
                    },
                  },
                  {
                    key: "patientName",
                    label: "PATIENT NAME",
                    sortable: true,
                    getValue: () => patientDisplayName,
                    render: () => (
                      <span className="font-bold text-[#111827]">
                        {patientDisplayName}
                      </span>
                    ),
                  },
                  {
                    key: "doctor",
                    label: "DOCTOR",
                    sortable: true,
                    getValue: (appt) =>
                      extractCleanString(
                        appt.doctor || appt.doctorName,
                        "Doctor",
                      ),
                    render: (appt) => {
                      const doctorName = extractCleanString(
                        appt.doctor || appt.doctorName,
                        "Doctor",
                      );
                      const formattedDocName = doctorName.startsWith("Dr.")
                        ? doctorName
                        : `Dr. ${doctorName}`;
                      const departmentName = extractCleanString(
                        appt.department,
                        "General OPD",
                      );
                      return (
                        <div>
                          <div className="font-bold text-[#111827]">
                            {formattedDocName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {departmentName}
                          </div>
                        </div>
                      );
                    },
                  },
                  {
                    key: "department",
                    label: "DEPARTMENT",
                    sortable: true,
                    getValue: (appt) =>
                      extractCleanString(appt.department, "General OPD"),
                    render: (appt) => (
                      <span className="text-slate-700 font-semibold uppercase">
                        {extractCleanString(appt.department, "General OPD")}
                      </span>
                    ),
                  },
                  {
                    key: "date",
                    label: "DATE",
                    sortable: true,
                    getValue: (appt) => appt.date || "",
                    render: (appt) => (
                      <span className="text-slate-700 font-mono font-medium">
                        {appt.date || "—"}
                      </span>
                    ),
                  },
                  {
                    key: "time",
                    label: "TIME",
                    sortable: true,
                    getValue: (appt) => appt.time || "",
                    render: (appt) => (
                      <span className="text-slate-700 font-mono font-medium">
                        {appt.time || "—"}
                      </span>
                    ),
                  },
                  {
                    key: "status",
                    label: "STATUS",
                    sortable: true,
                    getValue: (appt) => appt.status || "",
                    render: (appt) => renderStatusBadge(appt.status),
                  },
                  {
                    key: "actions",
                    label: "ACTIONS",
                    sortable: false,
                    align: "right",
                    render: (appt) => {
                      const doctorName = extractCleanString(
                        appt.doctor || appt.doctorName,
                        "Doctor",
                      );
                      const formattedDocName = doctorName.startsWith("Dr.")
                        ? doctorName
                        : `Dr. ${doctorName}`;
                      const departmentName = extractCleanString(
                        appt.department,
                        "General OPD",
                      );
                      const isUpcoming = [
                        "Confirmed",
                        "Scheduled",
                        "Booked",
                        "Pending",
                      ].includes(appt.status || "");
                      const apptRecord: AppointmentRecord = {
                        id: String(appt.id),
                        appointmentNumber: String(
                          appt.appointmentNumber || appt.id,
                        ),
                        patientId: patient.id || patient.mrn,
                        patientName: patientDisplayName,
                        patientMrn: patient.mrn,
                        doctorId: appt.doctorId || 1,
                        doctorName: formattedDocName,
                        appointmentDate: appt.date || "",
                        timeSlot: appt.time || "",
                        time: appt.time || "",
                        status: appt.status || "Scheduled",
                        department: departmentName,
                        specialty: appt.specialty || departmentName,
                        reason: appt.reason || "General Consultation",
                        notes: appt.notes || "",
                      };

                      return (
                        <div className="flex items-center justify-end gap-1.5">
                          {isUpcoming && canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => setReschedulingAppt(apptRecord)}
                                className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-teal-50 text-[#009688] transition-colors cursor-pointer"
                                title="Reschedule Appointment"
                              >
                                <Calendar size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setCancellingAppt(appt)}
                                className="p-1.5 rounded-lg border border-[#E5E7EB] hover:bg-red-50 text-[#EF4444] transition-colors cursor-pointer"
                                title="Cancel Appointment"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedDetailsAppt(apptRecord)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0D47A1] text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                            style={{ fontFamily: PP }}
                          >
                            <Eye size={13} /> View
                          </button>
                        </div>
                      );
                    },
                  },
                ]}
                getRowId={(appt) => appt.id}
                pagination={true}
              />
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-gray-100">
              {filteredAppointments.map((appt) => {
                const displayApptId = formatAppointmentId(appt.id);
                const doctorName = extractCleanString(
                  appt.doctor || appt.doctorName,
                  "Doctor",
                );
                const formattedDocName = doctorName.startsWith("Dr.")
                  ? doctorName
                  : `Dr. ${doctorName}`;
                const departmentName = extractCleanString(
                  appt.department,
                  "General OPD",
                );

                const apptRecord: AppointmentRecord = {
                  id: String(appt.id),
                  appointmentNumber: String(appt.appointmentNumber || appt.id),
                  patientId: patient.id || patient.mrn,
                  patientName: patientDisplayName,
                  patientMrn: patient.mrn,
                  doctorId: appt.doctorId || 1,
                  doctorName: formattedDocName,
                  appointmentDate: appt.date || "",
                  timeSlot: appt.time || "",
                  time: appt.time || "",
                  status: appt.status || "Scheduled",
                  department: departmentName,
                  specialty: appt.specialty || departmentName,
                  reason: appt.reason || "General Consultation",
                  notes: appt.notes || "",
                };

                return (
                  <div key={appt.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#0D47A1] text-xs">
                        {displayApptId}
                      </span>
                      {renderStatusBadge(appt.status)}
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-[#111827]">
                        {formattedDocName}
                      </div>
                      <div className="text-slate-500">
                        {departmentName} · {appt.date} at {appt.time}
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setSelectedDetailsAppt(apptRecord)}
                        className="px-3 py-1.5 bg-blue-50 text-[#0D47A1] text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer"
                        style={{ fontFamily: PP }}
                      >
                        <Eye size={14} /> View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Reschedule Confirmation Dialog */}
      {reschedulingAppt && (
        <RescheduleAppointmentConfirmationDialog
          apt={reschedulingAppt}
          isOpen={!!reschedulingAppt}
          onClose={() => setReschedulingAppt(null)}
          onConfirmReschedule={handleConfirmReschedule}
        />
      )}

      {/* Cancel Appointment Dialog */}
      {cancellingAppt && (
        <PatientCancelAppointmentDialog
          appointment={{
            id: String(cancellingAppt.id),
            date: cancellingAppt.date || "",
            time: cancellingAppt.time || "",
            doctor: extractCleanString(
              cancellingAppt.doctor || cancellingAppt.doctorName,
              "Doctor",
            ),
            specialty: cancellingAppt.specialty || "OPD",
            department: extractCleanString(
              cancellingAppt.department,
              "General OPD",
            ),
            visitType: "In-Person OPD",
            status: (cancellingAppt.status as "Scheduled") || "Scheduled",
            roomLocation: "OPD Room",
            reason: cancellingAppt.reason || "General Consultation",
            notes: cancellingAppt.notes || "",
            consultationStatus: cancellingAppt.status || "Scheduled",
            prescriptionStatus: "Pending",
            billingStatus: "Pending",
            billingAmount: "$50.00",
          }}
          isOpen={!!cancellingAppt}
          onClose={() => setCancellingAppt(null)}
          onConfirmCancel={(id, reason, comments) => {
            handleConfirmCancel(id, reason, comments);
            setCancellingAppt(null);
          }}
        />
      )}

      {/* Appointment Details Drawer */}
      {selectedDetailsAppt && (
        <AppointmentDetailsDrawer
          apt={selectedDetailsAppt}
          isOpen={!!selectedDetailsAppt}
          onClose={() => setSelectedDetailsAppt(null)}
          onEditClick={() => {}}
          onPrintClick={() => {}}
          userRole={isOwnProfile ? "Receptionist" : "Receptionist"}
        />
      )}
    </div>
  );
}
