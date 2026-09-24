import { useState, useReducer, useMemo, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Search,
  RotateCcw,
  ArrowLeft,
  Clock,
  User,
  AlertCircle,
  Calendar,
  RefreshCw,
  Stethoscope,
  X,
  Filter,
  Tag,
} from "lucide-react";
import { Pagination } from "../../../common/components/Pagination";
import type { AppointmentRecord } from "../../appointments";
import {
  toDisplayStatus,
  appointmentService,
} from "../../appointments/services/appointment.service";
import { vitalsService } from "../services/vitals.service";
import { vitalsApi } from "../api/vitals.api";
import { appointmentsApi } from "../../appointments/api/appointments.api";
import { patientsApi } from "../../patients/api/patient.api";
import { departmentsApi } from "../../users/api/departments.api";
import { QUEUE_QUERY_KEY } from "../../opd/hooks/useQueue";
import type {
  RecordedVitalsData,
  NurseWaitingPatient,
} from "../types/vitals.types";
import { VitalsDetailsScreen } from "../components/VitalsDetailsScreen";
import { RecordPatientVitalsForm } from "../components/RecordPatientVitalsForm";
import { VitalsKpiSummaryCards } from "../components/VitalsKpiSummaryCards";
import { Avatar } from "../../../common/components/Avatar";
import { usePermissions } from "../../../permissions/usePermissions";

// --- Typography Tokens ---
const PP = "Poppins, sans-serif";
const RB = "Roboto, sans-serif";

