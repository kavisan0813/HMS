import React, {
  useState,
  useReducer,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { useNavigate } from "react-router";
import { Clock, Download, Phone, Plus, FolderOpen } from "lucide-react";
import { usePermissions } from "../../../permissions/usePermissions";
import { useConsultation } from "../hooks/useConsultation";
import { useQueue } from "../hooks/useQueue";
import {
  type ConsultationRecord,
  type OauthRole,
  type ConsultationStatus,
  appointmentStatusMap,
  isDoctorConsultationStatus,
} from "../types/consultation";
import type { QueueItem, QueueStatus } from "../types/queue.types";
import type { AppointmentStatus } from "../../appointments/types/appointment.types";
import { useAuthStore } from "../../auth/store/auth.store";
import { normalizeStatus } from "../../../lib/status-utils";
import { getTodayDateString } from "../../../lib/time-utils";
import { EncounterPrescriptionViewModal } from "../../prescriptions/components/EncounterPrescriptionViewModal";
import { ConsultationDetailsScreen } from "../components/ConsultationDetailsScreen";
import { ConsultationHistoryScreen } from "../components/ConsultationHistoryScreen";
import { EditConsultationScreen } from "../components/EditConsultationScreen";

import { appointmentsApi } from "../../appointments/api/appointments.api";
import { vitalsApi } from "../../vitals/api/vitals.api";
import { ConsultationHeader } from "../components/ConsultationHeader";
import { ConsultationKPICards } from "../components/ConsultationKPICards";
import { ConsultationTabs } from "../components/ConsultationTabs";
import { ConsultationTable } from "../components/ConsultationTable";
import { OperationalSummaryModal } from "../components/OperationalSummaryModal";

const PP = "'Poppins', system-ui, sans-serif";

export interface OPDConsultationPageProps {
  role?: OauthRole;
  onStartConsultation?: (consultationId?: string) => void;
  onOpenConsultation?: (consultationId?: string) => void;
  onViewDetails?: (consultationId: string) => void;
  onEditConsultation?: (consultationId: string) => void;
  onViewHistory?: (patientId?: string) => void;
  onPatientSelect?: (patientId: string) => void;
  onNavigateAppointments?: () => void;
  onNavigateReports?: () => void;
  onExportReport?: () => void;
}

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

function normalizeGender(gender?: string): "Male" | "Female" | "Other" {
  const g = (gender || "").toUpperCase().trim();
  if (g === "MALE" || g === "M") return "Male";
  if (g === "FEMALE" || g === "F") return "Female";
  return "Other";
}
function parseDoctorAppointmentsResponse(
  payload: unknown,
  defaultDoctorName?: string,
  defaultDept?: string,
): QueueItem[] {
  const root = (
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data: unknown }).data
      : payload
  ) as Record<string, unknown>;

  if (!root) return [];

  const rawAppointments = Array.isArray(root.appointments)
    ? root.appointments
    : Array.isArray(root.content)
      ? root.content
      : Array.isArray(root)
        ? root
        : [];

  const docNameFromRoot =
    (root.doctorName as string) || defaultDoctorName || "";

  return rawAppointments.map((aptRaw, idx) => {
    const apt = aptRaw as Record<string, unknown>;
    const patientObj = (apt.patient || {}) as Record<string, unknown>;
    const aptId = Number(apt.appointmentId || apt.id) || idx + 1;
    const tokenVal =
      (apt.queueToken as string) ||
      (apt.token as string) ||
      (apt.appointmentNumber as string) ||
      `T-${idx + 1}`;
    const rawStatus =
      (apt.status as string) || (apt.queueStatus as string) || "WAITING";
    const patientName =
      (patientObj.fullName as string) ||
      (patientObj.name as string) ||
      (apt.patientName as string) ||
      "Patient";
    const mrn = (patientObj.mrn as string) || (apt.mrn as string) || "—";
    const phone =
      (patientObj.phone as string) ||
      (patientObj.contact as string) ||
      (apt.phone as string) ||
      "—";

    const hasVitalsRecorded =
      rawStatus === "WAITING_FOR_DOCTOR_CALL" ||
      rawStatus === "WAITING_FOR_DOCTOR" ||
      rawStatus === "CALLED" ||
      rawStatus === "IN_CONSULTATION" ||
      rawStatus === "COMPLETED";

    return {
      queueId: (apt.queueId as number) ?? aptId,
      appointmentId: aptId,
      appointmentNumber: (apt.appointmentNumber as string) || `APT-${aptId}`,
      token: tokenVal,
      queueNumber: (apt.queueNumber as number) ?? idx + 1,
      position: (apt.queueNumber as number) ?? idx + 1,
      priority: (apt.priority as string) || "NORMAL",
      status: rawStatus as QueueStatus,
      queueStatus: ((apt.queueStatus as string) || rawStatus) as QueueStatus,
      checkInTime: (apt.appointmentTime as string) || "—",
      appointmentTime: (apt.appointmentTime as string) || "—",
      visitType: (apt.visitType as string) || "First Visit",
      vitalsStatus: hasVitalsRecorded ? "COMPLETED" : "WAITING",
      vitalsRecorded: hasVitalsRecorded,
      hasVitals: hasVitalsRecorded,
      patient: {
        name: patientName,
        mrn: mrn,
        age: Number(patientObj.age || 0),
        gender: String(patientObj.gender || "Male"),
        contact: phone,
      },
      doctor: {
        doctorId: (root.doctorId as number) || 0,
        name: docNameFromRoot,
        doctorCode: (root.doctorCode as string) || "",
        department: defaultDept || "General OPD",
        specialty: defaultDept || "General OPD",
      },
    } as unknown as QueueItem;
  });
}

