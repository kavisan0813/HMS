import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  useReducer,
} from "react";
import type { FormEvent } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Search,
  Filter,
  X,
  FileCheck,
  Coffee,
  Plus,
  Trash2,
  PhoneCall,
  CalendarRange,
  User,
  Edit,
} from "lucide-react";
import type {
  DoctorRecord,
  DoctorAppointment,
  DoctorPatient,
  ApiWeeklyScheduleDay,
  DoctorDailySlot,
  ApiScheduleExceptionItem,
  DoctorQueueSummary,
  DoctorQueueItem,
  ExceptionType,
  ExceptionAction,
} from "../types/doctors.types";
import { PP, RB } from "../constants/doctors.constants";
import { TimeSelect } from "../../../components/TimeSelect";
import type { AppPermission } from "../../../permissions/types";
import { usePermissions } from "../../../permissions/usePermissions";
import { doctorsService } from "../services/doctors.service";
import { EditStaffUserDrawer } from "../../users/components/EditStaffUserDrawer";
import { usersApi } from "../../users/api/users.api";
import { doctorToEditUser } from "../utils/doctorToEditUser";
import { DeactivateDoctorDialog } from "./DeactivateDoctorDialog";
import { ActivateDoctorDialog } from "./ActivateDoctorDialog";
import { DoctorProfileHeader } from "./DoctorProfileHeader";
import { PersonalDetailsTab } from "./tabs/PersonalDetailsTab";
import {
  doctorProfileService,
  resolveDoctorId,
  resolveUserId,
  dayLabel,
} from "../services/doctorProfile.service";

import { EditDoctorProfileModal } from "./EditDoctorProfileModal";
import { MonthlyCalendarTab } from "./tabs/MonthlyCalendarTab";

export interface DoctorProfileScreenProps {
  doctor?: DoctorRecord;
  doctorId?: string;
  currentRole?: string;
  isOwnRecord?: boolean;
  onBack: () => void;
  onEdit?: (doctor: DoctorRecord) => void;
}

const SLOT_STATUS_STYLE: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-[#009688] border-emerald-200",
  BOOKED: "bg-red-50 text-[#EF4444] border-red-200",
  COMPLETED: "bg-blue-50 text-[#0D47A1] border-blue-200",
  BLOCKED: "bg-amber-50 text-[#F59E0B] border-amber-200",
  BREAK: "bg-purple-50 text-purple-600 border-purple-200",
};

const SLOT_STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Available",
  BOOKED: "Booked",
  COMPLETED: "Completed",
  BLOCKED: "Blocked",
  BREAK: "Break",
};

const APPT_STATUS_STYLE: Record<string, string> = {
  Completed: "bg-emerald-50 text-[#66BB6A] border-emerald-200",
  "In Progress": "bg-blue-50 text-[#0D47A1] border-blue-200",
  "Checked-In": "bg-sky-50 text-sky-700 border-sky-200",
  "Waiting for Vitals": "bg-sky-50 text-sky-700 border-sky-200",
  Waiting: "bg-amber-50 text-[#F59E0B] border-amber-200",
  "Waiting for Doctor": "bg-amber-50 text-[#F59E0B] border-amber-200",
  Cancelled: "bg-red-50 text-[#EF4444] border-red-200",
  Scheduled: "bg-slate-100 text-slate-600 border-slate-200",
};

const todayKey = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