interface Props {
  onPatientSelect?: (id: number | string) => void;
  onViewAppointmentDetails?: (apt: AppointmentRecord) => void;
  initialViewMode?: "center" | "record" | "details";
  onBack?: () => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN SCREEN: VITALS MANAGEMENT CENTER (LANDING PAGE)
   ───────────────────────────────────────────────────────────────────────────── */
const getVitalsStatus = (apt: AppointmentRecord) => {
  if (
    apt.hasVitals ||
    apt.vitalsRecorded ||
    apt.status === "Vitals Recorded" ||
    apt.status === "Completed" ||
    apt.status === "Ready For Consultation" ||
    apt.status === "Waiting for Doctor" ||
    apt.status === "Called" ||
    apt.status === "In Consultation" ||
    apt.status === "In Progress" ||
    apt.queueStatus === "WAITING_FOR_DOCTOR_CALL" ||
    apt.queueStatus === "WAITING_FOR_DOCTOR" ||
    apt.queueStatus === "COMPLETED"
  ) {
    return "Ready For Consultation";
  }
  if (apt.notes?.includes("vitals in progress")) return "Recording In Progress";
  return "Waiting for Vitals";
};

export function RecordPatientVitalsScreen({
  onPatientSelect,
  onViewAppointmentDetails,
  initialViewMode = "center",
  onBack,
}: Props) {
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().split("T")[0];
  type VitalsState = {
    appointments: AppointmentRecord[];
    selectedAptId: string | null;
    selectedAptRecord: AppointmentRecord | null;
    isEditMode: boolean;
    viewMode: "center" | "record" | "details";
    selectedDate: string;
    sortField: "time" | "token" | "patient";
    sortOrder: "asc" | "desc";
  };
  const [state, dispatch] = useReducer(
    (
      prev: VitalsState,
      action: Partial<VitalsState> | ((prevState: VitalsState) => Partial<VitalsState>),
    ) => {
      const patch = typeof action === "function" ? action(prev) : action;
      return { ...prev, ...patch };
    },
    {
      appointments: [],
      selectedAptId: null,
      selectedAptRecord: null,
      isEditMode: false,
      viewMode: initialViewMode,
      selectedDate: todayStr,
      sortField: "time",
      sortOrder: "asc",
    },
  );
  const {
    appointments,
    selectedAptId,
    selectedAptRecord,
    isEditMode,
    viewMode,
    selectedDate,
    sortField,
    sortOrder,
  } = state;

  const setAppointments = (
    val: AppointmentRecord[] | ((prev: AppointmentRecord[]) => AppointmentRecord[]),
  ) =>
    dispatch((prev) => ({
      appointments: typeof val === "function" ? val(prev.appointments) : val,
    }));
  const setSelectedAptId = (val: string | null) => dispatch({ selectedAptId: val });
  const setSelectedAptRecord = (
    val: AppointmentRecord | null | ((prev: AppointmentRecord | null) => AppointmentRecord | null),
  ) =>
    dispatch((prev) => ({
      selectedAptRecord: typeof val === "function" ? val(prev.selectedAptRecord) : val,
    }));
  const setIsEditMode = (val: boolean) => dispatch({ isEditMode: val });
  const setViewMode = (val: "center" | "record" | "details") => dispatch({ viewMode: val });
  const setSelectedDate = (val: string) => dispatch({ selectedDate: val });

  const loadWaitingAppointments = useCallback(
    async (dateParam?: string) => {
      try {
        const targetDate =
          dateParam || selectedDate || new Date().toISOString().split("T")[0];

        const queueEnvelope = await vitalsApi.getNurseQueueFull(targetDate);
        if (queueEnvelope && typeof queueEnvelope === "object") {
          if (
            Array.isArray(queueEnvelope.patients) &&
            queueEnvelope.patients.length > 0
          ) {
            const mapped: AppointmentRecord[] = queueEnvelope.patients.map(
              (item, idx) => {
                const apptIdStr = String(
                  item.appointmentId || item.id || `apt-${idx + 1}`,
                );
                const hasVitals = item.vitalsStatus === "COMPLETED";

                return {
                  id: apptIdStr,
                  appointmentNumber: String(
                    item.appointmentId || item.token || apptIdStr,
                  ),
                  tokenNo: String(item.token || item.appointmentId || "—"),
                  patientId: String(item.patientId || "—"),
                  patientName: String(item.patientName || "Patient"),
                  patientAge: Number(item.age || 30),
                  patientGender: (item.gender ||
                    "Male") as AppointmentRecord["patientGender"],
                  patientPhone: String(item.phone || item.contact || "—"),
                  mrn: String(item.patientId || item.mrn || "—"),
                  doctorId: String(item.doctorId || "—"),
                  doctorName: String(item.doctorName || "Duty Doctor"),
                  department: String(item.department || "General OPD"),
                  departmentName: String(item.department || "General OPD"),
                  specialty: "General OPD",
                  appointmentDate: item.checkInDate || targetDate,
                  appointmentTime: String(
                    item.appointmentTime || item.checkInTime || "—",
                  ),
                  time: String(item.appointmentTime || item.checkInTime || "—"),
                  timeSlot: String(
                    item.appointmentTime || item.checkInTime || "—",
                  ),
                  status: hasVitals
                    ? "Vitals Recorded"
                    : item.vitalsStatus === "WAITING"
                      ? "Waiting for Vitals"
                      : "Waiting for Vitals",
                  queueStatus: item.vitalsStatus || "WAITING",
                  hasVitals,
                  vitalsRecorded: hasVitals,
                  vitalsId: undefined,
                  visitType: "Consultation",
                  reason: "",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };
              },
            );

            setAppointments(mapped);
            return;
          }
        }

        const [waitingResult, todayResult] = await Promise.allSettled([
          vitalsService.getWaitingPatients(targetDate),
          appointmentService.listAppointments({ date: targetDate }),
        ]);

        const waitingItems =
          waitingResult.status === "fulfilled" &&
          Array.isArray(waitingResult.value)
            ? waitingResult.value
            : [];

        const todayItems =
          todayResult.status === "fulfilled" && Array.isArray(todayResult.value)
            ? todayResult.value
            : [];

        const combinedMap = new Map<string, Record<string, unknown>>();

        waitingItems.forEach((item, idx) => {
          const id = String(item.appointmentId || item.id || `apt-w-${idx}`);
          combinedMap.set(id, item as unknown as Record<string, unknown>);
        });

        todayItems.forEach((item, idx) => {
          const id = String(
            item.id || item.appointmentNumber || `apt-t-${idx}`,
          );
          const existing = combinedMap.get(id);
          if (existing) {
            combinedMap.set(id, { ...existing, ...item });
          } else {
            combinedMap.set(id, item as unknown as Record<string, unknown>);
          }
        });

        const rawCombinedList = Array.from(combinedMap.values());

        if (rawCombinedList.length > 0) {
          const mapped: AppointmentRecord[] = rawCombinedList.map(
            (itemObj: Record<string, unknown>, idx: number) => {
              const item = itemObj as unknown as NurseWaitingPatient;
              const apptIdStr = String(
                item.appointmentId || item.id || `apt-${idx + 1}`,
              );

              const hasVitals = Boolean(
                item.vitalsStatus === "COMPLETED" ||
                item.vitalsStatus === "Vitals Recorded" ||
                itemObj.hasVitals === true ||
                itemObj.vitalsRecorded === true ||
                itemObj.vitalsId != null ||
                itemObj.vitals != null,
              );

              return {
                id: apptIdStr,
                appointmentNumber: String(
                  item.appointmentNumber ||
                    item.tokenNumber ||
                    item.token ||
                    apptIdStr,
                ),
                tokenNo: String(
                  item.token ||
                    item.tokenNumber ||
                    item.appointmentNumber ||
                    "—",
                ),
                patientId: item.patientId || item.patient?.id || "—",
                patientName:
                  item.patientName ||
                  item.patient?.name ||
                  item.patient?.fullName ||
                  "Patient",
                patientAge: Number(item.age || item.patient?.age || 30),
                patientGender: (item.gender ||
                  item.patient?.gender ||
                  "Male") as AppointmentRecord["patientGender"],
                patientPhone:
                  item.contact || item.patient?.contact || item.phone || "—",
                mrn: String(
                  item.patientId || item.mrn || item.patient?.mrn || "—",
                ),
                doctorId: item.doctorId || item.doctor?.doctorId || "—",
                doctorName:
                  item.doctorName ||
                  item.doctor?.name ||
                  ((item.doctor as Record<string, unknown> | undefined)
                    ?.fullName as string) ||
                  "Duty Doctor",
                department:
                  item.departmentName ||
                  (typeof item.department === "object"
                    ? item.department?.departmentName ||
                      item.department?.name ||
                      item.department?.departmentCode
                    : undefined) ||
                  (typeof item.department === "string"
                    ? item.department
                    : undefined) ||
                  item.doctor?.departmentName ||
                  item.doctor?.department ||
                  "Cardiology",
                departmentName:
                  item.departmentName ||
                  (typeof item.department === "object"
                    ? item.department?.departmentName ||
                      item.department?.name ||
                      item.department?.departmentCode
                    : undefined) ||
                  (typeof item.department === "string"
                    ? item.department
                    : undefined) ||
                  item.doctor?.departmentName ||
                  item.doctor?.department ||
                  "Cardiology",
                specialty:
                  item.specialty ||
                  item.doctor?.specialty ||
                  (typeof item.department === "object"
                    ? item.department?.departmentName ||
                      item.department?.name ||
                      item.department?.departmentCode
                    : undefined) ||
                  (typeof item.department === "string"
                    ? item.department
                    : undefined) ||
                  item.doctor?.department ||
                  "General Medicine",
                appointmentDate:
                  (itemObj.appointmentDate as string) ||
                  (itemObj.date as string) ||
                  new Date().toISOString().split("T")[0],
                appointmentTime:
                  item.checkInTime ||
                  item.appointmentTime ||
                  (itemObj.startTime as string) ||
                  item.time ||
                  item.timeSlot ||
                  "—",
                time:
                  item.checkInTime ||
                  item.appointmentTime ||
                  (itemObj.startTime as string) ||
                  item.time ||
                  item.timeSlot ||
                  "—",
                timeSlot:
                  item.checkInTime ||
                  item.appointmentTime ||
                  (itemObj.startTime as string) ||
                  item.time ||
                  item.timeSlot ||
                  "—",
                status: hasVitals
                  ? "Vitals Recorded"
                  : item.status === "WAITING_FOR_DOCTOR" ||
                      item.status === "WAITING_FOR_DOCTOR_CALL"
                    ? "Ready for Consultation"
                    : toDisplayStatus(item.status),
                queueStatus: hasVitals
                  ? "WAITING_FOR_DOCTOR_CALL"
                  : item.status || "WAITING_FOR_VITALS",
                hasVitals,
                vitalsRecorded: hasVitals,
                vitalsId: itemObj.vitalsId as number | undefined,
                visitType:
                  item.visitType ||
                  (itemObj.appointmentType as string) ||
                  "Consultation",
                reason:
                  (itemObj.reason as string) ||
                  (itemObj.chiefComplaint as string) ||
                  "",
                createdAt: (item as unknown as Record<string, unknown>)
                  .createdAt
                  ? String(
                      (item as unknown as Record<string, unknown>).createdAt,
                    )
                  : targetDate,
                updatedAt: (item as unknown as Record<string, unknown>)
                  .updatedAt
                  ? String(
                      (item as unknown as Record<string, unknown>).updatedAt,
                    )
                  : targetDate,
              };
            },
          );
          setAppointments(mapped);
        }
      } catch (err) {
        console.warn("Waiting list fetch warning:", err);
      }
    },
    [selectedDate],
  );

  useEffect(() => {
    let isMounted = true;
    const fetchWaitingAppointments = async () => {
      await loadWaitingAppointments(selectedDate);
      if (!isMounted) return;
    };
    void fetchWaitingAppointments();
    return () => {
      isMounted = false;
    };
  }, [loadWaitingAppointments, selectedDate]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");

  const [aptStatusFilter, setAptStatusFilter] = useState("All");
  const [vitalsStatusFilter, setVitalsStatusFilter] = useState("All");
  const [visitTypeFilter, setVisitTypeFilter] = useState("All");

  // Status Tab selection
  const [activeTab, setActiveTab] = useState<
    "All" | "Waiting for Vitals" | "Vitals Recorded"
  >("All");

  // Toast System
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);
  const triggerToast = (
    message: string,
    type: "success" | "info" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Dynamic Doctor list from appointments
  const dynamicDoctors = useMemo(() => {
    const list = appointments
      .map((a) => a.doctorName)
      .filter((name): name is string =>
        Boolean(name && name.trim() && name !== "—"),
      );
    return Array.from(new Set(list));
  }, [appointments]);

  const [masterDepartments, setMasterDepartments] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    const loadMasterDepts = async () => {
      try {
        const res = await departmentsApi.getDepartments({ page: 0, size: 100 });
        if (!active) return;
        const items =
          res?.content ||
          (res as unknown as Record<string, unknown>)?.items ||
          (Array.isArray(res) ? res : []);
        const names = (items as Array<Record<string, unknown>>)
          .map((d) => (d.departmentName || d.name) as string | undefined)
          .filter((name): name is string =>
            Boolean(name && typeof name === "string" && name.trim()),
          );
        if (names.length > 0) {
          setMasterDepartments(names);
        }
      } catch {
        // Fallback to appointment depts
      }
    };
    void loadMasterDepts();
    return () => {
      active = false;
    };
  }, []);