function mapQueueItemToConsultation(
  item: QueueItem,
  defaultDoctorName?: string,
  defaultDepartment?: string,
): ConsultationRecord {
  const rawItem = item as unknown as Record<string, unknown>;
  const hasVitalsRecorded = Boolean(
    item.queueStatus === "WAITING_FOR_DOCTOR_CALL" ||
    item.queueStatus === "WAITING_FOR_DOCTOR" ||
    rawItem.vitalsStatus === "COMPLETED" ||
    rawItem.vitalsStatus === "Vitals Recorded" ||
    rawItem.vitalsStatus === "VITALS_RECORDED" ||
    rawItem.vitalsRecorded === true ||
    rawItem.hasVitals === true ||
    rawItem.vitalsId != null ||
    rawItem.vitals != null ||
    (item.status as string) === "WAITING_FOR_DOCTOR_CALL" ||
    (item.status as string) === "WAITING_FOR_DOCTOR" ||
    (item.status as string) === "CALLED" ||
    (item.status as string) === "IN_CONSULTATION" ||
    (item.status as string) === "COMPLETED" ||
    (item.status as string) === "CONSULTATION_COMPLETED" ||
    (item.status as string) === "Vitals Recorded" ||
    (item.status as string) === "VITALS_RECORDED",
  );

  const statusMap: Record<string, ConsultationStatus> = {
    WAITING: hasVitalsRecorded ? "WAITING_FOR_DOCTOR" : "WAITING_FOR_VITALS",
    WAITING_FOR_VITALS: "WAITING_FOR_VITALS",
    WAITING_FOR_DOCTOR: "WAITING_FOR_DOCTOR",
    WAITING_FOR_DOCTOR_CALL: "WAITING_FOR_DOCTOR",
    CALLED: "CALLED",
    IN_CONSULTATION: "IN_CONSULTATION",
    IN_PROGRESS: "IN_CONSULTATION",
    CONSULTATION_COMPLETED: "COMPLETED",
    COMPLETED: "COMPLETED",
    FINALIZED: "COMPLETED",
    FINISHED: "COMPLETED",
    CLOSED: "COMPLETED",
    READY_FOR_BILLING: "COMPLETED",
    BILLING_PENDING: "COMPLETED",
    PAYMENT_COMPLETED: "COMPLETED",
    CHECKED_OUT: "COMPLETED",
    DONE: "COMPLETED",
  };
  const rawStatus =
    (item as { appointmentStatus?: string }).appointmentStatus ||
    item.status ||
    item.queueStatus ||
    "";
  const normalizedStatus = normalizeStatus(rawStatus);

  const patientObj = (item.patient ||
    rawItem.patient ||
    {}) as unknown as Record<string, unknown>;
  const doctorObj = (item.doctor || rawItem.doctor || {}) as unknown as Record<
    string,
    unknown
  >;

  const doctorName =
    item.doctor?.name ||
    (doctorObj.name as string) ||
    (doctorObj.fullName as string) ||
    (rawItem.doctorName as string) ||
    (rawItem.doctorFullName as string) ||
    (typeof rawItem.doctor === "string"
      ? rawItem.doctor
      : ((rawItem.doctor as Record<string, unknown>)?.name as string)) ||
    defaultDoctorName ||
    "—";

  const departmentName =
    item.doctor?.department ||
    item.doctor?.specialty ||
    (doctorObj.department as string) ||
    (doctorObj.specialty as string) ||
    (rawItem.departmentName as string) ||
    (typeof rawItem.department === "string"
      ? (rawItem.department as string)
      : ((rawItem.department as Record<string, unknown>)
          ?.departmentName as string) ||
        ((rawItem.department as Record<string, unknown>)?.name as string)) ||
    (rawItem.deptName as string) ||
    (rawItem.dept as string) ||
    (rawItem.specialty as string) ||
    (rawItem.doctorSpecialty as string) ||
    defaultDepartment ||
    "OPD";

  const tokenNo =
    item.token ||
    item.appointmentNumber ||
    (rawItem.token as string) ||
    (rawItem.appointmentNumber as string) ||
    (rawItem.tokenNumber as string) ||
    (rawItem.queueToken as string) ||
    (rawItem.tokenNo ? String(rawItem.tokenNo) : "") ||
    (item.queueNumber ? `T-${String(item.queueNumber).padStart(3, "0")}` : "");

  const apptTime =
    item.appointmentTime ||
    item.checkInTime ||
    (rawItem.appointmentTime as string) ||
    (rawItem.checkInTime as string) ||
    (rawItem.time as string) ||
    (rawItem.slotTime as string) ||
    (rawItem.scheduleTime as string) ||
    (rawItem.scheduledTime as string) ||
    (rawItem.visitTime as string) ||
    (rawItem.startTime as string) ||
    (rawItem.createdAt as string) ||
    (rawItem.createdDate as string) ||
    (rawItem.date as string) ||
    "";

  const patientName =
    item.patient?.name ||
    (patientObj.name as string) ||
    (patientObj.fullName as string) ||
    (rawItem.patientName as string) ||
    "";

  const mrn =
    item.patient?.mrn ||
    (patientObj.mrn as string) ||
    (rawItem.mrn as string) ||
    (rawItem.patientMrn as string) ||
    "";

  const phone =
    item.patient?.contact ||
    (patientObj.contact as string) ||
    (patientObj.phone as string) ||
    (patientObj.mobile as string) ||
    (rawItem.patientPhone as string) ||
    (rawItem.phone as string) ||
    (rawItem.mobile as string) ||
    "";

  return {
    id: String(
      item.appointmentId ||
        (rawItem.appointmentId as number) ||
        (rawItem.appointment as Record<string, unknown>)?.id ||
        rawItem.id ||
        rawItem.queueId ||
        "",
    ),
    appointmentId:
      item.appointmentId ||
      (rawItem.appointmentId as number) ||
      ((rawItem.appointment as Record<string, unknown>)?.id as number) ||
      (rawItem.id as number),
    encounterId:
      (rawItem.encounterId as number | string) ||
      ((rawItem.encounter as Record<string, unknown>)?.id as number | string) ||
      ((rawItem.encounter as Record<string, unknown>)?.encounterId as
        | number
        | string) ||
      ((rawItem.encounter as Record<string, unknown>)?.encounterId as
        | number
        | string) ||
      (rawItem.encounter_id as number | string) ||
      (item as unknown as { encounterId?: number | string })?.encounterId,
    patientId:
      (item.patient as unknown as { id?: number | string })?.id ||
      (patientObj.id as number | string) ||
      (rawItem.patientId as number | string) ||
      (rawItem.patient_id as number | string),
    tokenNo,
    patientName,
    mrn,
    age:
      item.patient?.age && item.patient.age > 0
        ? item.patient.age
        : calculateAge(
            item.patient?.dateOfBirth ||
              (patientObj.dateOfBirth as string) ||
              (rawItem.dob as string),
          ),
    gender: normalizeGender(
      item.patient?.gender ||
        (patientObj.gender as string) ||
        (rawItem.gender as string),
    ),
    phone,
    doctor: doctorName,
    department: departmentName,
    appointmentTime: apptTime,
    visitType: (item.visitType === "Follow-up"
      ? "Follow-up"
      : item.visitType === "Walk-In"
        ? "Walk-In"
        : item.visitType === "New Consultation"
          ? "New Consultation"
          : "First Visit") as ConsultationRecord["visitType"],
    status:
      statusMap[normalizedStatus] || (normalizedStatus as ConsultationStatus),
    chiefComplaint: "",
    opdRoom: "",
    date:
      item.appointmentTime?.split("T")[0] ||
      item.checkInTime?.split("T")[0] ||
      new Date().toISOString().split("T")[0],
    vitals: undefined,
    clinicalExamination: undefined,
    advice: undefined,
    doctorName,
    completionTime: "",
    allergies: [],
    bloodGroup: "",
    durationOfSymptoms: "",
  };
}
interface FilterState {
  filterDate: string;
  filterDoctor: string;
  filterDepartment: string;
  filterStatus: string;
  filterVisitType: string;
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

function OPDConsultationPage({
  role: overrideRole,
  onStartConsultation,
  onOpenConsultation,
  onViewDetails,
  onEditConsultation,
  onViewHistory,
  onPatientSelect,
  onExportReport,
}: OPDConsultationPageProps) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const user = useAuthStore((s) => s.user);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const {
    callPatient: apiCallPatient,
    startConsultation: apiStartConsultation,
  } = useConsultation();

