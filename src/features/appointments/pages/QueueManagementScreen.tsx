import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import { PP, RB } from "../constants/appointment.constants";
import type { ChipVariant } from "../constants/appointment.constants";
import { Chip } from "../components/Chip";
import { CheckInConfirmationModal } from "../../reception/components/CheckInConfirmationModal";
import { receptionService } from "../../reception/services/reception.service";
import { appointmentService } from "../../appointments/services/appointment.service";
import { departmentsApi } from "../../users/api/departments.api";
import type { AppointmentRecord } from "../../appointments/types/appointment.types";
import { type QueueManagementScreenProps } from "../types/appointment-screen.types";
import { usePermissions } from "../../../permissions/usePermissions";
import { DataTable } from "../../../common/components/DataTable";
import {
  RefreshCw,
  UserCheck,
  Search,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { getTodayDateString, normalizeDateString } from "../../../lib/time-utils";

const fetchQueue = async () => {
  return appointmentService.getActiveAppointments();
};

const getStatusChipVariant = (status: string): ChipVariant => {
  const s = status.toUpperCase();
  switch (s) {
    case "IN_CONSULTATION":
    case "IN_PROGRESS":
      return "teal";
    case "WAITING_FOR_VITALS":
    case "WAITING_FOR_DOCTOR_CALL":
      return "warning";
    case "CALLED":
      return "info";
    case "CHECKED_IN":
      return "info";
    case "BOOKED":
    case "CONFIRMED":
      return "info";
    case "COMPLETED":
      return "success";
    case "NO_SHOW":
    case "CANCELLED":
      return "error";
    default:
      return "default";
  }
};

export function QueueManagementScreen({
  onCheckInClick,
  onPatientSearchClick,
  onPatientSelect,
}: QueueManagementScreenProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canCheckIn = can("APPOINTMENT_CHECK_IN") || can("CHECKIN_CREATE");
  const canRecordVitals = can("VITALS_CREATE");

  // Toast State
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const triggerToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Global Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Filter Bar state
  const todayDateStr = getTodayDateString();
  const [selectedDoctor, setSelectedDoctor] = useState("All Doctors");
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [selectedDate, setSelectedDate] = useState(todayDateStr);
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");

  const [apiDepts, setApiDepts] = useState<string[]>([]);

  useEffect(() => {
    departmentsApi
      .getDepartmentLookup(true)
      .then((lookupList) => {
        if (lookupList && lookupList.length > 0) {
          const names = lookupList.flatMap((d) =>
            d.departmentName ? [d.departmentName] : [],
          );
          setApiDepts(names);
        } else {
          departmentsApi.getDepartments({ activeOnly: true }).then((list) => {
            const content = Array.isArray(list) ? list : list.content || [];
            const names = content
              .map((d) => d.departmentName || d.name)
              .filter((n): n is string => Boolean(n));
            if (names.length > 0) setApiDepts(names);
          });
        }
      })
      .catch(() => {});
  }, []);

  // Selected Row for Right Context Panel
  const [selectedTokenId, setSelectedTokenId] = useState<string>("");

  // Dialog States
  const [noShowDialogApt, setNoShowDialogApt] =
    useState<AppointmentRecord | null>(null);
  const [checkInModalData, setCheckInModalData] = useState<{
    isOpen: boolean;
    tokenNumber: string;
    patientName: string;
    patientMrn: string;
    doctorName?: string;
    departmentName?: string;
    appointmentTime?: string;
    status?: string;
  } | null>(null);

  const [tokenCounter] = useState(
    () => 100 + (window.crypto.getRandomValues(new Uint32Array(1))[0] % 900),
  );

  const handleExecuteCheckIn = async (apt: AppointmentRecord) => {
    try {
      const res = await receptionService.checkInPatient(apt.id);
      const genToken =
        res.tokenNumber ||
        apt.queueToken ||
        `TK-${tokenCounter + Number(apt.id)}`;

      setQueueItems((prev) =>
        prev.map((i) =>
          i.id === apt.id
            ? {
                ...i,
                queueToken: genToken,
                status: "Waiting for Vitals" as AppointmentRecord["status"],
                arrivalTime: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }
            : i,
        ),
      );

      setCheckInModalData({
        isOpen: true,
        tokenNumber: genToken,
        patientName: apt.patientName,
        patientMrn: apt.patientMrn || apt.mrn || "",
        doctorName: apt.doctorName,
        departmentName: apt.departmentName,
        appointmentTime: apt.startTime || apt.timeSlot,
        status: "Waiting for Vitals",
      });

      if (onCheckInClick)
        onCheckInClick(genToken, apt.patientMrn || apt.mrn || "");
    } catch (err) {
      triggerToast(
        (err instanceof Error ? err.message : null) ||
          "Check-in is only allowed on the appointment date.",
        "error",
      );
    }
  };

  const [queueItems, setQueueItems] = useState<AppointmentRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadQueue = async () => {
      try {
        const data = await fetchQueue();
        if (!cancelled) setQueueItems(data);
      } catch (err) {
        console.warn("Failed to load queue:", err);
      }
    };

    void loadQueue();

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter Logic
  const filteredQueue = useMemo(() => {
    return queueItems.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        q === "" ||
        (item.patientName || "").toLowerCase().includes(q) ||
        (item.patientMrn || item.mrn || "").toLowerCase().includes(q) ||
        (item.queueToken || item.tokenNo || "").toLowerCase().includes(q) ||
        String(item.id).toLowerCase().includes(q);

      const matchDoc =
        selectedDoctor === "All Doctors" ||
        (item.doctorName || "") === selectedDoctor;
      const matchDept =
        selectedDept === "All Departments" ||
        (item.departmentName || "") === selectedDept;
      const matchStatus =
        selectedStatus === "All Statuses" ||
        String(item.status).toUpperCase() === selectedStatus.toUpperCase();
      const matchDate =
        !selectedDate ||
        normalizeDateString(item.appointmentDate || item.date || "") ===
          normalizeDateString(selectedDate);

      return matchSearch && matchDoc && matchDept && matchStatus && matchDate;
    });
  }, [
    queueItems,
    searchQuery,
    selectedDoctor,
    selectedDept,
    selectedStatus,
    selectedDate,
  ]);

  // Pagination handled by DataTable component

  // Summary KPI Metrics
  const metrics = useMemo(() => {
    const waiting = queueItems.filter(
      (i) =>
        i.status === "Waiting for Vitals" ||
        i.status === "Waiting for Doctor" ||
        i.status === "Called" ||
        i.status === "Waiting",
    ).length;
    const checkedIn = queueItems.filter(
      (i) => i.status === "Checked-In",
    ).length;
    const inConsultation = queueItems.filter(
      (i) => i.status === "In Consultation" || i.status === "In Progress",
    ).length;
    const completed = queueItems.filter((i) => i.status === "Completed").length;
    const noShows = queueItems.filter((i) => i.status === "No Show").length;
    const waitTimes = queueItems
      .map((i) => i.waitingTimeMinutes)
      .filter((w): w is number => typeof w === "number" && w > 0);
    const avgWaitTime =
      waitTimes.length > 0
        ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
        : null;
    return { waiting, checkedIn, inConsultation, completed, noShows, avgWaitTime };
  }, [queueItems]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedDoctor("All Doctors");
    setSelectedDept("All Departments");
    setSelectedDate(todayDateStr);
    setSelectedStatus("All Statuses");
  };

  const handleMarkNoShow = async (apt: AppointmentRecord) => {
    try {
      await appointmentService.receptionMarkNoShow(
        apt.id,
        "Patient did not arrive",
      );
      setQueueItems((prev) =>
        prev.map((i) =>
          i.id === apt.id
            ? { ...i, status: "No Show" as AppointmentRecord["status"] }
            : i,
        ),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to mark no-show";
      triggerToast(msg, "error");
    }
    setNoShowDialogApt(null);
  };

  const queueFilterToolbar = (
    <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
      <div className="flex items-center gap-2 flex-wrap">
        <select
          aria-label="Select option"
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#0D47A1] font-semibold focus:outline-none"
        >
          <option>All Doctors</option>
          {Array.from(
            new Set(queueItems.map((i) => i.doctorName).filter(Boolean)),
          ).map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          aria-label="Select option"
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#0D47A1] font-semibold focus:outline-none"
        >
          <option value="All Departments">All Departments</option>
          {apiDepts.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <select
          aria-label="Select option"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#0D47A1] font-semibold focus:outline-none"
        >
          <option>All Statuses</option>
          <option>Scheduled</option>
          <option>Checked-In</option>
          <option>Waiting</option>
          <option>In Consultation</option>
          <option>Completed</option>
          <option>No Show</option>
          <option>Cancelled</option>
        </select>

        <button
          onClick={resetFilters}
          className="px-3 py-1.5 rounded-xl text-xs text-[#EF4444] font-semibold hover:bg-red-50 transition-colors cursor-pointer"
        >
          Reset Filters
        </button>
      </div>

      <div className="text-xs text-[#64748B] font-medium">
        Showing{" "}
        <span className="font-bold text-[#0D47A1]">
          {filteredQueue.length}
        </span>{" "}
        queue entries
      </div>
    </div>
  );

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
          <AlertCircle
            size={16}
            className={
              toastType === "error" ? "text-red-200" : "text-[#66BB6A]"
            }
          />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── HEADER & BREADCRUMBS & PRIMARY ACTIONS ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3.5 py-2 mb-3 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all cursor-pointer"
            style={{ fontFamily: RB }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <h1
            className="text-2xl font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            Reception Queue Management
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Monitor today's patient queue and manage patient check-ins.
          </p>
        </div>

        {/* Primary Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchQueue()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-semibold hover:bg-[#0c3d8a] transition-colors shadow-sm"
            style={{ fontFamily: PP }}
          >
            <RefreshCw size={15} /> Refresh Queue
          </button>
          <button
            onClick={() => onCheckInClick && onCheckInClick()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#009688] text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-sm"
            style={{ fontFamily: PP }}
          >
            <UserCheck size={15} /> Patient Check-In
          </button>
          <button
            onClick={onPatientSearchClick}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 border border-[#E5E7EB] text-[#111827] text-xs font-semibold hover:bg-slate-200 transition-colors"
            style={{ fontFamily: PP }}
          >
            <Search size={15} /> Patient Search
          </button>
        </div>
      </div>
      {/* ── SUMMARY KPI CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 01: Waiting Patients */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm space-y-1">
          <span className="text-[11px] text-[#64748B] font-medium block">
            Waiting Patients
          </span>
          <div
            className="text-2xl font-bold text-[#F59E0B]"
            style={{ fontFamily: PP }}
          >
            {metrics.waiting}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">
            In lounge waiting
          </span>
        </div>

        {/* Card 02: Checked-In Patients */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm space-y-1">
          <span className="text-[11px] text-[#64748B] font-medium block">
            Checked-In Patients
          </span>
          <div
            className="text-2xl font-bold text-[#0D47A1]"
            style={{ fontFamily: PP }}
          >
            {metrics.checkedIn}
          </div>
          <span className="text-[10px] text-blue-600 font-medium">
            Arrived at reception
          </span>
        </div>

        {/* Card 03: Currently In Consultation (Read Only) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#64748B] font-medium">
              In Consultation
            </span>
            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-semibold">
              Read Only
            </span>
          </div>
          <div
            className="text-2xl font-bold text-[#009688]"
            style={{ fontFamily: PP }}
          >
            {metrics.inConsultation}
          </div>
          <span className="text-[10px] text-teal-600 font-medium">
            Active doctor room
          </span>
        </div>

        {/* Card 04: Completed (Read Only) */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#64748B] font-medium">
              Completed
            </span>
            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-semibold">
              Read Only
            </span>
          </div>
          <div
            className="text-2xl font-bold text-[#66BB6A]"
            style={{ fontFamily: PP }}
          >
            {metrics.completed}
          </div>
          <span className="text-[10px] text-green-600 font-medium">
            Consultations done
          </span>
        </div>

        {/* Card 05: No Shows */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm space-y-1">
          <span className="text-[11px] text-[#64748B] font-medium block">
            No Shows
          </span>
          <div
            className="text-2xl font-bold text-[#EF4444]"
            style={{ fontFamily: PP }}
          >
            {metrics.noShows}
          </div>
          <span className="text-[10px] text-red-600 font-medium">
            Missed slot today
          </span>
        </div>

        {/* Card 06: Average Waiting Time */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 shadow-sm space-y-1">
          <span className="text-[11px] text-[#64748B] font-medium block">
            Avg Waiting Time
          </span>
          <div
            className="text-2xl font-bold text-[#0D47A1]"
            style={{ fontFamily: PP }}
          >
            {metrics.avgWaitTime !== null ? `${metrics.avgWaitTime} min` : "--"}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            OPD bench target
          </span>
        </div>
      </div>


      {/* ── ENTERPRISE LAYOUT GRID ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* LEFT COLUMN: ENTERPRISE QUEUE TABLE (8 COLS) */}
        <div className="xl:col-span-12 space-y-6">
          <DataTable<AppointmentRecord>
            data={filteredQueue}
            columns={[
              {
                key: "tokenNo",
                label: "TOKEN",
                sortable: true,
                getValue: (apt) =>
                  apt.queueToken || apt.tokenNo || `TK-${apt.id}`,
                render: (apt) => (
                  <span className="font-mono font-bold text-[#0D47A1]">
                    {apt.queueToken || apt.tokenNo || `TK-${apt.id}`}
                  </span>
                ),
              },
              {
                key: "patientName",
                label: "PATIENT",
                sortable: true,
                getValue: (apt) => apt.patientName,
                render: (apt) => (
                  <span className="font-bold text-[#111827]">
                    {apt.patientName}
                  </span>
                ),
              },
              {
                key: "patientMrn",
                label: "MRN",
                sortable: true,
                getValue: (apt) => apt.patientMrn || apt.mrn || "",
                render: (apt) => (
                  <span className="font-mono text-slate-500">
                    {apt.patientMrn || apt.mrn || ""}
                  </span>
                ),
              },
              {
                key: "doctorName",
                label: "DOCTOR",
                sortable: true,
                getValue: (apt) => apt.doctorName || "",
                render: (apt) => (
                  <span className="font-medium">{apt.doctorName}</span>
                ),
              },
              {
                key: "departmentName",
                label: "DEPARTMENT",
                sortable: true,
                getValue: (apt) => apt.departmentName || "",
                render: (apt) => (
                  <span className="text-slate-600">{apt.departmentName}</span>
                ),
              },
              {
                key: "timeSlot",
                label: "APPT TIME",
                sortable: true,
                getValue: (apt) => apt.startTime || apt.timeSlot || "",
                render: (apt) => (
                  <span className="font-mono text-slate-500">
                    {apt.startTime || apt.timeSlot || ""}
                  </span>
                ),
              },
              {
                key: "arrivalTime",
                label: "ARRIVAL TIME",
                sortable: true,
                getValue: (apt) => apt.arrivalTime || "",
                render: (apt) => (
                  <span className="font-mono text-slate-500">
                    {apt.arrivalTime || ""}
                  </span>
                ),
              },
              {
                key: "waitingTimeMinutes",
                label: "WAIT TIME",
                sortable: true,
                getValue: (apt) => apt.waitingTimeMinutes || 0,
                render: (apt) => (
                  <span className="font-mono text-slate-500">
                    {apt.waitingTimeMinutes
                      ? `${apt.waitingTimeMinutes} min`
                      : ""}
                  </span>
                ),
              },
              {
                key: "status",
                label: "QUEUE STATUS",
                sortable: true,
                getValue: (apt) => apt.status || "",
                render: (apt) => {
                  const displayStatus = String(apt.status || "").replace(
                    /_/g,
                    " ",
                  );
                  return (
                    <Chip
                      label={displayStatus}
                      variant={getStatusChipVariant(displayStatus)}
                    />
                  );
                },
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
                    {(apt.status === "Booked" ||
                      apt.status === "Scheduled" ||
                      apt.status === "BOOKED" ||
                      apt.status === "CONFIRMED") &&
                      canCheckIn && (
                        <button
                          onClick={() => handleExecuteCheckIn(apt)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shadow-xs bg-[#009688] text-white hover:bg-teal-700 cursor-pointer"
                          title="Check-In Patient"
                        >
                          Check-In
                        </button>
                      )}

                    {(apt.status === "Checked-In" ||
                      apt.status === "CHECKED_IN" ||
                      apt.status === "Waiting for Vitals" ||
                      apt.status === "WAITING_FOR_VITALS") &&
                    canRecordVitals ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        Vitals Pending
                      </span>
                    ) : null}

                    <button
                      onClick={() =>
                        onPatientSelect &&
                        onPatientSelect(apt.patientMrn || apt.mrn || "")
                      }
                      title="View Patient"
                      className="px-2 py-1 rounded-lg bg-slate-100 text-[#0D47A1] text-[11px] font-semibold hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      View
                    </button>

                    {apt.status !== "Completed" &&
                      apt.status !== "COMPLETED" &&
                      apt.status !== "Cancelled" &&
                      apt.status !== "CANCELLED" &&
                      apt.status !== "No Show" &&
                      apt.status !== "NO_SHOW" && (
                        <button
                          onClick={() => setNoShowDialogApt(apt)}
                          title="Mark No Show"
                          className="px-2 py-1 rounded-lg bg-red-50 text-[#EF4444] text-[11px] font-semibold hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          No Show
                        </button>
                      )}
                  </div>
                ),
              },
            ]}
            getRowId={(apt) => apt.id}
            selectedRowId={selectedTokenId}
            onRowClick={(apt) =>
              setSelectedTokenId(apt.queueToken || String(apt.id))
            }
            title="Today's Queue Table"
            subtitle="Real-time patient flow and arrival management"
            headerBadge={
              <span className="text-xs text-[#64748B]">
                Showing{" "}
                <strong className="text-[#111827]">
                  {filteredQueue.length}
                </strong>{" "}
                queue entries
              </span>
            }
            searchable={true}
            searchPlaceholder="Search queue by Patient Name, MRN, Token Number or Appointment ID..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            toolbar={queueFilterToolbar}
            emptyTitle="No patients are currently in today's queue."
            emptySubtitle="Try adjusting search or select another doctor or department filter."
            emptyAction={
              <button
                onClick={onPatientSearchClick}
                className="mt-2 px-4 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-semibold hover:bg-[#0c3d8a] transition-colors flex items-center gap-1.5 cursor-pointer"
                style={{ fontFamily: PP }}
              >
                <Search size={15} /> Patient Search
              </button>
            }
            pagination={true}
          />
        </div>
      </div>

      {/* ── CONFIRMATION DIALOG: MARK NO SHOW ── */}
      {noShowDialogApt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] max-w-md w-full p-6 shadow-2xl space-y-4 transition-opacity duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-[#EF4444] flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3
                  className="text-base font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Mark Patient as No Show?
                </h3>
                <p className="text-xs text-[#64748B]">
                  This patient did not arrive for the scheduled appointment.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
              <p>
                <strong>Patient:</strong> {noShowDialogApt.patientName} (
                {noShowDialogApt.patientMrn || noShowDialogApt.mrn || ""})
              </p>
              <p>
                <strong>Doctor:</strong> {noShowDialogApt.doctorName} (
                {noShowDialogApt.departmentName})
              </p>
              <p>
                <strong>Time Slot:</strong>{" "}
                {noShowDialogApt.startTime || noShowDialogApt.timeSlot || ""}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setNoShowDialogApt(null)}
                className="px-4 py-2 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#64748B] hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleMarkNoShow(noShowDialogApt)}
                className="px-4 py-2 rounded-xl bg-[#EF4444] text-white text-xs font-semibold hover:bg-red-600 shadow-sm"
              >
                Confirm No Show
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centered Check-In Confirmation Modal */}
      {checkInModalData && (
        <CheckInConfirmationModal
          isOpen={checkInModalData.isOpen}
          onClose={() => setCheckInModalData(null)}
          tokenNumber={checkInModalData.tokenNumber}
          patientName={checkInModalData.patientName}
          patientMrn={checkInModalData.patientMrn}
          doctorName={checkInModalData.doctorName}
          departmentName={checkInModalData.departmentName}
          appointmentTime={checkInModalData.appointmentTime}
          status={checkInModalData.status || "Waiting for Vitals"}
        />
      )}
    </div>
  );
}