  // Dynamic Department list from master API + appointments
  const dynamicDepartments = useMemo(() => {
    const aptDepts = appointments
      .map((a) =>
        typeof a.department === "string" ? a.department : a.departmentName,
      )
      .filter((dept): dept is string =>
        Boolean(dept && dept.trim() && dept !== "—"),
      );

    const defaultDepts = [
      "General Medicine",
      "Cardiology",
      "Orthopedics",
      "Pediatrics",
      "Neurology",
      "Dermatology",
      "ENT",
      "Gynecology",
      "Ophthalmology",
      "Urology",
      "General Surgery",
      "Pulmonology",
    ];

    const combined = Array.from(
      new Set([...masterDepartments, ...aptDepts, ...defaultDepts]),
    );
    return combined.sort();
  }, [appointments, masterDepartments]);

  // Active Selected Appointment Record
  const activeApt = useMemo(() => {
    if (!selectedAptId) return null;
    const found = appointments.find(
      (a) => String(a.id) === String(selectedAptId),
    );
    if (found) return found;
    if (
      selectedAptRecord &&
      String(selectedAptRecord.id) === String(selectedAptId)
    ) {
      return selectedAptRecord;
    }
    return selectedAptRecord;
  }, [appointments, selectedAptId, selectedAptRecord]);