  const userRoleUpper = String(user?.role || "").toUpperCase();
  const isDoctor = overrideRole
    ? overrideRole === "doctor"
    : userRoleUpper === "DOCTOR" || userRoleUpper === "ROLE_DOCTOR";
  const resolvedRole: OauthRole = isDoctor ? "doctor" : "admin";

  // Resolve doctorId: parse out DOC- prefix so NaN is never passed
  const rawDocId = isDoctor
    ? (user?.doctorProfile?.doctorId ?? user?.doctorId ?? user?.id ?? undefined)
    : undefined;
  const parsedDocId = rawDocId
    ? String(rawDocId).replace(/^DOC-/, "").trim()
    : undefined;
  const numericDocId =
    parsedDocId && !isNaN(Number(parsedDocId))
      ? Number(parsedDocId)
      : undefined;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(false);

  const [filters, dispatch] = useReducer(filterReducer, {
    filterDate: getTodayDateString(),
    filterDoctor: "All",
    filterDepartment: "All",
    filterStatus: "All",
    filterVisitType: "All",
  });
  const setFilter = (field: keyof FilterState, value: string) =>
    dispatch({ type: "SET_FIELD", field, value });

  const {
    items: queueItems,
    refetch,
    error: queueError,
  } = useQueue({
    doctorId: numericDocId,
    date: filters.filterDate,
  });

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const [nurseQueueItems, setNurseQueueItems] = useState<QueueItem[]>([]);
  const [doctorApptItems, setDoctorApptItems] = useState<QueueItem[]>([]);