const formatTime = (time?: string | null): string => {
  if (!time) return "—";
  const trimmed = String(time).trim();
  if (!trimmed) return "—";
  if (/AM|PM/i.test(trimmed)) return trimmed;
  const parts = trimmed.split(":");
  if (parts.length < 2) return trimmed;
  let hour = parseInt(parts[0], 10);
  const minute = parts[1];
  if (isNaN(hour)) return trimmed;
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${String(hour).padStart(2, "0")}:${minute} ${suffix}`;
};

const DEFAULT_DOCTOR: DoctorRecord = {
  id: "",
  userId: 0,
  doctorId: 0,
  empId: "",
  regNumber: "",
  name: "",
  fullName: "",
  gender: "Male",
  department: "",
  primaryDepartmentId: 0,
  specialty: "",
  primarySpecialtyId: 0,
  qualification: "MBBS",
  experienceYrs: 0,
  consultationFee: 0,
  followUpFee: 0,
  slotDuration: "15 mins",
  slotDurationMinutes: 15,
  availability: "Out of Office",
  status: "Inactive",
  email: "",
  phone: "N/A",
  address: "",
  dob: "",
  opdRoom: "",
  joinedDate: "",
  shiftTimings: "",
  workingDays: [],
  bio: "",
  scheduleExceptions: [],
  rawAvailability: [],
};

type TabId =
  | "overview"
  | "professional"
  | "schedule"
  | "availability"
  | "monthly_calendar"
  | "appointments"
  | "patients"
  | "exceptions"
  | "queue"
  | "timeline";

interface FilterState {
  activeTab: TabId;
  apptSearch: string;
  apptDateFilter: string;
  patientSearch: string;
}

type FilterAction =
  | { type: "SET_TAB"; tab: TabId }
  | { type: "SET_APPT_SEARCH"; query: string }
  | { type: "SET_APPT_DATE_FILTER"; filter: string }
  | { type: "SET_PATIENT_SEARCH"; query: string };

const filterReducer = (
  state: FilterState,
  action: FilterAction,
): FilterState => {
  switch (action.type) {
    case "SET_TAB":
      return { ...state, activeTab: action.tab };
    case "SET_APPT_SEARCH":
      return { ...state, apptSearch: action.query };
    case "SET_APPT_DATE_FILTER":
      return { ...state, apptDateFilter: action.filter };
    case "SET_PATIENT_SEARCH":
      return { ...state, patientSearch: action.query };
    default:
      return state;
  }
};

interface ExceptionFormState {
  isOpen: boolean;
  editingException: ApiScheduleExceptionItem | null;
  type: ExceptionType;
  startDate: string;
  endDate: string;
  fullDay: boolean;
  startTime: string;
  endTime: string;
  reason: string;
  action: ExceptionAction;
  isSaving: boolean;
}

type ExceptionFormAction =
  | { type: "OPEN_NEW" }
  | { type: "OPEN_EDIT"; payload: ApiScheduleExceptionItem }
  | { type: "CLOSE" }
  | { type: "SET_FIELD"; field: keyof ExceptionFormState; value: unknown }
  | { type: "SET_SAVING"; isSaving: boolean };

const initialExceptionFormState: ExceptionFormState = {
  isOpen: false,
  editingException: null,
  type: "VACATION",
  startDate: "",
  endDate: "",
  fullDay: true,
  startTime: "09:00",
  endTime: "12:00",
  reason: "",
  action: "BLOCK_APPOINTMENTS",
  isSaving: false,
};

const exceptionFormReducer = (
  state: ExceptionFormState,
  action: ExceptionFormAction,
): ExceptionFormState => {
  switch (action.type) {
    case "OPEN_NEW":
      return {
        ...initialExceptionFormState,
        isOpen: true,
        startDate:
          typeof todayKey === "function" ? todayKey() : state.startDate,
        endDate: typeof todayKey === "function" ? todayKey() : state.endDate,
      };
    case "OPEN_EDIT": {
      const ex = action.payload;
      const exExt = ex as unknown as Record<string, unknown>;
      return {
        ...state,
        isOpen: true,
        editingException: ex,
        type:
          (exExt.exceptionType as ExceptionType) ||
          (ex.type as ExceptionType) ||
          "VACATION",
        startDate:
          ex.startDate ||
          (exExt.exceptionDate as string) ||
          (typeof todayKey === "function" ? todayKey() : state.startDate),
        endDate:
          ex.endDate ||
          ex.startDate ||
          (exExt.exceptionDate as string) ||
          (typeof todayKey === "function" ? todayKey() : state.endDate),
        fullDay:
          (exExt.isFullDay as boolean) ?? (exExt.fullDay as boolean) ?? true,
        startTime: ex.startTime?.slice(0, 5) || "09:00",
        endTime: ex.endTime?.slice(0, 5) || "12:00",
        reason: ex.reason || "",
        action: (ex.action as ExceptionAction) || "BLOCK_APPOINTMENTS",
      };
    }
    case "CLOSE":
      return { ...state, isOpen: false, editingException: null };
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_SAVING":
      return { ...state, isSaving: action.isSaving };
    default:
      return state;
  }
};

const isSameWeek = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  if (isNaN(d.getTime())) return false;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  return d >= startOfWeek && d <= endOfWeek;
};

const isSameMonth = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  if (isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  );
};

export function DoctorProfileScreen({
  doctor,
  doctorId,
  currentRole,
  isOwnRecord = false,
  onBack,
  onEdit,
}: DoctorProfileScreenProps) {
  const { can } = usePermissions();
  const [docState, setDocState] = useState<DoctorRecord>(DEFAULT_DOCTOR);

  const visibleTabs = useMemo(() => {
    const tabs: Array<{ id: TabId; label: string; perm: AppPermission }> = [
      { id: "overview", label: "Overview", perm: "DOCTOR_OVERVIEW_VIEW" },
      {
        id: "professional",
        label: "Professional Info",
        perm: "DOCTOR_PROFESSIONAL_VIEW",
      },
      {
        id: "schedule",
        label: "Availability Schedule",
        perm: "DOCTOR_SCHEDULE_VIEW",
      },
      {
        id: "availability",
        label: "Availability Calendar",
        perm: "DOCTOR_AVAILABILITY_VIEW",
      },
      {
        id: "monthly_calendar",
        label: "Monthly Calendar",
        perm: "DOCTOR_AVAILABILITY_VIEW",
      },
      {
        id: "appointments",
        label: "Appointments",
        perm: "DOCTOR_APPOINTMENT_VIEW",
      },
      {
        id: "patients",
        label: "Assigned Patients",
        perm: "DOCTOR_PATIENTS_VIEW",
      },
      {
        id: "exceptions",
        label: "Schedule Exceptions",
        perm: "DOCTOR_EXCEPTION_MANAGE",
      },
      { id: "queue", label: "Queue", perm: "DOCTOR_QUEUE_VIEW" },
    ];
    return tabs.filter((t) => can(t.perm));
  }, [can]);

  const [filterState, dispatch] = useReducer(filterReducer, {
    activeTab: visibleTabs[0]?.id || "schedule",
    apptSearch: "",
    apptDateFilter: "All Dates",
    patientSearch: "",
  });

  // Render-phase tab reset: if current tab is not in visible tabs, correct it
  if (
    visibleTabs.length > 0 &&
    !visibleTabs.some((t) => t.id === filterState.activeTab)
  ) {
    dispatch({ type: "SET_TAB", tab: visibleTabs[0].id });
  }

  const [weeklySchedule, setWeeklySchedule] = useState<ApiWeeklyScheduleDay[]>(
    [],
  );
  const [dailyAvailability, setDailyAvailability] = useState<DoctorDailySlot[]>(
    [],
  );
  const [availDate, setAvailDate] = useState(todayKey);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [exceptions, setExceptions] = useState<ApiScheduleExceptionItem[]>([]);
  const queueSummaryRef = useRef<DoctorQueueSummary>({});
  const [queueItems, setQueueItems] = useState<DoctorQueueItem[]>([]);
  const visibleQueueItems = useMemo(() => {
    return (queueItems || []).filter((item) => {
      const s = String(item.status || item.queueStatus || "")
        .toUpperCase()
        .replace(/[\s-]/g, "_");
      return (
        s !== "WAITING_FOR_VITALS" &&
        s !== "CHECKED_IN" &&
        s !== "BOOKED" &&
        s !== "WAITING"
      );
    });
  }, [queueItems]);

  const localWaitingCount = useMemo(() => {
    return visibleQueueItems.filter((item) => {
      const s = String(item.status || item.queueStatus || "")
        .toUpperCase()
        .replace(/[\s-]/g, "_");
      return s === "WAITING_FOR_DOCTOR" || s === "WAITING_FOR_DOCTOR_CALL";
    }).length;
  }, [visibleQueueItems]);

  const localInConsultationCount = useMemo(() => {
    return visibleQueueItems.filter((item) => {
      const s = String(item.status || item.queueStatus || "")
        .toUpperCase()
        .replace(/[\s-]/g, "_");
      return s === "IN_CONSULTATION" || s === "IN_PROGRESS";
    }).length;
  }, [visibleQueueItems]);

  const localCompletedCount = useMemo(() => {
    return visibleQueueItems.filter((item) => {
      const s = String(item.status || item.queueStatus || "")
        .toUpperCase()
        .replace(/[\s-]/g, "_");
      return s === "COMPLETED";
    }).length;
  }, [visibleQueueItems]);

  const [isQueueLoading, setIsQueueLoading] = useState(false);
  const [isCallingNext, setIsCallingNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const [exceptionForm, exceptionFormDispatch] = useReducer(
    exceptionFormReducer,
    initialExceptionFormState,
  );

  const [selectedApptDetail, setSelectedApptDetail] =
    useState<DoctorAppointment | null>(null);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const docRef = useRef(docState);
  // Render-phase docState init from doctor prop + localStorage overrides
  const resolvedDocState = (() => {
    if (doctor && doctor.id) {
      const overrides = JSON.parse(
        localStorage.getItem("doctor_status_overrides:v1") || "{}",
      );
      if (overrides[doctor.id]) {
        return {
          ...doctor,
          status: overrides[doctor.id].status,
          availability: overrides[doctor.id].availability,
        };
      }
      return doctor;
    }
    return docState;
  })();

  if (resolvedDocState !== docState && doctor && doctor.id) {
    setDocState(resolvedDocState);
  }

  useEffect(() => {
    docRef.current = docState;
  }, [docState]);

  const refreshProfile = useCallback(async () => {
    const rawOverrides = localStorage.getItem("doctor_status_overrides:v1");
    const overrides = rawOverrides ? JSON.parse(rawOverrides) : {};

    if (
      doctor &&
      doctor.name &&
      doctor.id &&
      (doctor.department ||
        doctor.specialty ||
        doctor.qualification ||
        doctor.experienceYrs)
    ) {
      if (overrides[doctor.id]) {
        return {
          ...doctor,
          status: overrides[doctor.id].status,
          availability: overrides[doctor.id].availability,
        };
      }
      return doctor;
    }
    const idToFetch =
      doctorId || resolveDoctorId(docRef.current) || docRef.current.id;
    if (
      !idToFetch ||
      idToFetch === "0" ||
      idToFetch === "DOC-0" ||
      idToFetch === "DOC-"
    ) {
      return doctor || null;
    }
    try {
      const fresh = await doctorsService.getById(String(idToFetch));
      if (fresh && fresh.name && fresh.name !== "Dr. Unknown Doctor") {
        if (overrides[fresh.id]) {
          const updated = {
            ...fresh,
            status: overrides[fresh.id].status,
            availability: overrides[fresh.id].availability,
          };
          setDocState(updated);
          return updated;
        }
        setDocState(fresh);
        return fresh;
      }
      return doctor || null;
    } catch (err) {
      console.log(err);
      return doctor || null;
    }
  }, [doctorId, doctor]);

  const loadSchedule = useCallback(async (dId?: number | string) => {
    const id = dId ?? resolveDoctorId(docRef.current);
    if (!id || id === "0" || id === "DOC-0") return;
    try {
      const days = await doctorProfileService.getWeeklySchedule(id);
      setWeeklySchedule(days);
    } catch (err) {
      console.log(err);
      setWeeklySchedule([]);
    }
  }, []);

  const loadAvailability = useCallback(
    async (date: string, dId?: number | string) => {
      const id = dId ?? resolveDoctorId(docRef.current);
      if (!id || id === "0" || id === "DOC-0") return;
      try {
        const data = await doctorProfileService.getDailyAvailability(id, date);
        setDailyAvailability(data?.slots || []);
      } catch (err) {
        console.log(err);
        setDailyAvailability([]);
      }
    },
    [],
  );

  const loadAppointments = useCallback(async (dId?: number | string) => {
    const id = dId ?? resolveDoctorId(docRef.current);
    if (!id || id === "0" || id === "DOC-0") return;
    try {
      const list = await doctorProfileService.listAppointments(id);
      setAppointments(list);
    } catch (err) {
      console.log(err);
      setAppointments([]);
    }
  }, []);

  const loadExceptions = useCallback(async (dId?: number | string) => {
    const id = dId ?? resolveDoctorId(docRef.current);
    if (!id || id === "0" || id === "DOC-0") return;
    try {
      const list = await doctorsService.getScheduleExceptions(id);
      setExceptions(list);
    } catch (err) {
      console.log(err);
      setExceptions([]);
    }
  }, []);

  const loadQueue = useCallback(async (dId?: number | string) => {
    const id = dId ?? resolveDoctorId(docRef.current);
    if (!id || id === "0" || id === "DOC-0") return;
    setIsQueueLoading(true);
    try {
      const data = await doctorsService.getQueue(id);
      queueSummaryRef.current = data?.summary || {};
      setQueueItems(
        (data?.content || []).filter(
          (item: { status?: string; queueStatus?: string }) => {
            const st = String(
              item.status || item.queueStatus || "",
            ).toUpperCase();
            return (
              st !== "WAITING_FOR_VITALS" &&
              st !== "CHECKED_IN" &&
              st !== "BOOKED" &&
              st !== "WAITING"
            );
          },
        ),
      );
    } catch (err) {
      console.log(err);
      queueSummaryRef.current = {};
      setQueueItems([]);
    } finally {
      setIsQueueLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const fresh = await refreshProfile();
      const base = fresh || (doctor && doctor.id ? doctor : docRef.current);
      const doctorIdToUse = resolveDoctorId(base);
      if (doctorIdToUse && doctorIdToUse !== "0" && doctorIdToUse !== "") {
        await Promise.all([
          loadSchedule(doctorIdToUse),
          loadAvailability(availDate, doctorIdToUse),
          loadAppointments(doctorIdToUse),
          loadExceptions(doctorIdToUse),
          loadQueue(doctorIdToUse),
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    refreshProfile,
    loadSchedule,
    loadAvailability,
    loadAppointments,
    loadExceptions,
    loadQueue,
    availDate,
    doctor,
  ]);

  const [prevDoctorIdProp, setPrevDoctorIdProp] = useState<string | undefined>(
    undefined,
  );
  const docPropKey = `${doctorId}_${doctor?.id}`;
  if (docPropKey !== prevDoctorIdProp) {
    setPrevDoctorIdProp(docPropKey);
    setIsLoading(true);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fresh = await refreshProfile();
        if (cancelled) return;
        const base = fresh || (doctor && doctor.id ? doctor : docRef.current);
        const doctorIdToUse = resolveDoctorId(base);
        if (doctorIdToUse && doctorIdToUse !== "0" && doctorIdToUse !== "") {
          await Promise.all([
            loadSchedule(doctorIdToUse),
            loadAvailability(availDate, doctorIdToUse),
            loadAppointments(doctorIdToUse),
            loadExceptions(doctorIdToUse),
            loadQueue(doctorIdToUse),
          ]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    doctorId,
    doctor?.id,
    refreshProfile,
    doctor,
    loadSchedule,
    loadAvailability,
    availDate,
    loadAppointments,
    loadExceptions,
    loadQueue,
  ]);

  useEffect(() => {
    if (availDate) {
      loadAvailability(availDate);
    }
  }, [availDate, loadAvailability]);

  const initials = docState.name
    .replace("Dr. ", "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const matchesDateFilter = useCallback(
    (dateStr: string) => {
      if (filterState.apptDateFilter === "Today") return dateStr === todayKey();
      if (filterState.apptDateFilter === "This Week")
        return isSameWeek(dateStr);
      if (filterState.apptDateFilter === "This Month")
        return isSameMonth(dateStr);
      return true;
    },
    [filterState.apptDateFilter],
  );

  const filteredAppointments = useMemo<DoctorAppointment[]>(() => {
    const q = filterState.apptSearch.toLowerCase();
    return appointments.filter((apt) => {
      const idStr = String(apt.id).toLowerCase();
      return (
        matchesDateFilter(apt.date) &&
        (q === "" ||
          idStr.includes(q) ||
          apt.patientName.toLowerCase().includes(q))
      );
    });
  }, [appointments, filterState.apptSearch, matchesDateFilter]);

  const patients = useMemo<DoctorPatient[]>(() => {
    const map = new Map<string, DoctorPatient>();
    appointments.forEach((apt) => {
      const key = apt.patientId || apt.patientName;
      if (!key) return;
      const existing = map.get(key);
      if (existing) {
        if (apt.date > existing.lastVisit) existing.lastVisit = apt.date;
        if (apt.status === "Completed") existing.status = "Active";
        return;
      }
      map.set(key, {
        id: key,
        name: apt.patientName,
        gender: apt.gender,
        age: apt.age,
        lastVisit: apt.date,
        status: apt.status === "Completed" ? "Active" : "Pending",
        complaint: apt.complaint,
      });
    });
    return Array.from(map.values());
  }, [appointments]);

  const filteredPatients = useMemo<DoctorPatient[]>(() => {
    const q = filterState.patientSearch.toLowerCase();
    return patients.filter(
      (pt) =>
        q === "" ||
        pt.id.toLowerCase().includes(q) ||
        pt.name.toLowerCase().includes(q) ||
        pt.complaint.toLowerCase().includes(q),
    );
  }, [patients, filterState.patientSearch]);

  const todayAppointments = useMemo(
    () => appointments.filter((a) => a.date === todayKey()),
    [appointments],
  );
  const completedToday = todayAppointments.filter(
    (a) => a.status === "Completed",
  ).length;
  const scheduledToday = todayAppointments.filter(
    (a) => a.status === "Scheduled" || a.status === "Checked-In",
  ).length;

  const scheduleRows = useMemo(
    () =>
      weeklySchedule.map((day) => {
        const period = day.workingPeriods?.[0];
        return {
          day,
          period,
          slotDuration: period?.slotDurationMinutes
            ? `${period.slotDurationMinutes} min`
            : docState.slotDuration || "—",
        };
      }),
    [weeklySchedule, docState.slotDuration],
  );

  const handleSaveEditDoctor = async () => {
    try {
      setShowEditDrawer(false);
      triggerToast("Doctor information updated successfully.");
      const fresh = await doctorProfileService.getDoctorProfile(
        resolveUserId(docState),
      );
      setDocState(fresh);
      if (onEdit) onEdit(fresh);
      await Promise.all([
        loadSchedule(),
        loadAvailability(availDate),
        loadAppointments(),
      ]);
    } catch (err) {
      console.log(err);
      triggerToast("Saved locally; server refresh failed.");
    }
  };

  const handleConfirmDeactivate = async () => {
    setIsDeactivating(true);
    try {
      const userId = resolveUserId(docState);
      await usersApi.adminDeactivateUser(
        userId,
        "Deactivated from Doctor Profile",
      );

      const overrides = JSON.parse(
        localStorage.getItem("doctor_status_overrides:v1") || "{}",
      );
      overrides[docState.id] = {
        status: "Inactive",
        availability: "Out of Office",
      };
      localStorage.setItem(
        "doctor_status_overrides:v1",
        JSON.stringify(overrides),
      );

      setDocState((prev) => ({
        ...prev,
        status: "Inactive",
        availability: "Out of Office",
      }));
      setDeactivateDialogOpen(false);
      setShowEditDrawer(false);
      triggerToast(`Doctor ${docState.name} has been deactivated.`);
      if (onEdit)
        onEdit({
          ...docState,
          status: "Inactive",
          availability: "Out of Office",
        });
    } catch (err) {
      console.log(err);
      triggerToast("Failed to deactivate doctor. Please try again.");
      setDeactivateDialogOpen(false);
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleConfirmActivate = async () => {
    setIsActivating(true);
    try {
      const userId = resolveUserId(docState);
      await usersApi.adminActivateUser(userId);

      const overrides = JSON.parse(
        localStorage.getItem("doctor_status_overrides:v1") || "{}",
      );
      overrides[docState.id] = {
        status: "Active",
        availability: "Available Today",
      };
      localStorage.setItem(
        "doctor_status_overrides:v1",
        JSON.stringify(overrides),
      );

      setDocState((prev) => ({
        ...prev,
        status: "Active",
        availability: "Available Today",
      }));
      setActivateDialogOpen(false);
      triggerToast(`Doctor ${docState.name} has been activated.`);
      if (onEdit)
        onEdit({
          ...docState,
          status: "Active",
          availability: "Available Today",
        });
    } catch (err) {
      console.log(err);
      triggerToast("Failed to activate doctor. Please try again.");
      setActivateDialogOpen(false);
    } finally {
      setIsActivating(false);
    }
  };

  const handleStartEditException = (ex: ApiScheduleExceptionItem) => {
    exceptionFormDispatch({ type: "OPEN_EDIT", payload: ex });
  };

  const handleSaveException = async (e: FormEvent) => {
    e.preventDefault();
    if (!exceptionForm.startDate || !exceptionForm.endDate) return;
    exceptionFormDispatch({ type: "SET_SAVING", isSaving: true });
    try {
      const doctorId = resolveDoctorId(docRef.current);
      if (exceptionForm.editingException?.id) {
        await doctorsService.updateScheduleException(
          doctorId,
          exceptionForm.editingException.id,
          {
            exceptionType: exceptionForm.type,
            startDate: exceptionForm.startDate,
            endDate: exceptionForm.endDate,
            startTime: exceptionForm.fullDay ? null : exceptionForm.startTime,
            endTime: exceptionForm.fullDay ? null : exceptionForm.endTime,
            isFullDay: exceptionForm.fullDay,
            reason: exceptionForm.reason,
            action: exceptionForm.action,
          },
        );
        triggerToast("Schedule exception updated.");
      } else {
        await doctorsService.createScheduleException(doctorId, {
          exceptionType: exceptionForm.type,
          startDate: exceptionForm.startDate,
          endDate: exceptionForm.endDate,
          startTime: exceptionForm.fullDay ? null : exceptionForm.startTime,
          endTime: exceptionForm.fullDay ? null : exceptionForm.endTime,
          isFullDay: exceptionForm.fullDay,
          reason: exceptionForm.reason,
          action: exceptionForm.action,
        });
        triggerToast("Schedule exception created.");
      }
      exceptionFormDispatch({ type: "CLOSE" });
      await loadExceptions();
    } catch (err) {
      console.log(err);
      triggerToast("Failed to save schedule exception.");
    } finally {
      exceptionFormDispatch({ type: "SET_SAVING", isSaving: false });
    }
  };

  const handleCancelException = async (ex: ApiScheduleExceptionItem) => {
    if (!ex.id) return;
    try {
      await doctorsService.updateScheduleException(
        resolveDoctorId(docRef.current),
        ex.id,
        { status: "CANCELLED" },
      );
      triggerToast("Schedule exception cancelled.");
      await loadExceptions();
    } catch (err) {
      console.log(err);
      triggerToast("Failed to cancel schedule exception.");
    }
  };

  const handleDeleteException = async (ex: ApiScheduleExceptionItem) => {
    if (!ex.id) return;
    try {
      await doctorsService.deleteScheduleException(
        resolveDoctorId(docRef.current),
        ex.id,
      );
      triggerToast("Schedule exception deleted.");
      await loadExceptions();
    } catch (err) {
      console.log(err);
      triggerToast("Failed to delete schedule exception.");
    }
  };

  const handleCallNext = async () => {
    setIsCallingNext(true);
    try {
      const result = await doctorsService.callNext(
        resolveDoctorId(docRef.current),
      );
      triggerToast(
        result?.tokenNumber
          ? `Called token ${result.tokenNumber} (${result.patient?.fullName || "next patient"}).`
          : "Next patient called.",
      );
      await loadQueue();
    } catch (err) {
      console.log(err);
      triggerToast("Failed to call next patient.");
    } finally {
      setIsCallingNext(false);
    }
  };

  return (
    <div
      className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F1F5F9]"
      style={{ fontFamily: RB }}
    >
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#111827] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 transition-opacity duration-200">
          <CheckCircle2 size={16} className="text-[#66BB6A]" />
          <span>{toastMsg}</span>
        </div>
      )}

      <DoctorProfileHeader
        doctor={docState}
        role={
          String(currentRole).toUpperCase() as
            | "ADMIN"
            | "DOCTOR"
            | "RECEPTIONIST"
        }
        isOwnRecord={isOwnRecord}
        isLoading={isLoading}
        visibleTabs={visibleTabs.map((t) => ({ id: t.id, label: t.label }))}
        onBack={onBack}
        onRefresh={refreshAll}
        onOpenEdit={() => setShowEditDrawer(true)}
        onOpenActivate={() => setActivateDialogOpen(true)}
        onOpenDeactivate={() => setDeactivateDialogOpen(true)}
        onSelectTab={(tabId) =>
          dispatch({ type: "SET_TAB", tab: tabId as TabId })
        }
      />

      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => dispatch({ type: "SET_TAB", tab: tab.id })}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                filterState.activeTab === tab.id
                  ? "bg-[#0D47A1] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#111827] hover:bg-slate-50"
              }`}
              style={{ fontFamily: PP }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filterState.activeTab === "overview" && (
          <PersonalDetailsTab
            doctor={docState}
            todayAppointments={todayAppointments}
            patients={patients}
            completedToday={completedToday}
            scheduledToday={scheduledToday}
            role={
              String(currentRole).toUpperCase() as
                | "ADMIN"
                | "DOCTOR"
                | "RECEPTIONIST"
            }
            canEdit={can("DOCTOR_PROFILE_UPDATE") && isOwnRecord}
            onOpenEdit={() => setShowEditDrawer(true)}
          />
        )}

        {filterState.activeTab === "professional" && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm space-y-6">
            <div>
              <h3
                className="text-base font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Professional Credentials & Attributes
              </h3>
              <p className="text-xs text-[#64748B]">
                Detailed practice specifications and registration metrics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {can("DOCTOR_CONTACT_VIEW") && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[#64748B] block text-[11px]">
                    Employee ID
                  </span>
                  <span className="font-mono font-bold text-[#0D47A1] text-sm">
                    {docState.empId}
                  </span>
                </div>
              )}
              {can("DOCTOR_CONTACT_VIEW") && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[#64748B] block text-[11px]">
                    Medical Registration Number
                  </span>
                  <span className="font-mono font-bold text-teal-700 text-sm">
                    {docState.regNumber}
                  </span>
                </div>
              )}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[#64748B] block text-[11px]">
                  Qualification & Degrees
                </span>
                <span className="font-bold text-[#111827] text-sm">
                  {docState.qualification}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[#64748B] block text-[11px]">
                  Department
                </span>
                <span className="font-bold text-[#111827] text-sm">
                  {docState.department}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[#64748B] block text-[11px]">
                  Clinical Specialty
                </span>
                <span className="font-bold text-[#0D47A1] text-sm">
                  {docState.specialty}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[#64748B] block text-[11px]">
                  Years of Experience
                </span>
                <span className="font-bold text-[#111827] text-sm">
                  {docState.experienceYrs} Years
                </span>
              </div>
              {can("DOCTOR_FEE_VIEW") && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[#64748B] block text-[11px]">
                    Consultation Fee
                  </span>
                  <span
                    className="font-bold text-[#0D47A1] text-sm"
                    style={{ fontFamily: PP }}
                  >
                    ₹{docState.consultationFee}
                  </span>
                </div>
              )}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[#64748B] block text-[11px]">
                  Appointment Slot Duration
                </span>
                <span className="font-bold text-[#111827] text-sm">
                  {docState.slotDuration || "15 Minutes"}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 md:col-span-2">
                <span className="text-[#64748B] block text-[11px]">
                  Account Status
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border inline-block mt-1 ${
                    docState.status === "Active"
                      ? "bg-emerald-50 text-[#66BB6A] border-emerald-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {docState.status}
                </span>
              </div>
            </div>
          </div>
        )}

        {filterState.activeTab === "schedule" && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3
                  className="text-base font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Weekly OPD Practice Schedule
                </h3>
                <p className="text-xs text-[#64748B]">
                  Assigned OPD cabinet:{" "}
                  <span className="font-bold text-teal-700">
                    {docState.opdRoom}
                  </span>
                </p>
              </div>
            </div>

            <div className="border border-[#E5E7EB] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-[#E5E7EB]">
                  <tr
                    className="text-[#64748B] font-bold"
                    style={{ fontFamily: PP }}
                  >
                    <th className="px-4 py-3">Day</th>
                    <th className="px-4 py-3">Working</th>
                    <th className="px-4 py-3">Start Time</th>
                    <th className="px-4 py-3">End Time</th>
                    <th className="px-4 py-3">Slot Duration</th>
                    <th className="px-4 py-3">Breaks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[#111827]">
                  {scheduleRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Clock size={28} className="text-slate-300" />
                          <span
                            className="font-bold text-[#111827]"
                            style={{ fontFamily: PP }}
                          >
                            No schedule data available.
                          </span>
                          <span className="text-xs text-[#64748B]">
                            Weekly schedule could not be loaded for this doctor.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    scheduleRows.map(({ day, period, slotDuration }) => (
                      <tr
                        key={day.dayOfWeek}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-4 py-3 font-bold text-[#111827]">
                          {dayLabel(day.dayOfWeek)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              day.workingDay
                                ? "bg-emerald-50 text-[#66BB6A] border-emerald-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            {day.workingDay ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {period ? formatTime(period.startTime) : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {period ? formatTime(period.endTime) : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {slotDuration}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {period && period.breaks && period.breaks.length > 0
                            ? period.breaks
                                .map((b) =>
                                  `${formatTime(b.startTime)}-${formatTime(
                                    b.endTime,
                                  )} ${b.breakType || ""}`.trim(),
                                )
                                .join(", ")
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filterState.activeTab === "availability" && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm space-y-6">
            <div className="bg-slate-50 rounded-2xl border border-[#E5E7EB] p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h4
                  className="text-sm font-bold text-[#111827] flex items-center gap-2"
                  style={{ fontFamily: PP }}
                >
                  <Calendar size={15} className="text-[#0D47A1]" /> Daily Slot
                  Availability
                </h4>
                <input
                  aria-label="Input field"
                  type="date"
                  value={availDate}
                  onChange={(e) =>
                    e.target.value && setAvailDate(e.target.value)
                  }
                  className="px-3 py-1.5 text-xs bg-white border border-[#E5E7EB] rounded-xl outline-none focus:border-[#0D47A1]"
                />
              </div>

              {dailyAvailability.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <div className="flex flex-col items-center space-y-2">
                    <Clock size={26} className="text-slate-300" />
                    <span className="text-xs font-semibold text-[#111827]">
                      No availability data for {availDate}
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      Slots will appear here once generated.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                  {dailyAvailability.map((slot) => {
                    const key = String(slot.status || "").toUpperCase();
                    const style =
                      SLOT_STATUS_STYLE[key] ||
                      "bg-slate-100 text-slate-600 border-slate-200";
                    const label =
                      SLOT_STATUS_LABEL[key] || slot.status || "Unknown";
                    return (
                      <div
                        key={`${slot.startTime}-${slot.endTime}`}
                        className={`px-3 py-2 rounded-xl border text-center ${style}`}
                      >
                        <span className="block font-mono font-bold text-xs">
                          {formatTime(slot.startTime)}
                        </span>
                        <span className="block text-[10px] font-semibold mt-0.5">
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {filterState.activeTab === "monthly_calendar" && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
            <MonthlyCalendarTab doctor={docState} canEdit={false} />
          </div>
        )}

        {filterState.activeTab === "schedule" && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm space-y-6">
            <div className="bg-slate-50 rounded-2xl border border-[#E5E7EB] p-5">
              <h4
                className="text-sm font-bold text-[#111827] flex items-center gap-2 mb-4"
                style={{ fontFamily: PP }}
              >
                <Coffee size={15} className="text-[#F59E0B]" /> Weekly Schedule
                Breaks
              </h4>
              {scheduleRows.filter(
                (r) => r.period?.breaks && r.period.breaks.length > 0,
              ).length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <span className="text-xs font-semibold text-[#111827]">
                    No breaks configured
                  </span>
                  <span className="text-[11px] text-[#64748B] block mt-1">
                    Breaks will be listed here when scheduled.
                  </span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {scheduleRows.map(({ day, period }) =>
                    period?.breaks && period.breaks.length > 0 ? (
                      <div
                        key={day.dayOfWeek}
                        className="flex items-center justify-between bg-white border border-[#E5E7EB] rounded-xl px-3 py-2.5"
                      >
                        <span className="font-bold text-xs text-[#111827]">
                          {dayLabel(day.dayOfWeek)}
                        </span>
                        <span className="text-xs text-[#64748B]">
                          {period.breaks
                            .map((b) =>
                              `${formatTime(b.startTime)}-${formatTime(
                                b.endTime,
                              )} ${b.breakType || ""}`.trim(),
                            )
                            .join(" · ")}
                        </span>
                      </div>
                    ) : null,
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {filterState.activeTab === "appointments" && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  aria-label="Input field"
                  type="text"
                  value={filterState.apptSearch}
                  onChange={(e) =>
                    dispatch({ type: "SET_APPT_SEARCH", query: e.target.value })
                  }
                  placeholder="Search Appointment ID, Patient Name..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#0D47A1] focus:bg-white transition-colors"
                />
                {filterState.apptSearch && (
                  <button
                    aria-label="Close"
                    onClick={() =>
                      dispatch({ type: "SET_APPT_SEARCH", query: "" })
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-[#E5E7EB] px-3 py-1.5 rounded-xl">
                  <Filter size={13} className="text-slate-400" />
                  <span className="text-slate-500 font-medium">
                    Filter Date:
                  </span>
                  <select
                    aria-label="Select option"
                    value={filterState.apptDateFilter}
                    onChange={(e) =>
                      dispatch({
                        type: "SET_APPT_DATE_FILTER",
                        filter: e.target.value,
                      })
                    }
                    className="bg-transparent font-semibold text-[#111827] outline-none cursor-pointer"
                  >
                    <option value="All Dates">All Dates</option>
                    <option value="Today">Today</option>
                    <option value="This Week">This Week</option>
                    <option value="This Month">This Month</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border border-[#E5E7EB] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-[#E5E7EB]">
                  <tr
                    className="text-[#64748B] font-bold"
                    style={{ fontFamily: PP }}
                  >
                    <th className="px-4 py-3">Appointment ID</th>
                    <th className="px-4 py-3">Patient Name</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[#111827]">
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-3">
                          <div className="h-3 bg-slate-200 rounded w-16" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-3 bg-slate-200 rounded w-28" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-3 bg-slate-200 rounded w-20" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-3 bg-slate-200 rounded w-16" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-5 bg-slate-200 rounded-full w-20" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-5 bg-slate-200 rounded w-16 ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : filteredAppointments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Calendar size={28} className="text-slate-300" />
                          <span
                            className="font-bold text-[#111827]"
                            style={{ fontFamily: PP }}
                          >
                            No appointments found.
                          </span>
                          <span className="text-xs text-[#64748B]">
                            No appointments matching your current search or date
                            filter.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((apt) => (
                      <tr
                        key={apt.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono font-bold text-[#0D47A1]">
                          {apt.id}
                        </td>
                        <td
                          className="px-4 py-3 font-bold text-[#111827]"
                          style={{ fontFamily: PP }}
                        >
                          {apt.patientName}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{apt.date}</td>
                        <td className="px-4 py-3 text-slate-600">{apt.time}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              APPT_STATUS_STYLE[apt.status] ||
                              "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {apt.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedApptDetail(apt)}
                            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0D47A1] font-bold text-xs transition-colors"
                            style={{ fontFamily: PP }}
                          >
                            View Appointment
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filterState.activeTab === "patients" && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm space-y-4">
            <div className="relative max-w-md">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                aria-label="Input field"
                type="text"
                value={filterState.patientSearch}
                onChange={(e) =>
                  dispatch({
                    type: "SET_PATIENT_SEARCH",
                    query: e.target.value,
                  })
                }
                placeholder="Search Patient ID, Name, Complaint..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#0D47A1] focus:bg-white transition-colors"
              />
              {filterState.patientSearch && (
                <button
                  aria-label="Close"
                  onClick={() =>
                    dispatch({ type: "SET_PATIENT_SEARCH", query: "" })
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="border border-[#E5E7EB] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-50 border-b border-[#E5E7EB]">
                  <tr
                    className="text-[#64748B] font-bold"
                    style={{ fontFamily: PP }}
                  >
                    <th className="px-4 py-3">Patient ID</th>
                    <th className="px-4 py-3">Patient Name</th>
                    <th className="px-4 py-3">Gender</th>
                    <th className="px-4 py-3">Age</th>
                    <th className="px-4 py-3">Last Visit</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[#111827]">
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-3">
                          <div className="h-3 bg-slate-200 rounded w-16" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-3 bg-slate-200 rounded w-28" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-3 bg-slate-200 rounded w-12" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-3 bg-slate-200 rounded w-10" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-3 bg-slate-200 rounded w-20" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-5 bg-slate-200 rounded-full w-16" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-5 bg-slate-200 rounded w-20 ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : filteredPatients.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <User size={28} className="text-slate-300" />
                          <span
                            className="font-bold text-[#111827]"
                            style={{ fontFamily: PP }}
                          >
                            No assigned patients.
                          </span>
                          <span className="text-xs text-[#64748B]">
                            No patient records matching search criteria for this
                            doctor.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((pt) => (
                      <tr
                        key={pt.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono font-bold text-[#0D47A1]">
                          {pt.id}
                        </td>
                        <td
                          className="px-4 py-3 font-bold text-[#111827]"
                          style={{ fontFamily: PP }}
                        >
                          {pt.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {pt.gender}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {pt.age} Yrs
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {pt.lastVisit}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              pt.status === "Active"
                                ? "bg-emerald-50 text-[#66BB6A] border-emerald-200"
                                : pt.status === "Admitted"
                                  ? "bg-blue-50 text-[#0D47A1] border-blue-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {pt.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() =>
                              triggerToast(
                                `Viewing profile for ${pt.name} (${pt.id})...`,
                              )
                            }
                            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0D47A1] font-bold text-xs transition-colors"
                            style={{ fontFamily: PP }}
                          >
                            View Patient Profile
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filterState.activeTab === "exceptions" && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3
                  className="text-base font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Schedule Exceptions
                </h3>
                <p className="text-xs text-[#64748B]">
                  Leave, surgery blocks, meetings and personal off-schedule
                  periods for this doctor.
                </p>
              </div>
              <button
                onClick={() => {
                  exceptionFormDispatch({ type: "OPEN_NEW" });
                }}
                className="px-3.5 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#0c3d8a] transition-colors flex items-center gap-1.5 shadow-sm shrink-0"
                style={{ fontFamily: PP }}
              >
                <Plus size={14} /> New Exception
              </button>
            </div>

            {exceptionForm.isOpen && (
              <form
                onSubmit={handleSaveException}
                className="bg-slate-50 border border-[#E5E7EB] rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4
                    className="text-sm font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    {exceptionForm.editingException
                      ? `Edit Exception #${exceptionForm.editingException.id}`
                      : "Create New Exception"}
                  </h4>
                  <button
                    aria-label="Close"
                    type="button"
                    onClick={() => {
                      exceptionFormDispatch({ type: "CLOSE" });
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block font-bold text-[#111827] mb-1">
                      Exception Type
                      <select
                        aria-label="Select option"
                        value={exceptionForm.type}
                        onChange={(e) =>
                          exceptionFormDispatch({
                            type: "SET_FIELD",
                            field: "type",
                            value: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-[#111827] font-semibold outline-none focus:border-[#0D47A1]"
                      >
                        <option value="VACATION">Vacation</option>
                        <option value="TRAINING">Training</option>
                        <option value="CONFERENCE">Conference</option>
                        <option value="SURGERY">Surgery Block</option>
                        <option value="EMERGENCY">Emergency</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </span>
                  </div>
                  <div>
                    <span className="block font-bold text-[#111827] mb-1">
                      Slot Action
                    </span>
                    <div className="w-full px-3 py-2 bg-slate-50 border border-[#E5E7EB] rounded-xl text-[#111827] font-semibold">
                      Block Appointments
                    </div>
                  </div>
                  <div>
                    <span className="block font-bold text-[#111827] mb-1">
                      Start Date
                      <input
                        aria-label="Input field"
                        type="date"
                        value={exceptionForm.startDate}
                        onChange={(e) =>
                          e.target.value &&
                          exceptionFormDispatch({
                            type: "SET_FIELD",
                            field: "startDate",
                            value: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#0D47A1]"
                      />
                    </span>
                  </div>
                  <div>
                    <span className="block font-bold text-[#111827] mb-1">
                      End Date
                      <input
                        aria-label="Input field"
                        type="date"
                        value={exceptionForm.endDate}
                        onChange={(e) =>
                          e.target.value &&
                          exceptionFormDispatch({
                            type: "SET_FIELD",
                            field: "endDate",
                            value: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#0D47A1]"
                      />
                    </span>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={exceptionForm.fullDay}
                    onChange={(e) =>
                      exceptionFormDispatch({
                        type: "SET_FIELD",
                        field: "fullDay",
                        value: e.target.checked,
                      })
                    }
                    className="rounded text-[#0D47A1] focus:ring-[#0D47A1] w-4 h-4"
                  />
                  <span className="font-semibold text-[#111827]">
                    Full day exception
                  </span>
                </label>

                {!exceptionForm.fullDay && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="block font-bold text-[#111827] mb-1">
                        Start Time
                      </span>
                      <TimeSelect
                        value={exceptionForm.startTime}
                        onChange={(val) =>
                          exceptionFormDispatch({
                            type: "SET_FIELD",
                            field: "startTime",
                            value: val,
                          })
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <span className="block font-bold text-[#111827] mb-1">
                        End Time
                      </span>
                      <TimeSelect
                        value={exceptionForm.endTime}
                        onChange={(val) =>
                          exceptionFormDispatch({
                            type: "SET_FIELD",
                            field: "endTime",
                            value: val,
                          })
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <span className="block font-bold text-[#111827] mb-1 text-xs">
                    Reason
                  </span>
                  <textarea
                    aria-label="Text area"
                    rows={2}
                    value={exceptionForm.reason}
                    onChange={(e) =>
                      exceptionFormDispatch({
                        type: "SET_FIELD",
                        field: "reason",
                        value: e.target.value,
                      })
                    }
                    placeholder="e.g. Personal leave, surgery block..."
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E5E7EB] rounded-xl text-[#111827] outline-none focus:border-[#0D47A1] resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      exceptionFormDispatch({ type: "CLOSE" });
                    }}
                    className="px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-slate-600 hover:bg-slate-100 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={exceptionForm.isSaving}
                    className="px-4 py-2 rounded-xl bg-[#009688] text-white text-xs font-bold hover:bg-[#00796b] transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: PP }}
                  >
                    <CheckCircle2 size={14} />
                    {exceptionForm.isSaving
                      ? "Saving..."
                      : exceptionForm.editingException
                        ? "Update Exception"
                        : "Create Exception"}
                  </button>
                </div>
              </form>
            )}

            {exceptions.length === 0 ? (
              <div className="border border-[#E5E7EB] rounded-2xl py-12 text-center text-slate-500">
                <div className="flex flex-col items-center space-y-2">
                  <CalendarRange size={28} className="text-slate-300" />
                  <span
                    className="font-bold text-[#111827]"
                    style={{ fontFamily: PP }}
                  >
                    No schedule exceptions.
                  </span>
                  <span className="text-xs text-[#64748B]">
                    Create a leave or surgery block to override the weekly
                    schedule.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {exceptions.map((ex) => (
                  <div
                    key={ex.id ?? `${ex.exceptionDate}-${ex.reason}`}
                    className="flex items-center justify-between bg-slate-50 border border-[#E5E7EB] rounded-xl px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            ex.status === "CANCELLED"
                              ? "bg-red-50 text-[#EF4444] border-red-200"
                              : "bg-amber-50 text-[#F59E0B] border-amber-200"
                          }`}
                        >
                          {(
                            {
                              VACATION: "Vacation",
                              TRAINING: "Training",
                              CONFERENCE: "Conference",
                              SURGERY: "Surgery",
                              EMERGENCY: "Emergency",
                              OTHER: "Other",
                            } as Record<string, string>
                          )[String(ex.exceptionType || ex.type || "")] ||
                            ex.exceptionType ||
                            ex.type ||
                            "EXCEPTION"}
                        </span>
                        <span className="font-bold text-xs text-[#111827]">
                          {ex.startDate || ex.exceptionDate}
                          {ex.endDate && ex.endDate !== ex.startDate
                            ? ` → ${ex.endDate}`
                            : ""}
                        </span>
                        {!ex.isFullDay && ex.isFullDay !== undefined && (
                          <span className="text-[11px] text-[#64748B]">
                            {formatTime(ex.startTime || "")} -{" "}
                            {formatTime(ex.endTime || "")}
                          </span>
                        )}
                        <span className="text-[11px] text-[#64748B] capitalize">
                          {String(ex.action || "")
                            .toLowerCase()
                            .replace("_", " ")}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            (ex.status || "ACTIVE").toUpperCase() ===
                            "CANCELLED"
                              ? "text-[#EF4444]"
                              : "text-[#009688]"
                          }`}
                        >
                          {(ex.status || "ACTIVE").toUpperCase()}
                        </span>
                      </div>
                      {ex.reason && (
                        <p className="text-[11px] text-[#64748B] mt-1 truncate">
                          {ex.reason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      {(ex.status || "ACTIVE").toUpperCase() !==
                        "CANCELLED" && (
                        <>
                          <button
                            onClick={() => handleStartEditException(ex)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0D47A1] hover:bg-blue-50 transition-colors"
                            title="Edit Exception"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleCancelException(ex)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Cancel Exception"
                          >
                            <X size={14} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteException(ex)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Exception"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {filterState.activeTab === "queue" && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3
                  className="text-base font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Live Consultation Queue
                </h3>
                <p className="text-xs text-[#64748B]">
                  Real-time OPD queue for {docState.name}.
                </p>
              </div>
              {(() => {
                const firstWaiting = queueItems.find((item) => {
                  const s = String(item.status || item.queueStatus || "")
                    .toUpperCase()
                    .replace(/[\s-]/g, "_");
                  return (
                    s === "WAITING_FOR_DOCTOR" ||
                    s === "WAITING_FOR_DOCTOR_CALL"
                  );
                });
                const isFirstWaitingVitals = !firstWaiting;

                return (
                  can("QUEUE_CALL_NEXT") && (
                    <button
                      onClick={handleCallNext}
                      disabled={
                        isCallingNext ||
                        visibleQueueItems.length === 0 ||
                        isFirstWaitingVitals
                      }
                      className="px-4 py-2.5 rounded-xl bg-[#009688] text-white text-xs font-bold hover:bg-[#00796b] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      style={{ fontFamily: PP }}
                      title={
                        isFirstWaitingVitals
                          ? "Next patient is waiting for vitals"
                          : undefined
                      }
                    >
                      <PhoneCall size={14} />
                      {isCallingNext ? "Calling..." : "Call Next Patient"}
                    </button>
                  )
                );
              })()}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-2xl border border-[#E5E7EB] p-4">
                <span className="text-xs text-[#64748B] font-medium block">
                  Waiting
                </span>
                <span
                  className="text-2xl font-bold text-[#F59E0B] block"
                  style={{ fontFamily: PP }}
                >
                  {localWaitingCount}
                </span>
              </div>
              <div className="bg-slate-50 rounded-2xl border border-[#E5E7EB] p-4">
                <span className="text-xs text-[#64748B] font-medium block">
                  In Consultation
                </span>
                <span
                  className="text-2xl font-bold text-[#0D47A1] block"
                  style={{ fontFamily: PP }}
                >
                  {localInConsultationCount}
                </span>
              </div>
              <div className="bg-slate-50 rounded-2xl border border-[#E5E7EB] p-4">
                <span className="text-xs text-[#64748B] font-medium block">
                  Completed
                </span>
                <span
                  className="text-2xl font-bold text-[#66BB6A] block"
                  style={{ fontFamily: PP }}
                >
                  {localCompletedCount}
                </span>
              </div>
            </div>

            <div className="border border-[#E5E7EB] rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-[#E5E7EB]">
                  <tr
                    className="text-[#64748B] font-bold"
                    style={{ fontFamily: PP }}
                  >
                    <th className="px-4 py-3">Token</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">MRN</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Check-in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[#111827]">
                  {isQueueLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-3">
                          <div className="h-3 bg-slate-200 rounded w-16" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-3 bg-slate-200 rounded w-28" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-3 bg-slate-200 rounded w-20" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-5 bg-slate-200 rounded-full w-20" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-3 bg-slate-200 rounded w-16" />
                        </td>
                      </tr>
                    ))
                  ) : visibleQueueItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <PhoneCall size={28} className="text-slate-300" />
                          <span
                            className="font-bold text-[#111827]"
                            style={{ fontFamily: PP }}
                          >
                            Queue is empty.
                          </span>
                          <span className="text-xs text-[#64748B]">
                            Patients currently checked in will appear here.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visibleQueueItems.map((item) => (
                      <tr
                        key={item.queueId ?? item.id ?? item.appointmentId}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono font-bold text-[#0D47A1]">
                          {item.token ||
                            item.tokenNumber ||
                            `Q${item.queueNumber}`}
                        </td>
                        <td className="px-4 py-3 font-bold text-[#111827]">
                          {item.patient?.name || item.patientName}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono">
                          {item.patient?.mrn || item.mrn || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              String(item.status || item.queueStatus || "")
                                .toUpperCase()
                                .includes("WAIT")
                                ? "bg-amber-50 text-[#F59E0B] border-amber-200"
                                : String(item.status || item.queueStatus || "")
                                      .toUpperCase()
                                      .includes("CONSULT")
                                  ? "bg-blue-50 text-[#0D47A1] border-blue-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {item.status || item.queueStatus || "WAITING"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.checkInTime || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filterState.activeTab === "timeline" && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm space-y-6">
            <div>
              <h3
                className="text-base font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Chronological Activity Log
              </h3>
              <p className="text-xs text-[#64748B]">
                Audit trajectory of consultation events, schedule changes, and
                registration records.
              </p>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              <div className="text-center py-8">
                <div className="flex flex-col items-center space-y-2">
                  <FileCheck size={28} className="text-slate-300" />
                  <span
                    className="font-bold text-[#111827] text-sm"
                    style={{ fontFamily: PP }}
                  >
                    No activity logs yet
                  </span>
                  <span className="text-xs text-[#64748B] max-w-sm">
                    Audit events such as profile updates, schedule changes, and
                    deactivations will appear here once the audit log API is
                    available.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div
              className="w-12 h-12 rounded-xl bg-[#0D47A1] text-white font-bold text-base flex items-center justify-center shrink-0"
              style={{ fontFamily: PP }}
            >
              {initials}
            </div>
            <div className="truncate">
              <span
                className="font-bold text-[#111827] text-sm truncate block"
                style={{ fontFamily: PP }}
              >
                {docState.name}
              </span>
              <span className="text-xs text-[#0D47A1] font-semibold truncate block">
                {docState.specialty}
              </span>
              <span className="text-[11px] text-[#64748B] truncate block">
                {docState.department}
              </span>
            </div>
          </div>

          <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
            <div className="flex justify-between">
              <span className="text-[#64748B]">OPD Cabinet:</span>
              <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {docState.opdRoom}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Shift Timings:</span>
              <span className="font-medium text-[#111827]">
                {docState.shiftTimings}
              </span>
            </div>
            {can("DOCTOR_FEE_VIEW") && (
              <div className="flex justify-between">
                <span className="text-[#64748B]">Consultation Fee:</span>
                <span
                  className="font-bold text-[#0D47A1]"
                  style={{ fontFamily: PP }}
                >
                  ${docState.consultationFee}
                </span>
              </div>
            )}
          </div>
        </div>

        {can("DOCTOR_APPOINTMENT_VIEW") && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
            <h3
              className="text-xs font-bold text-[#111827] uppercase tracking-wider flex items-center gap-1.5"
              style={{ fontFamily: PP }}
            >
              <Clock size={14} className="text-[#009688]" /> Today's Upcoming
              Queue
            </h3>

            <div className="space-y-2.5 text-xs">
              {todayAppointments.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <span className="text-xs font-semibold text-[#111827]">
                    No appointments today
                  </span>
                  <span className="text-[11px] text-[#64748B] block mt-1">
                    Today's queue will appear here.
                  </span>
                </div>
              ) : (
                todayAppointments
                  .slice()
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between bg-slate-50 border border-[#E5E7EB] rounded-xl px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-[#111827] block truncate">
                          {apt.patientName}
                        </span>
                        <span className="text-[11px] text-[#64748B] block">
                          {apt.time} &bull; {apt.type}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ml-2 ${
                          APPT_STATUS_STYLE[apt.status] ||
                          "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </div>

      {selectedApptDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#E5E7EB] p-6 space-y-4 transition-transform duration-200">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-[#0D47A1]" />
                <h3
                  className="text-base font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Appointment Details
                </h3>
              </div>
              <button
                aria-label="Close"
                onClick={() => setSelectedApptDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-[#64748B]">Appointment ID</span>
                <span className="font-mono font-bold text-[#0D47A1]">
                  {selectedApptDetail.id}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-[#64748B]">Patient Name</span>
                <span className="font-bold text-[#111827]">
                  {selectedApptDetail.patientName} ({selectedApptDetail.gender}/
                  {selectedApptDetail.age}Y)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-[#64748B]">Date & Time</span>
                <span className="font-medium text-[#111827]">
                  {selectedApptDetail.date} &bull; {selectedApptDetail.time}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-[#64748B]">Visit Type</span>
                <span className="font-medium text-[#111827]">
                  {selectedApptDetail.type}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-[#64748B]">Status</span>
                <span className="font-semibold text-[#66BB6A]">
                  {selectedApptDetail.status}
                </span>
              </div>
              <div className="py-1">
                <span className="text-[#64748B] block text-[11px]">
                  Chief Complaint
                </span>
                <p className="text-[#111827] mt-0.5">
                  {selectedApptDetail.complaint}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedApptDetail(null)}
                className="px-4 py-2 rounded-xl bg-[#0D47A1] text-white text-xs font-bold hover:bg-[#0c3d8a] transition-colors"
                style={{ fontFamily: PP }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {String(currentRole).toUpperCase() === "DOCTOR" ? (
        <EditDoctorProfileModal
          isOpen={showEditDrawer}
          doctor={docState}
          role="DOCTOR"
          onClose={() => setShowEditDrawer(false)}
          onSave={async (updated) => {
            const saved = await doctorProfileService.updateDoctor(updated);
            setDocState(saved || updated);
            triggerToast("Profile updated successfully.");
            if (onEdit) onEdit(saved || updated);
            await refreshAll();
          }}
        />
      ) : (
        <EditStaffUserDrawer
          user={showEditDrawer ? doctorToEditUser(docState) : null}
          onClose={() => setShowEditDrawer(false)}
          onSaved={handleSaveEditDoctor}
        />
      )}

      <DeactivateDoctorDialog
        isOpen={deactivateDialogOpen}
        doctor={docState}
        onClose={() => setDeactivateDialogOpen(false)}
        onConfirm={handleConfirmDeactivate}
        isDeactivating={isDeactivating}
      />

      <ActivateDoctorDialog
        isOpen={activateDialogOpen}
        doctor={docState}
        onClose={() => setActivateDialogOpen(false)}
        onConfirm={handleConfirmActivate}
        isActivating={isActivating}
      />
    </div>
  );
}