  // Fetched vitals data for details view
  const [detailsVitals, setDetailsVitals] = useState<RecordedVitalsData | null>(
    null,
  );

  const fetchVitalsForDetails = useCallback(async (aptId: string | number) => {
    try {
      const data = await vitalsService.getVitals(aptId);
      setDetailsVitals(data);
    } catch (err) {
      console.log(err);
      setDetailsVitals(null);
    }
  }, []);

  // Today's Queue list
  const todayQueue = useMemo(() => {
    return appointments;
  }, [appointments]);

  // Status map helper to determine vitals status string for an appointment

  // Calculated KPI Stats for Summary Cards
  const kpiStats = useMemo(() => {
    const total = todayQueue.length;
    const pending = todayQueue.filter(
      (a) => getVitalsStatus(a) === "Waiting for Vitals",
    ).length;
    const inProgress = todayQueue.filter(
      (a) => getVitalsStatus(a) === "Recording In Progress",
    ).length;
    const ready = todayQueue.filter(
      (a) => getVitalsStatus(a) === "Ready For Consultation",
    ).length;
    const recorded = ready;
    return {
      total,
      pending,
      inProgress,
      recorded,
      ready,
      avgTime: recorded > 0 ? "Real-time" : "—",
    };
  }, [todayQueue]);