  const currentDoctorName = isDoctor
    ? user?.fullName || user?.name
      ? `Dr. ${user?.fullName || user?.name}`
      : ""
    : "";
  const currentDepartment = isDoctor
    ? String(user?.doctorProfile?.department || user?.department || "")
    : "";

  useEffect(() => {
    if (!isDoctor || !numericDocId) return;

    let active = true;
    const fetchDoctorAppts = async () => {
      try {
        const resPayload = await appointmentsApi.getDoctorAppointments(
          numericDocId,
          filters.filterDate,
        );
        if (!active) return;
        const parsedItems = parseDoctorAppointmentsResponse(
          resPayload,
          currentDoctorName,
          currentDepartment,
        );
        setDoctorApptItems(parsedItems);
      } catch (err) {
        console.warn(
          "Failed to fetch doctor appointments for OPD consultation page:",
          err,
        );
      }
    };

    void fetchDoctorAppts();
    const timer = setInterval(fetchDoctorAppts, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [
    isDoctor,
    numericDocId,
    filters.filterDate,
    currentDoctorName,
    currentDepartment,
  ]);

  useEffect(() => {
    if (isDoctor) return;

    let active = true;
    const fetchNurseQueue = async () => {
      try {
        const patients = await vitalsApi.getNurseQueue(filters.filterDate);
        if (!active || !Array.isArray(patients)) return;

        const mappedNurseItems: QueueItem[] = patients
          .filter((p) => {
            const vStat = String(p.vitalsStatus || "").toUpperCase();
            const cStat = String(p.consultationStatus || "").toUpperCase();
            return (
              vStat === "COMPLETED" ||
              vStat === "VITALS_RECORDED" ||
              vStat === "VITALS RECORDED" ||
              cStat === "WAITING_FOR_DOCTOR" ||
              cStat === "WAITING_FOR_DOCTOR_CALL" ||
              cStat === "READY_FOR_CONSULTATION"
            );
          })
          .map((p, idx) => {
            const aptId =
              Number(String(p.appointmentId || "").replace(/\D+/g, "")) ||
              idx + 1000;
            return {
              queueId: aptId,
              appointmentId: aptId,
              appointmentNumber: String(
                p.token || p.appointmentId || `TK-${idx + 1}`,
              ),
              token: String(p.token || "—"),
              queueNumber: idx + 1,
              position: idx + 1,
              priority: p.priority || "NORMAL",
              status: (p.consultationStatus ||
                "WAITING_FOR_DOCTOR_CALL") as QueueStatus,
              queueStatus: (p.consultationStatus ||
                "WAITING_FOR_DOCTOR_CALL") as QueueStatus,
              checkInTime: p.checkInTime || p.appointmentTime || "—",
              appointmentTime: p.appointmentTime || p.checkInTime || "—",
              visitType: "First Visit",
              vitalsStatus: p.vitalsStatus,
              vitalsRecorded: true,
              hasVitals: true,
              patient: {
                name: p.patientName || "Patient",
                mrn: String(p.patientId || p.mrn || "—"),
                age: Number(p.age || 0),
                gender: String(p.gender || "Male"),
                contact: String(p.phone || p.contact || "—"),
              },
              doctor: {
                doctorId: 0,
                name: p.doctorName || "Duty Doctor",
                doctorCode: "",
                department: p.department || "General OPD",
                specialty: p.department || "General OPD",
              },
            } as unknown as QueueItem;
          });

        if (active) {
          setNurseQueueItems(mappedNurseItems);
        }
      } catch (err) {
        console.warn(
          "Failed to fetch nurse queue for OPD consultation page:",
          err,
        );
      }
    };

    void fetchNurseQueue();
    const interval = setInterval(fetchNurseQueue, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isDoctor, filters.filterDate]);

  const allQueueItems = useMemo(() => {
    if (isDoctor) {
      if (doctorApptItems.length > 0) {
        return doctorApptItems;
      }
      return queueItems;
    }
    const map = new Map<string, QueueItem>();
    nurseQueueItems.forEach((item) => {
      const key = String(item.appointmentId || item.queueId);
      map.set(key, item);
    });
    queueItems.forEach((item) => {
      const key = String(item.appointmentId || item.queueId);
      const existing = map.get(key);
      if (existing) {
        map.set(key, { ...existing, ...item });
      } else {
        map.set(key, item);
      }
    });
    return Array.from(map.values());
  }, [isDoctor, doctorApptItems, queueItems, nurseQueueItems]);

  const mappedConsultations = useMemo(() => {
    return allQueueItems.map((item) =>
      mapQueueItemToConsultation(item, currentDoctorName, currentDepartment),
    );
  }, [allQueueItems, currentDoctorName, currentDepartment]);

  // On the OPD Consultation page, show ONLY patients who have completed vitals and are ready/waiting for doctor
  const consultations = useMemo(() => {
    return mappedConsultations.filter(
      (item) =>
        item.status !== "WAITING_FOR_VITALS" &&
        item.status !== "BOOKED" &&
        item.status !== "CONFIRMED" &&
        item.status !== "SCHEDULED" &&
        isDoctorConsultationStatus(item.status),
    );
  }, [mappedConsultations]);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [selectedPrescriptionRecord, setSelectedPrescriptionRecord] =
    useState<ConsultationRecord | null>(null);
  const [viewPrescriptionEncounterId, setViewPrescriptionEncounterId] =
    useState<string | number | null>(null);
  const [editingConsultationId, setEditingConsultationId] = useState<
    string | null
  >(null);
  const [calledPatientIds, setCalledPatientIds] = useState<Set<string>>(
    new Set(),
  );

  const handleEditConsultation = (id: string | number) => {
    const idStr = String(id);
    setEditingConsultationId(idStr);
    onEditConsultation?.(idStr);
  };

  const handleViewPrescriptionDetails = (id: string) => {
    const localRecord = consultations.find((c) => c.id === id);
    if (localRecord) {
      setSelectedPrescriptionRecord(localRecord);
    }
    setViewPrescriptionEncounterId(id);
    if (onViewDetails) {
      onViewDetails(id);
    }
  };

  const waitingStatuses = useMemo(
    () =>
      new Set<ConsultationStatus>([
        "WAITING_FOR_DOCTOR_CALL",
        "WAITING_FOR_DOCTOR",
        "WAITING",
      ]),
    [],
  );

  const doctorOptions = useMemo(() => {
    const docs = Array.from(
      new Set(consultations.flatMap((c) => (c.doctor ? [c.doctor] : []))),
    );
    return [
      { value: "All", label: "All Doctors" },
      ...docs.map((d) => ({ value: d, label: d })),
    ];
  }, [consultations]);

  const departmentOptions = useMemo(() => {
    const depts = Array.from(
      new Set(
        consultations.flatMap((c) => (c.department ? [c.department] : [])),
      ),
    );
    return [
      { value: "All", label: "All Departments" },
      ...depts.map((d) => ({ value: d, label: d })),
    ];
  }, [consultations]);

  const filteredConsultations = useMemo(() => {
    return consultations.filter((item) => {
      const itemStatusUpper = String(item.status || "")
        .toUpperCase()
        .replace(/[\s-]/g, "_");
      if (activeTab === "Waiting" || activeTab === "WAITING") {
        if (!waitingStatuses.has(itemStatusUpper as ConsultationStatus)) {
          return false;
        }
      } else if (activeTab !== "All") {
        const activeTabUpper = String(activeTab)
          .toUpperCase()
          .replace(/[\s-]/g, "_");
        if (
          activeTabUpper === "COMPLETED" ||
          activeTabUpper === "CONSULTATION_COMPLETED"
        ) {
          const isComp =
            itemStatusUpper === "COMPLETED" ||
            itemStatusUpper === "CONSULTATION_COMPLETED" ||
            itemStatusUpper === "FINALIZED" ||
            itemStatusUpper === "FINISHED" ||
            itemStatusUpper === "CLOSED" ||
            itemStatusUpper === "READY_FOR_BILLING" ||
            itemStatusUpper === "BILLING_PENDING" ||
            itemStatusUpper === "PAYMENT_COMPLETED" ||
            itemStatusUpper === "CHECKED_OUT" ||
            itemStatusUpper === "DONE";
          if (!isComp) return false;
        } else if (itemStatusUpper !== activeTabUpper) {
          return false;
        }
      }
      if (filters.filterStatus !== "All") {
        const filterStatusUpper = String(filters.filterStatus)
          .toUpperCase()
          .replace(/[\s-]/g, "_");
        if (
          filterStatusUpper === "WAITING_FOR_DOCTOR_CALL" ||
          filterStatusUpper === "WAITING_FOR_DOCTOR" ||
          filterStatusUpper === "WAITING"
        ) {
          if (!waitingStatuses.has(itemStatusUpper as ConsultationStatus))
            return false;
        } else if (
          filterStatusUpper === "COMPLETED" ||
          filterStatusUpper === "CONSULTATION_COMPLETED"
        ) {
          const isComp =
            itemStatusUpper === "COMPLETED" ||
            itemStatusUpper === "CONSULTATION_COMPLETED" ||
            itemStatusUpper === "FINALIZED" ||
            itemStatusUpper === "FINISHED" ||
            itemStatusUpper === "CLOSED" ||
            itemStatusUpper === "READY_FOR_BILLING" ||
            itemStatusUpper === "BILLING_PENDING" ||
            itemStatusUpper === "PAYMENT_COMPLETED" ||
            itemStatusUpper === "CHECKED_OUT" ||
            itemStatusUpper === "DONE";
          if (!isComp) return false;
        } else if (itemStatusUpper !== filterStatusUpper) {
          return false;
        }
      }
      if (
        filters.filterVisitType !== "All" &&
        item.visitType !== filters.filterVisitType
      )
        return false;
      if (
        filters.filterDepartment !== "All" &&
        item.department !== filters.filterDepartment
      )
        return false;
      if (
        filters.filterDoctor !== "All" &&
        item.doctor !== filters.filterDoctor
      )
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.patientName.toLowerCase().includes(q);
        const matchMrn = item.mrn.toLowerCase().includes(q);
        const matchId = item.id.toLowerCase().includes(q);
        const matchPhone = (item.phone || "").toLowerCase().includes(q);
        const matchDoc = item.doctor.toLowerCase().includes(q);
        if (!matchName && !matchMrn && !matchId && !matchPhone && !matchDoc)
          return false;
      }

      return true;
    });
  }, [
    consultations,
    activeTab,
    filters.filterStatus,
    filters.filterVisitType,
    filters.filterDepartment,
    filters.filterDoctor,
    searchQuery,
    waitingStatuses,
  ]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilter("filterDate", new Date().toISOString().split("T")[0]);
    setFilter("filterDoctor", "All");
    setFilter("filterDepartment", "All");
    setFilter("filterStatus", "All");
    setFilter("filterVisitType", "All");
    setActiveTab("All");
  };

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    refetch();
    setTimeout(() => setIsLoading(false), 500);
  }, [refetch]);

  const tabCounts = useMemo(() => {
    const waitingCount = consultations.filter((c) => {
      const statusUpper = String(c.status || "")
        .toUpperCase()
        .replace(/[\s-]/g, "_");
      return waitingStatuses.has(statusUpper as ConsultationStatus);
    }).length;
    const counts: Record<string, number> = {
      All: consultations.length,
      WAITING: waitingCount,
      WAITING_FOR_DOCTOR: waitingCount,
      WAITING_FOR_DOCTOR_CALL: waitingCount,
      CALLED: consultations.filter((c) => {
        const s = String(c.status || "")
          .toUpperCase()
          .replace(/[\s-]/g, "_");
        return s === "CALLED";
      }).length,
      IN_CONSULTATION: consultations.filter((c) => {
        const s = String(c.status || "")
          .toUpperCase()
          .replace(/[\s-]/g, "_");
        return s === "IN_CONSULTATION";
      }).length,
      COMPLETED: consultations.filter((c) => {
        const s = String(c.status || "")
          .toUpperCase()
          .replace(/[\s-]/g, "_");
        return (
          s === "COMPLETED" ||
          s === "CONSULTATION_COMPLETED" ||
          s === "FINALIZED" ||
          s === "FINISHED" ||
          s === "CLOSED" ||
          s === "READY_FOR_BILLING" ||
          s === "BILLING_PENDING" ||
          s === "PAYMENT_COMPLETED" ||
          s === "CHECKED_OUT" ||
          s === "DONE"
        );
      }).length,
      Waiting: waitingCount,
    };
    return counts;
  }, [consultations, waitingStatuses]);