  // Filtered Appointments Dataset
  const filteredAppointments = useMemo(() => {
    return todayQueue.filter((apt) => {
      const vStatus = getVitalsStatus(apt);

      // Filter by Status Tab
      if (activeTab !== "All" && vStatus !== activeTab) {
        return false;
      }

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          apt.patientName?.toLowerCase().includes(q) ||
          (apt.mrn ? String(apt.mrn).toLowerCase().includes(q) : false) ||
          String(apt.id).toLowerCase().includes(q) ||
          (apt.tokenNo ? String(apt.tokenNo).toLowerCase().includes(q) : false);
        if (!match) return false;
      }

      // Doctor Filter
      if (doctorFilter !== "All" && apt.doctorName !== doctorFilter)
        return false;
      // Department Filter
      if (deptFilter !== "All" && apt.department !== deptFilter) return false;
      // Appointment Status Filter
      if (aptStatusFilter !== "All" && apt.status !== aptStatusFilter)
        return false;
      // Vitals Status Filter
      if (vitalsStatusFilter !== "All" && vStatus !== vitalsStatusFilter)
        return false;
      // Visit Type Filter
      if (visitTypeFilter !== "All" && apt.visitType !== visitTypeFilter)
        return false;

      return true;
    });
  }, [
    todayQueue,
    activeTab,
    searchQuery,
    doctorFilter,
    deptFilter,
    aptStatusFilter,
    vitalsStatusFilter,
    visitTypeFilter,
  ]);

  // Active Filters List for Pill Display
  const activeFiltersList = useMemo(() => {
    const list: { key: string; label: string; clear: () => void }[] = [];
    if (searchQuery.trim()) {
      list.push({
        key: "search",
        label: `Search: "${searchQuery}"`,
        clear: () => setSearchQuery(""),
      });
    }
    if (doctorFilter !== "All") {
      list.push({
        key: "doctor",
        label: `Doctor: ${doctorFilter}`,
        clear: () => setDoctorFilter("All"),
      });
    }
    if (deptFilter !== "All") {
      list.push({
        key: "dept",
        label: `Department: ${deptFilter}`,
        clear: () => setDeptFilter("All"),
      });
    }
    if (aptStatusFilter !== "All") {
      list.push({
        key: "aptStatus",
        label: `Apt Status: ${aptStatusFilter}`,
        clear: () => setAptStatusFilter("All"),
      });
    }
    if (vitalsStatusFilter !== "All") {
      list.push({
        key: "vitalsStatus",
        label: `Vitals: ${vitalsStatusFilter}`,
        clear: () => setVitalsStatusFilter("All"),
      });
    }
    if (visitTypeFilter !== "All") {
      list.push({
        key: "visitType",
        label: `Visit: ${visitTypeFilter}`,
        clear: () => setVisitTypeFilter("All"),
      });
    }
    return list;
  }, [
    searchQuery,
    doctorFilter,
    deptFilter,
    aptStatusFilter,
    vitalsStatusFilter,
    visitTypeFilter,
  ]);

  // Sorted Dataset
  const sortedAppointments = useMemo(() => {
    return [...filteredAppointments].sort((a, b) => {
      let valA: string;
      let valB: string;
      if (sortField === "token") {
        valA = String(a.tokenNo || a.appointmentNumber || "");
        valB = String(b.tokenNo || b.appointmentNumber || "");
      } else if (sortField === "patient") {
        valA = String(a.patientName || "").toLowerCase();
        valB = String(b.patientName || "").toLowerCase();
      } else {
        valA = String(a.timeSlot || a.time || "");
        valB = String(b.timeSlot || b.time || "");
      }
      return sortOrder === "asc"
        ? valA.localeCompare(valB, undefined, { numeric: true })
        : valB.localeCompare(valA, undefined, { numeric: true });
    });
  }, [filteredAppointments, sortField, sortOrder]);

  // Pagination for queue table
  const [queuePage, setQueuePage] = useState(1);
  const queuePageSize = 10;
  const queueTotalPages = Math.max(
    1,
    Math.ceil(sortedAppointments.length / queuePageSize),
  );
  const safeQueuePage = Math.min(queuePage, queueTotalPages);
  const paginatedAppointments = sortedAppointments.slice(
    (safeQueuePage - 1) * queuePageSize,
    safeQueuePage * queuePageSize,
  );

  const handleSelectPatient = async (
    apt: AppointmentRecord,
    mode: "record" | "details" = "record",
  ) => {
    const aptIdStr = String(apt.id);
    setSelectedAptId(aptIdStr);
    setSelectedAptRecord(apt);
    setViewMode(mode);
    // Fetch vitals from GET /api/v1/nurse/appointments/{id}/vitals ONLY when viewing details or for completed vitals
    if (mode === "details" || apt.hasVitals || apt.vitalsRecorded) {
      fetchVitalsForDetails(apt.id);
    } else {
      setDetailsVitals(null);
    }

    // Use 4-digit numeric ID for GET /api/v1/appointments/{id} to get patient information & header data
    const numericId = String(apt.id).replace(/\D+/g, "") || apt.id;
    try {
      const res = await appointmentsApi.getAppointmentById(numericId);
      const data = (res?.data || res) as unknown as
        Record<string, unknown> | undefined;
      if (data && typeof data === "object") {
        let patObj = (data.patient || {}) as Record<string, unknown>;
        const docObj = (data.doctor || {}) as Record<string, unknown>;
        const deptObj = (data.department || {}) as Record<string, unknown>;

        const targetMrn = String(
          data.mrn || data.patientMrn || patObj.mrn || apt.mrn || "",
        ).trim();
        if (
          targetMrn &&
          targetMrn !== "—" &&
          (!patObj.bloodGroup || !patObj.phone || !patObj.emergencyContact)
        ) {
          try {
            const fullPatient = await patientsApi.getById(targetMrn);
            if (fullPatient) {
              patObj = {
                ...patObj,
                ...(fullPatient as unknown as Record<string, unknown>),
              };
            }
          } catch {
            // Ignore patient profile fallback error
          }
        }

        const updatedApt: AppointmentRecord = {
          ...apt,
          appointmentNumber: String(
            data.appointmentNumber ||
              data.tokenNumber ||
              data.token ||
              apt.appointmentNumber ||
              apt.id,
          ),
          tokenNo: String(
            data.queueToken ||
              data.tokenNumber ||
              data.token ||
              apt.tokenNo ||
              "—",
          ),
          mrn: String(
            data.mrn || data.patientMrn || patObj.mrn || apt.mrn || "—",
          ),
          patientName: String(
            data.patientName ||
              patObj.name ||
              patObj.fullName ||
              apt.patientName ||
              "—",
          ),
          patientAge: Number(data.age || patObj.age || apt.patientAge || 0),
          patientGender: String(
            data.gender || patObj.gender || apt.patientGender || "—",
          ),
          patientPhone: String(
            data.phone ||
              data.mobile ||
              patObj.phone ||
              patObj.contact ||
              patObj.mobile ||
              patObj.phoneNumber ||
              apt.patientPhone ||
              "—",
          ),
          doctorName: String(
            data.doctorName ||
              docObj.name ||
              docObj.fullName ||
              apt.doctorName ||
              "—",
          ),
          department: String(
            data.departmentName ||
              deptObj.departmentName ||
              deptObj.name ||
              (typeof data.department === "string" ? data.department : "") ||
              apt.department ||
              "—",
          ),
          departmentName: String(
            data.departmentName ||
              deptObj.departmentName ||
              deptObj.name ||
              (typeof data.department === "string" ? data.department : "") ||
              apt.departmentName ||
              "—",
          ),
          timeSlot: String(
            data.startTime ||
              data.appointmentTime ||
              data.timeSlot ||
              apt.timeSlot ||
              "—",
          ),
          chiefComplaint: String(
            data.symptoms ||
              data.reason ||
              (apt.chiefComplaint !== "Pre-consultation Vitals Check"
                ? apt.chiefComplaint
                : "") ||
              "",
          ),
          patient: {
            id: (patObj.id || data.patientId || apt.patientId) as
              string | number,
            mrn: String(data.mrn || patObj.mrn || apt.mrn || "—"),
            name: String(
              data.patientName ||
                patObj.name ||
                patObj.fullName ||
                apt.patientName ||
                "—",
            ),
            age: Number(data.age || patObj.age || apt.patientAge || 0),
            gender: String(
              data.gender || patObj.gender || apt.patientGender || "—",
            ),
            bloodGroup: String(
              data.bloodGroup || patObj.bloodGroup || patObj.bloodType || "—",
            ),
            phone: String(
              data.phone ||
                data.mobile ||
                patObj.phone ||
                patObj.contact ||
                patObj.mobile ||
                patObj.phoneNumber ||
                apt.patientPhone ||
                "—",
            ),
            emergencyContact: String(
              data.emergencyContact ||
                patObj.emergencyContact ||
                patObj.emergencyPhone ||
                patObj.emergencyContactNumber ||
                "—",
            ),
          },
        };

        setSelectedAptRecord(updatedApt);
        setAppointments((prev) =>
          prev.map((a) => (String(a.id) === aptIdStr ? updatedApt : a)),
        );
      }
    } catch {
      // Graceful fallback to existing apt data
    }

    triggerToast(`Loaded ${apt.patientName}`, "info");
  };

  const handleMarkPatientReady = async (
    submittedData?: RecordedVitalsData,
    viewDetailsImmediately: boolean = true,
  ) => {
    if (selectedAptId) {
      if (submittedData) {
        setDetailsVitals(submittedData);
      }
      try {
        const freshVitals = await vitalsService.getVitals(selectedAptId);
        if (freshVitals) {
          setDetailsVitals(freshVitals);
        }
      } catch (e) {
        console.warn("Failed to fetch fresh vitals after POST:", e);
      }
      const updatedStatusApt = {
        hasVitals: true,
        vitalsRecorded: true,
        status: "Vitals Recorded",
        queueStatus: "WAITING_FOR_DOCTOR_CALL",
      };
      setAppointments((prev) =>
        prev.map((item) =>
          String(item.id) === String(selectedAptId)
            ? { ...item, ...updatedStatusApt }
            : item,
        ),
      );
      setSelectedAptRecord((prev) =>
        prev ? { ...prev, ...updatedStatusApt } : null,
      );
    }
    queryClient.invalidateQueries({ queryKey: QUEUE_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["vitals"] });
    queryClient.invalidateQueries({ queryKey: ["appointments"] });
    await loadWaitingAppointments();

    if (viewDetailsImmediately && selectedAptId) {
      setViewMode("details");
    } else {
      setSelectedAptId(null);
      setSelectedAptRecord(null);
      setViewMode("center");
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setDoctorFilter("All");
    setDeptFilter("All");
    setAptStatusFilter("All");
    setVitalsStatusFilter("All");
    setVisitTypeFilter("All");
    setActiveTab("All");
    triggerToast("Filters reset", "info");
  };

  const handleRefreshQueue = async () => {
    await loadWaitingAppointments();
    triggerToast("Patient queue refreshed", "success");
  };

  // If currently in Record Vitals workspace mode:
  if (viewMode === "record" && activeApt) {
    return (
      <RecordPatientVitalsForm
        activeApt={activeApt}
        initialVitalsData={isEditMode ? detailsVitals : null}
        isEditMode={isEditMode}
        onBack={() => {
          setViewMode("center");
          setSelectedAptId(null);
          setSelectedAptRecord(null);
          setIsEditMode(false);
        }}
        onPatientSelect={onPatientSelect}
        onMarkReady={(submittedData) =>
          handleMarkPatientReady(submittedData, true)
        }
      />
    );
  }

  // If currently in Vitals Details (Read Only) mode:
  if (viewMode === "details" && activeApt) {
    return (
      <VitalsDetailsScreen
        activeApt={activeApt}
        vitalsData={detailsVitals || undefined}
        onBack={() => {
          setViewMode("center");
          setSelectedAptId(null);
          setSelectedAptRecord(null);
          setDetailsVitals(null);
          setIsEditMode(false);
        }}
        onEditVitals={() => {
          setIsEditMode(true);
          setViewMode("record");
        }}
        onPatientSelect={onPatientSelect}
        onPrint={() => triggerToast("Printing Vitals Summary...", "info")}
      />
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto bg-[#F1F5F9] p-6 space-y-6"
      style={{ fontFamily: RB }}
    >
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-white text-xs font-semibold flex items-center gap-2 transition-opacity duration-200 ${
            toast.type === "success"
              ? "bg-[#66BB6A] border-green-300"
              : toast.type === "error"
                ? "bg-[#EF4444] border-red-300"
                : "bg-[#0D47A1] border-blue-300"
          }`}
        >
          <AlertCircle size={16} />
          {toast.message}
        </div>
      )}

      {/* HEADER BAR WITH BACK BUTTON */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack || (() => window.history.back())}
            className="p-2.5 rounded-xl border border-[#E5E7EB] bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1
              className="text-xl font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Vitals Management Center
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Manage patient vital recording before OPD consultation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshQueue}
            className="px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            style={{ fontFamily: PP }}
          >
            <RefreshCw size={14} className="text-[#0D47A1]" /> Refresh Queue
          </button>
        </div>
      </div>

      {/* SUMMARY KPI CARDS */}
      <VitalsKpiSummaryCards kpiStats={kpiStats} />

      {/* UNIFIED QUEUE WORKSPACE CARD (Search + Filters + Data-Grid Table) */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
        {/* TABLE TITLE BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
          <div>
            <h2
              className="text-base font-bold text-[#111827] flex items-center gap-2"
              style={{ fontFamily: PP }}
            >
              Vitals Queue
            </h2>
            <p
              className="text-xs text-[#64748B] mt-0.5"
              style={{ fontFamily: RB }}
            >
              Real-time patient vitals triage and waiting roster.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-[#64748B]">
              Showing{" "}
              <strong className="text-[#111827]">
                {filteredAppointments.length}
              </strong>{" "}
              queue entries
            </span>
          </div>
        </div>

        {/* SEARCH & FILTERS MINIMAL CONTAINER BOX */}
        <div className="bg-slate-50/80 border border-[#E5E7EB] rounded-lg p-2 space-y-1.5 shadow-2xs">
          {/* Single Row: Search Input + Filter Dropdowns + Reset Button */}
          <div className="flex flex-nowrap items-center gap-2 text-xs overflow-x-auto py-0.5 scrollbar-thin">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[160px] shrink-0 sm:shrink">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                aria-label="Search patient, MRN, token or appointment ID"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setQueuePage(1);
                }}
                placeholder=" Search patient, MRN..."
                className="w-full pl-7 pr-6 py-1 text-xs bg-white border border-[#E5E7EB] rounded-md outline-none focus:border-[#0D47A1] focus:ring-1 focus:ring-[#0D47A1] shadow-2xs transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Date Filter */}
            <div className="shrink-0">
              <input
                aria-label="Select date"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    setSelectedDate(val);
                    loadWaitingAppointments(val);
                  }
                }}
                className="px-2 py-1 bg-white border border-[#E5E7EB] rounded-md outline-none text-slate-700 font-medium text-xs focus:border-[#0D47A1] cursor-pointer"
              />
            </div>

            {/* Doctor Filter */}
            <div className="shrink-0">
              <select
                aria-label="Select Doctor"
                value={doctorFilter}
                onChange={(e) => {
                  setDoctorFilter(e.target.value);
                  setQueuePage(1);
                }}
                className="px-2 py-1 bg-white border border-[#E5E7EB] rounded-md outline-none text-slate-700 font-medium text-xs focus:border-[#0D47A1] cursor-pointer"
              >
                <option value="All">All Doctors</option>
                {dynamicDoctors.map((doc) => (
                  <option key={doc} value={doc}>
                    {doc}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter (ALL DEPARTMENTS) */}
            <div className="shrink-0">
              <select
                aria-label="Select Department"
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setQueuePage(1);
                }}
                className="px-2 py-1 bg-white border border-[#E5E7EB] rounded-md outline-none text-slate-700 font-medium text-xs focus:border-[#0D47A1] cursor-pointer"
              >
                <option value="All">All Departments</option>
                {dynamicDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Vitals Status Filter */}
            <div className="shrink-0">
              <select
                aria-label="Select Vitals Status"
                value={vitalsStatusFilter}
                onChange={(e) => {
                  setVitalsStatusFilter(e.target.value);
                  setQueuePage(1);
                }}
                className="px-2 py-1 bg-white border border-[#E5E7EB] rounded-md outline-none text-slate-700 font-medium text-xs focus:border-[#0D47A1] cursor-pointer"
              >
                <option value="All">All Vitals</option>
                <option value="Waiting for Vitals">Waiting for Vitals</option>
                <option value="Vitals Recorded">Vitals Recorded</option>
              </select>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1 rounded-md border border-[#E5E7EB] bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs shrink-0"
              title="Reset Filters"
              style={{ fontFamily: PP }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          {/* Active Filter Pills Bar */}
          {activeFiltersList.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5 pt-1.5 border-t border-slate-200/70 text-xs">
              <span className="text-[11px] font-medium text-slate-500 mr-1 flex items-center gap-1">
                <Filter size={12} /> Active filters:
              </span>
              {activeFiltersList.map((item) => (
                <span
                  key={item.key}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#0D47A1] border border-blue-200 text-[11px] font-semibold"
                >
                  {item.label}
                  <button
                    onClick={item.clear}
                    className="hover:text-red-600 rounded-full p-0.2 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-[#0D47A1] hover:underline font-bold ml-2 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Data Table Info & Sort Bar */}
        {/* <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
         
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (sortField === "time") {
                  setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                } else {
                  setSortField("time");
                  setSortOrder("asc");
                }
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[#E5E7EB] bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
            >
              <ArrowUpDown size={12} />
              Sort: {sortField === "time" ? "Time" : sortField === "token" ? "Token" : "Patient"}{" "}
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div> */}

        {/* DATA GRID TABLE */}
        <div className="border border-[#E5E7EB] rounded-xl overflow-x-auto shadow-2xs">
          <table className="w-full border-collapse text-left text-xs min-w-[950px]">
            <thead className="bg-slate-100/90 border-y border-[#E5E7EB] text-slate-700 font-extrabold text-[11px] uppercase tracking-wider">
              <tr style={{ fontFamily: PP }}>
                <th className="px-4.5 py-3.5 w-[8%] border-r border-slate-200/70">
                  <span className="flex items-center gap-1.5">
                    <Tag size={13} className="text-[#0D47A1]" /> TOKEN
                  </span>
                </th>
                <th className="px-4.5 py-3.5 w-[22%] border-r border-slate-200/70">
                  <span className="flex items-center gap-1.5">
                    <User size={13} className="text-[#0D47A1]" /> PATIENT
                  </span>
                </th>
                <th className="px-4.5 py-3.5 w-[16%] border-r border-slate-200/70">
                  <span className="flex items-center gap-1.5">
                    <Stethoscope size={13} className="text-[#0D47A1]" /> DOCTOR
                    & DEPT
                  </span>
                </th>
                <th className="px-4.5 py-3.5 w-[14%] border-r border-slate-200/70">
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} className="text-[#0D47A1]" /> APPOINTMENT
                  </span>
                </th>
                <th className="px-4.5 py-3.5 w-[15%] border-r border-slate-200/70">
                  <span className="flex items-center gap-1.5">
                    <Activity size={13} className="text-[#0D47A1]" /> VITALS
                    STATUS
                  </span>
                </th>
                <th className="px-4.5 py-3.5 w-[15%] text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[#111827]">
              {paginatedAppointments.map((apt) => {
                const vStatus = getVitalsStatus(apt);
                const showViewVitals = Boolean(
                  apt.hasVitals ||
                  apt.vitalsRecorded ||
                  vStatus === "Ready For Consultation",
                );

                const showRecordVitals = !showViewVitals;

                return (
                  <tr
                    key={apt.id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    {/* Token */}
                    <td className="px-4.5 py-3.5 align-top">
                      <span className="font-mono font-bold text-[#0D47A1] bg-blue-50 px-2 py-1 rounded border border-blue-100 text-xs inline-block">
                        {apt.tokenNo}
                      </span>
                    </td>

                    {/* Patient Cell (Richer design) */}
                    <td className="px-4.5 py-3.5 align-top">
                      <div className="flex items-start gap-2.5">
                        <Avatar name={apt.patientName} size="sm" />
                        <div>
                          <div className="font-bold text-slate-900 text-xs leading-tight">
                            {apt.patientName}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {apt.patientAge} years · {apt.patientGender}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            MRN: {apt.mrn}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Doctor & Dept */}
                    <td className="px-4.5 py-3.5 align-top">
                      <div className="font-semibold text-slate-800">
                        {apt.doctorName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {typeof apt.department === "string"
                          ? apt.department
                          : apt.departmentName ||
                            apt.department?.departmentName ||
                            apt.department?.name ||
                            "General OPD"}
                      </div>
                    </td>

                    {/* Appointment & Visit */}
                    <td className="px-4.5 py-3.5 align-top">
                      <div className="font-mono text-[#0D47A1] font-bold">
                        {apt.timeSlot}
                      </div>
                      <div className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 inline-block mt-1">
                        {apt.visitType}
                      </div>
                    </td>

                    {/* Vitals Status */}
                    <td className="px-4.5 py-3.5 align-top">
                      {vStatus === "Waiting for Vitals" ? (
                        <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full text-[11px] font-bold border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Waiting for Vitals
                        </span>
                      ) : vStatus === "Recording In Progress" ? (
                        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full text-[11px] font-bold border border-blue-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          In Progress
                        </span>
                      ) : vStatus === "Ready For Consultation" ? (
                        <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-800 px-2.5 py-1 rounded-full text-[11px] font-bold border border-purple-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          Ready For Doctor
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full text-[11px] font-bold border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Vitals Recorded
                        </span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="px-4.5 py-3.5 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {showRecordVitals && can("VITALS_CREATE") && (
                          <button
                            onClick={() => handleSelectPatient(apt, "record")}
                            className="px-3 py-1.5 rounded-lg bg-[#0D47A1] hover:bg-[#0c3d8a] text-white text-[11px] font-bold transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                            style={{ fontFamily: PP }}
                          >
                            Record Vitals
                          </button>
                        )}
                        {showViewVitals && can("VITALS_VIEW") && (
                          <button
                            onClick={() => handleSelectPatient(apt, "details")}
                            className="px-3 py-1.5 rounded-lg bg-[#009688] hover:bg-[#00796b] text-white text-[11px] font-bold transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                            style={{ fontFamily: PP }}
                          >
                            View Vitals
                          </button>
                        )}

                        {onViewAppointmentDetails && (
                          <button
                            onClick={() => onViewAppointmentDetails(apt)}
                            className="px-2 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                            title="View Appointment Details"
                          >
                            <Calendar size={13} />
                          </button>
                        )}
                        {onPatientSelect && (
                          <button
                            onClick={() => onPatientSelect(apt.patientId)}
                            className="px-2 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                            title="View Patient Profile"
                          >
                            <User size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {sortedAppointments.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Activity size={36} className="text-slate-300" />
                      <div
                        className="text-sm font-bold text-slate-700"
                        style={{ fontFamily: PP }}
                      >
                        No patients match the current queue criteria.
                      </div>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Try adjusting your search query, status tabs, or
                        filters.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 px-4 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#0c3d8a] transition-colors"
                        style={{ fontFamily: PP }}
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination inside Table Card */}
        {sortedAppointments.length > 0 && (
          <Pagination
            currentPage={safeQueuePage}
            totalPages={queueTotalPages}
            onPageChange={setQueuePage}
            pageSize={queuePageSize}
            totalCount={sortedAppointments.length}
          />
        )}
      </div>
    </div>
  );
}