  const currentPatient = consultations.find((c) => {
    const s = String(c.status || "")
      .toUpperCase()
      .replace(/[\s-]/g, "_");
    return s === "IN_CONSULTATION";
  });
  const calledPatient = consultations.find((c) => {
    const s = String(c.status || "")
      .toUpperCase()
      .replace(/[\s-]/g, "_");
    return s === "CALLED";
  });
  const nextPatient = consultations.find((c) => {
    const s = String(c.status || "")
      .toUpperCase()
      .replace(/[\s-]/g, "_");
    return waitingStatuses.has(s as ConsultationStatus);
  });
  const hasCalledPatient = consultations.some((c) => {
    const s = String(c.status || "")
      .toUpperCase()
      .replace(/[\s-]/g, "_");
    return s === "CALLED";
  });

  const handleCallPatient = async (record: ConsultationRecord) => {
    setCalledPatientIds((prev) => {
      const next = new Set(prev);
      if (record.id) next.add(String(record.id));
      if (record.appointmentId != null) next.add(String(record.appointmentId));
      if (record.tokenNo) next.add(String(record.tokenNo));
      return next;
    });

    try {
      const primaryId = record.appointmentId || record.id;
      const secondaryId = record.tokenNo || record.id;
      await apiCallPatient(primaryId, secondaryId);
      triggerToast(`Called patient ${record.patientName || ""}`);
    } catch {
      // non-blocking
    } finally {
      await refetch();
    }
  };

  const handleStartConsultation = async (
    record?: ConsultationRecord,
  ): Promise<void> => {
    if (!record) {
      if (calledPatient) await handleStartConsultation(calledPatient);
      return;
    }
    try {
      setIsLoading(true);
      await apiStartConsultation(
        {
          id: record.id,
          patientId: record.patientId || record.id,
          patientName: record.patientName,
          doctorId: 0,
          doctorName: record.doctor,
          specialty: record.doctorSpecialty || "",
          departmentName: record.department,
          appointmentTime: record.appointmentTime,
          time: record.appointmentTime || "",
          appointmentDate: record.date,
          tokenNumber: record.tokenNo,
          roomNumber: record.opdRoom,
          appointmentType: record.visitType,
          status: (record.status as AppointmentStatus) || "IN_CONSULTATION",
          chiefComplaint: record.chiefComplaint,
        },
        record.chiefComplaint,
      ).catch(() => null);

      await refetch();
      if (onStartConsultation) {
        onStartConsultation(record.id);
      }
      navigate(`/doctor/consultation/${record.id}`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to start consultation";
      console.error("Failed to start consultation:", err);
      triggerToast(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenConsultation = (id: string) => {
    if (onOpenConsultation) {
      onOpenConsultation(id);
    } else {
      navigate(`/doctor/consultation/${id}`);
    }
  };

  const handleExportReport = () => {
    if (onExportReport) {
      onExportReport();
    } else {
      alert("Exporting OPD Operational Report (PDF/Excel)");
    }
  };

  const tabs = [
    { id: "All", label: "All", count: tabCounts.All },
    {
      id: "Waiting",
      label: "Waiting",
      count: tabCounts.Waiting || 0,
    },
    {
      id: "IN_CONSULTATION",
      label: appointmentStatusMap["IN_CONSULTATION"],
      count: tabCounts.IN_CONSULTATION || 0,
    },
    {
      id: "COMPLETED",
      label: appointmentStatusMap.COMPLETED,
      count: tabCounts.COMPLETED || 0,
    },
  ];

  const [viewingHistoryMrn, setViewingHistoryMrn] = useState<string | null>(
    null,
  );

  if (viewingHistoryMrn) {
    return (
      <ConsultationHistoryScreen
        patientId={viewingHistoryMrn}
        role={resolvedRole}
        onBack={() => setViewingHistoryMrn(null)}
        onStartNewConsultation={() => {
          setViewingHistoryMrn(null);
          onStartConsultation?.();
        }}
        onViewFullConsultation={(encId) => {
          setViewingHistoryMrn(null);
          handleViewPrescriptionDetails(encId);
        }}
        onPatientSelect={(mrn) => {
          setViewingHistoryMrn(null);
          onPatientSelect?.(mrn);
        }}
      />
    );
  }

  if (selectedPrescriptionRecord) {
    const pRec = selectedPrescriptionRecord as unknown as Record<
      string,
      unknown
    >;
    const pSub = (pRec.patient as Record<string, unknown>) || {};
    return (
      <ConsultationDetailsScreen
        consultationId={selectedPrescriptionRecord.id}
        encounterId={
          selectedPrescriptionRecord.encounterId ||
          selectedPrescriptionRecord.id
        }
        initialRecord={{
          id: `ENC-${selectedPrescriptionRecord.encounterId || selectedPrescriptionRecord.id}`,
          visitDate: selectedPrescriptionRecord.date,
          completionTime: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          patientName: selectedPrescriptionRecord.patientName,
          mrn: selectedPrescriptionRecord.mrn,
          age: selectedPrescriptionRecord.age,
          gender: selectedPrescriptionRecord.gender,
          bloodGroup:
            (pRec.bloodGroup as string) || (pSub.bloodGroup as string) || "—",
          doctorName:
            selectedPrescriptionRecord.doctorName ||
            selectedPrescriptionRecord.doctor,
          department: selectedPrescriptionRecord.department,
          visitType: selectedPrescriptionRecord.visitType,
          chiefComplaint:
            selectedPrescriptionRecord.chiefComplaint || "None recorded",
          vitals: {
            height: selectedPrescriptionRecord.vitals?.height || "—",
            weight: selectedPrescriptionRecord.vitals?.weight || "—",
            bmi: selectedPrescriptionRecord.vitals?.bmi || "—",
            temperature: selectedPrescriptionRecord.vitals?.temp || "—",
            bp: selectedPrescriptionRecord.vitals?.bp || "—",
            pulse: selectedPrescriptionRecord.vitals?.pulse || "—",
            respiratoryRate:
              selectedPrescriptionRecord.vitals?.respiratoryRate || "—",
            spo2: selectedPrescriptionRecord.vitals?.spo2 || "—",
            bloodSugar: selectedPrescriptionRecord.vitals?.bloodSugar || "—",
          },
          clinicalExamination:
            selectedPrescriptionRecord.clinicalExamination || "—",
          provisionalDiagnosis: "Recorded",
          finalDiagnosis:
            selectedPrescriptionRecord.finalDiagnosis || "Recorded",
          icdCode: selectedPrescriptionRecord.icdCode || "—",
          medicines: (selectedPrescriptionRecord.medicines || []).map(
            (m, idx: number) => {
              const medObj = m as unknown as Record<string, unknown>;
              return {
                id: String(medObj.id || idx + 1),
                name: String(medObj.name || "Medication"),
                dosage: String(medObj.dosage || "1 tab"),
                frequency: String(medObj.frequency || "Once daily"),
                duration: String(medObj.duration || "5 days"),
                instructions: String(medObj.instructions || "After food"),
              };
            },
          ),
          investigations: [],
          investigationRemarks: "—",
          symptoms: "—",
          assessment: "—",
          advice: "Follow doctor advice",
          lifestyleRecommendations: "—",
          followupRequired: "No",
          nextVisitDate: selectedPrescriptionRecord.date || "—",
          followupNotes: "—",
          status: "Completed",
          tokenNo: selectedPrescriptionRecord.tokenNo || "TK-01",
        }}
        onBack={() => setSelectedPrescriptionRecord(null)}
        onViewHistory={(mrn) =>
          setViewingHistoryMrn(mrn || selectedPrescriptionRecord.mrn)
        }
        onViewPatientProfile={(mrn) =>
          onPatientSelect?.(mrn || selectedPrescriptionRecord.mrn)
        }
      />
    );
  }

  if (editingConsultationId) {
    return (
      <EditConsultationScreen
        consultationId={editingConsultationId}
        onBack={() => setEditingConsultationId(null)}
        onUpdateSuccess={() => {
          setEditingConsultationId(null);
          void handleRefresh();
        }}
        onViewHistory={onViewHistory}
      />
    );
  }

  return (
    <div className="flex-1 bg-[#F1F5F9] overflow-y-auto flex flex-col font-sans">
      {/* ── BREADCRUMB & HEADER SECTION ── */}
      <ConsultationHeader
        roleLabel={resolvedRole === "admin" ? "Hospital Admin" : "Doctor"}
        moduleLabel="OPD Consultation Management"
        pageTitle={
          resolvedRole === "admin"
            ? "OPD Consultation Monitoring"
            : "OPD Consultation Management"
        }
        subtitle={
          resolvedRole === "admin"
            ? "Monitor outpatient consultation workflow and doctor activities."
            : "Manage outpatient consultations and patient visits efficiently."
        }
        breadcrumbs={[]}
        onBack={() => navigate(-1)}
        actions={
          resolvedRole === "admin" ? (
            <>
              <button
                onClick={() => setShowSummaryModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#111827] hover:bg-slate-50 text-sm font-semibold transition-colors shadow-sm"
                style={{ fontFamily: PP }}
              >
                <Clock size={16} className="text-[#0D47A1]" />
                Today's Summary
              </button>
              <button
                onClick={handleExportReport}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-[#0a3880] text-white text-sm font-semibold transition-colors shadow-sm"
                style={{ fontFamily: PP }}
              >
                <Download size={16} />
                Export Report
              </button>
            </>
          ) : (
            <>
              {can("CONSULTATION_START") && hasCalledPatient && (
                <button
                  onClick={() => handleStartConsultation(calledPatient)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#009688] hover:bg-[#00796B] text-white text-sm font-semibold transition-colors shadow-sm"
                  style={{ fontFamily: PP }}
                >
                  <Plus size={16} /> Start Consultation
                </button>
              )}
              {can("CONSULTATION_START") &&
                !hasCalledPatient &&
                nextPatient && (
                  <button
                    onClick={() => handleCallPatient(nextPatient)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors shadow-sm"
                    style={{ fontFamily: PP }}
                  >
                    <Phone size={16} /> Call Next Patient
                  </button>
                )}
              {can("CONSULTATION_START") && currentPatient && (
                <button
                  onClick={() => handleOpenConsultation(currentPatient.id)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D47A1] hover:bg-[#0a3880] text-white text-sm font-semibold transition-colors shadow-sm"
                  style={{ fontFamily: PP }}
                >
                  <FolderOpen size={16} /> Open Consultation
                </button>
              )}
            </>
          )
        }
      />

      <div className="p-6 space-y-6 flex-1">
        {queueError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Unable to load consultation queue:{" "}
            {queueError instanceof Error
              ? queueError.message
              : "Please refresh and try again."}
          </div>
        )}
        {toastMsg && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {toastMsg}
          </div>
        )}
        {/* ── SUMMARY KPI CARDS ── */}
        <ConsultationKPICards
          role={resolvedRole}
          consultations={consultations}
          tabCounts={tabCounts}
        />

        {/* LEFT & CENTER CONTENT */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* CONSULTATION STATUS TABS */}
          <ConsultationTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={tabs}
          />

          {/* ENTERPRISE DATA TABLE WITH EMBEDDED SEARCH & FILTERS */}
          <ConsultationTable
            role={resolvedRole}
            filteredConsultations={filteredConsultations}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterDate={filters.filterDate}
            onDateChange={(value) => setFilter("filterDate", value)}
            filterDoctor={filters.filterDoctor}
            onDoctorChange={(value) => setFilter("filterDoctor", value)}
            filterDepartment={filters.filterDepartment}
            onDepartmentChange={(value) => setFilter("filterDepartment", value)}
            filterStatus={filters.filterStatus}
            onStatusChange={(value) => setFilter("filterStatus", value)}
            filterVisitType={filters.filterVisitType}
            onVisitTypeChange={(value) => setFilter("filterVisitType", value)}
            doctorOptions={doctorOptions}
            departmentOptions={departmentOptions}
            visibleFilters={
              resolvedRole !== "doctor"
                ? ["status", "visitType", "doctor", "department"]
                : ["status", "visitType"]
            }
            onStartConsultation={
              resolvedRole === "doctor"
                ? (id) => {
                    const record = consultations.find((c) => c.id === id);
                    if (record) handleStartConsultation(record);
                  }
                : undefined
            }
            onOpenConsultation={
              resolvedRole === "doctor" ? handleOpenConsultation : undefined
            }
            onCallPatient={
              resolvedRole === "doctor" ? handleCallPatient : undefined
            }
            onCancelConsultation={undefined}
            onViewDetails={handleViewPrescriptionDetails}
            onViewHistory={onViewHistory}
            onPatientSelect={onPatientSelect}
            onPrint={(item) =>
              void alert(`Printed Operational Summary for ${item.id}`)
            }
            onResetFilters={handleResetFilters}
            canStartConsultation={resolvedRole === "doctor"}
            canPrint={can("CONSULTATION_PRINT")}
            calledPatientIds={calledPatientIds}
          />
        </div>
      </div>
      {/* ── TODAY'S SUMMARY MODAL (Admin only) ── */}
      <OperationalSummaryModal
        show={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        consultations={consultations}
        tabCounts={tabCounts}
      />

      {/* View Prescription Modal */}
      <EncounterPrescriptionViewModal
        encounterId={viewPrescriptionEncounterId}
        isOpen={Boolean(viewPrescriptionEncounterId)}
        onClose={() => setViewPrescriptionEncounterId(null)}
        onEditConsultation={(id) => {
          setViewPrescriptionEncounterId(null);
          handleEditConsultation(id);
        }}
      />
    </div>
  );
}

export const OpdConsultationCenterScreen: React.FC<OPDConsultationPageProps> =
  OPDConsultationPage;
