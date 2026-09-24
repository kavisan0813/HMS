import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import type {
  PatientSummary,
  Department,
  CreateAppointmentRequest,
  AppointmentRecord,
} from "../types/appointment.types";
import { PP, RB } from "../constants/appointment.constants";
import type { BookAppointmentScreenProps } from "../types/appointment-screen.types";
import { appointmentService } from "../services/appointment.service";
import { patientsApi } from "../../patients/api/patient.api";
import { departmentsApi } from "../../users/api/departments.api";
import type { DoctorDailySlot } from "../../doctors/types/doctors.types";
import { AppointmentDetailsDrawer } from "../components/AppointmentDetailsDrawer";

const formatSlotTime = (timeStr: string) => {
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const minute = parts[1];
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  hour = hour ? hour : 12;
  const strHour = hour < 10 ? `0${hour}` : `${hour}`;
  return `${strHour}:${minute} ${ampm}`;
};

const isTimeSlotPassed = (slotTimeStr: string, targetDateStr: string) => {
  const todayStr = new Date().toISOString().split("T")[0];
  if (targetDateStr < todayStr) return true;
  if (targetDateStr > todayStr) return false;

  let hour: number;
  let minute: number;

  if (slotTimeStr.includes("AM") || slotTimeStr.includes("PM")) {
    const cleanTime = slotTimeStr.replace(/(AM|PM)/i, "").trim();
    const parts = cleanTime.split(":");
    hour = parseInt(parts[0] || "0", 10);
    minute = parseInt(parts[1] || "0", 10);
    if (slotTimeStr.toUpperCase().includes("PM") && hour < 12) {
      hour += 12;
    }
    if (slotTimeStr.toUpperCase().includes("AM") && hour === 12) {
      hour = 0;
    }
  } else {
    const parts = slotTimeStr.split(":");
    hour = parseInt(parts[0] || "0", 10);
    minute = parseInt(parts[1] || "0", 10);
  }

  const now = new Date();
  const slotDateTime = new Date();
  slotDateTime.setHours(hour, minute, 0, 0);

  return slotDateTime.getTime() <= now.getTime();
};

export function BookAppointmentScreen({
  role = "receptionist",
  onBack,
  onConfirmSuccess,
  onRegisterNewPatientClick,
  onViewPatientProfileClick,
  onPatientSelect,
  initialMrn,
  onBookSuccess,
}: BookAppointmentScreenProps) {
  const navigate = useNavigate();
  void onViewPatientProfileClick;
  void onRegisterNewPatientClick;
  // Section 01: Patient Search state
  const [patientQuery, setPatientQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(
    null,
  );
  const [patientDatabase, setPatientDatabase] = useState<PatientSummary[]>([]);

  // Patient search dropdown options
  const searchedPatients = useMemo(() => {
    if (!patientQuery.trim()) return patientDatabase;
    const q = patientQuery.toLowerCase();
    return patientDatabase.filter(
      (p) =>
        (p.name || "Unknown Patient").toLowerCase().includes(q) ||
        (p.mrn || "").toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        String(p.id).toLowerCase().includes(q),
    );
  }, [patientQuery, patientDatabase]);

  // Section 02: Department & Doctor Selection
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedDocKey, setSelectedDocKey] = useState("");

  const [doctorsList, setDoctorsList] = useState<
    {
      key: string;
      doctorId: number | string;
      name: string;
      dept: string;
      spec: string;
      fee: number;
      availability: string;
      exp: string;
    }[]
  >([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);

  const filteredDoctors = useMemo(() => {
    if (!selectedDept) return [];
    return doctorsList.filter((d) => {
      if (selectedSpecialty && d.spec !== selectedSpecialty) return false;
      return true;
    });
  }, [doctorsList, selectedDept, selectedSpecialty]);

  const currentDoctor = useMemo(() => {
    if (!selectedDept || !selectedDocKey) return null;
    return doctorsList.find((d) => d.key === selectedDocKey) || null;
  }, [doctorsList, selectedDept, selectedDocKey]);

  const specialties = useMemo(() => {
    if (!selectedDept) return [];
    return Array.from(
      new Set(doctorsList.flatMap((d) => (d.spec ? [d.spec] : []))),
    );
  }, [doctorsList, selectedDept]);

  useEffect(() => {
    const computeAge = (p: {
      age?: number;
      dateOfBirth?: string;
      dob?: string;
    }) => {
      if (typeof p.age === "number" && p.age > 0) return p.age;
      const dobStr = p.dateOfBirth || p.dob;
      if (dobStr) {
        const dob = new Date(dobStr);
        if (!isNaN(dob.getTime())) {
          const today = new Date();
          let age = today.getFullYear() - dob.getFullYear();
          const m = today.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--;
          }
          if (age > 0) return age;
        }
      }
      return 0;
    };

    if (role === "patient") {
      patientsApi
        .getMyPatients()
        .then((data) => {
          const mapped: PatientSummary[] = data.map((p, idx) => ({
            id: p.id ?? (p.mrn ? `mrn-${p.mrn}` : `patient-${idx}`),
            mrn: p.mrn,
            name: p.fullName || p.patientName || p.name || "Unknown Patient",
            age: computeAge(p),
            gender: p.gender || "",
            phone: p.phone || p.mobileNumber || p.registeredMobile || "",
            bloodGroup: p.bloodGroup || "",
            emergencyContact: p.emergencyContact
              ? `${p.emergencyContact.name || p.emergencyContact.contactName || ""} (${p.emergencyContact.relationship || ""})`
              : "",
            assignedDoctor: p.assignedDoctor || "",
          }));
          setPatientDatabase(mapped);
          if (initialMrn) {
            const found = mapped.find(
              (p) =>
                p.mrn?.toLowerCase() === initialMrn.toLowerCase() ||
                String(p.id).toLowerCase() === initialMrn.toLowerCase(),
            );
            if (found) {
              setSelectedPatient(found);
              return;
            }
          }
          if (mapped.length > 0) {
            setSelectedPatient(mapped[0]);
          }
        })
        .catch(() => {});
    } else {
      patientsApi
        .getAll()
        .then((data) => {
          const mapped: PatientSummary[] = data.map((p, idx) => ({
            id: p.id ?? (p.mrn ? `mrn-${p.mrn}` : `patient-${idx}`),
            mrn: p.mrn,
            name: p.fullName || p.patientName || p.name || "Unknown Patient",
            age: computeAge(p),
            gender: p.gender || "",
            phone: p.phone || p.mobileNumber || p.registeredMobile || "",
            bloodGroup: p.bloodGroup || "",
            emergencyContact: p.emergencyContact
              ? `${p.emergencyContact.name || p.emergencyContact.contactName || ""} (${p.emergencyContact.relationship || ""})`
              : "",
            assignedDoctor: p.assignedDoctor || "",
          }));
          setPatientDatabase(mapped);
          if (initialMrn) {
            const found = mapped.find(
              (p) =>
                p.mrn?.toLowerCase() === initialMrn.toLowerCase() ||
                String(p.id).toLowerCase() === initialMrn.toLowerCase(),
            );
            if (found) setSelectedPatient(found);
          }
        })
        .catch(() => {});
    }
  }, [initialMrn, role]);

  useEffect(() => {
    departmentsApi
      .getDepartmentLookup(true)
      .then((lookupList) => {
        if (lookupList && lookupList.length > 0) {
          const mapped = lookupList.map((d) => ({
            id: d.departmentId,
            departmentName: d.departmentName,
          }));
          setDepartments(mapped);
        } else {
          departmentsApi.getDepartments({ activeOnly: true }).then((list) => {
            const content: import("../../users/api/departments.api").ApiDepartmentSpecialtiesItem[] =
              Array.isArray(list)
                ? (list as unknown as import("../../users/api/departments.api").ApiDepartmentSpecialtiesItem[])
                : list?.content || [];
            const mapped = content.reduce<
              Array<{ id: string; departmentName: string }>
            >((acc, d) => {
              const departmentName = d.departmentName || d.name || "";
              if (departmentName) {
                acc.push({
                  id: String(d.departmentId ?? d.id ?? ""),
                  departmentName,
                });
              }
              return acc;
            }, []);
            if (mapped.length > 0) setDepartments(mapped as Department[]);
          });
        }
      })
      .catch(() => {});
  }, []);

  const [prevDept, setPrevDept] = useState("");
  if (selectedDept !== prevDept) {
    setPrevDept(selectedDept);
    if (!selectedDept) {
      setDoctorsList([]);
      setSelectedDocKey("");
      setSelectedSpecialty("");
      setIsLoadingDoctors(false);
    } else {
      setIsLoadingDoctors(true);
    }
  }

  useEffect(() => {
    if (!selectedDept) return;
    let cancelled = false;

    const matchedDept = departments.find(
      (d) => d.departmentName === selectedDept || String(d.id) === selectedDept,
    );
    const deptId = matchedDept ? matchedDept.id : undefined;

    appointmentService
      .listDoctors(deptId)
      .then((data) => {
        if (cancelled) return;
        const targetDeptName = selectedDept.trim().toLowerCase();
        const targetDeptId =
          deptId !== undefined && deptId !== null ? String(deptId) : "";

        // Strictly filter doctors belonging to the selected department
        const matchingDoctors = data.filter((d) => {
          // Hide inactive doctors (service already filters; this is a safety net)
          const status = (d.status || "").toString().toUpperCase();
          if (status && status !== "ACTIVE") return false;
          if (d.active === false) return false;
          if (!d.name || !d.name.trim()) return false;

          const docDeptId =
            d.departmentId !== undefined && d.departmentId !== null
              ? String(d.departmentId)
              : "";
          const docDeptName = (d.departmentName || d.department || "")
            .trim()
            .toLowerCase();

          if (targetDeptId && docDeptId) {
            return docDeptId === targetDeptId;
          }
          if (docDeptName && targetDeptName) {
            return (
              docDeptName === targetDeptName ||
              docDeptName.includes(targetDeptName) ||
              targetDeptName.includes(docDeptName)
            );
          }
          // If department info is not returned, keep doctors returned by listDoctors(deptId) if deptId was passed
          return Boolean(deptId);
        });

        const mapped = matchingDoctors.map((d) => {
          const uniqueKey = d.id ? String(d.id) : `${d.name}-${Math.random()}`;
          return {
            key: uniqueKey,
            doctorId: d.id,
            name: d.name,
            dept: d.departmentName || d.department || selectedDept,
            spec: d.specialty || "",
            fee:
              typeof d.consultationFee === "number"
                ? d.consultationFee
                : Number(d.consultationFee) || 0,
            availability: "Available Today",
            exp: d.qualification || "",
          };
        });
        setDoctorsList(mapped);
        if (mapped.length > 0) {
          setSelectedDocKey(mapped[0].key);
          setSelectedSpecialty(mapped[0].spec || "");
        } else {
          setSelectedDocKey("");
          setSelectedSpecialty("");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("Failed to load doctors for department from API:", err);
        setDoctorsList([]);
        setSelectedDocKey("");
        setSelectedSpecialty("");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDoctors(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDept, departments]);

  const handleDeptChange = (dept: string) => {
    setSelectedDept(dept);
    setSelectedSpecialty("");
    setSelectedDocKey("");
    setDoctorsList([]);
  };

  const availableDates = useMemo(() => {
    const dates: Array<{
      date: string;
      day: string;
      label: string;
      isAvailable: boolean;
    }> = [];
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const today = new Date();

    for (let i = 0; i < 6; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayOfWeek = date.getDay();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const dayNum = String(date.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${dayNum}`;

      let label = `${date.getDate()} ${months[date.getMonth()]}`;
      if (i === 0) label = "Today";
      else if (i === 1) label = "Tomorrow";

      dates.push({
        date: dateStr,
        day: daysOfWeek[dayOfWeek],
        label,
        isAvailable: true,
      });
    }
    return dates;
  }, []);

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const dayNum = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${dayNum}`;
  });

  const [apiSlots, setApiSlots] = useState<DoctorDailySlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const [prevDocIdAndDate, setPrevDocIdAndDate] = useState("");
  const docIdDateKey = `${currentDoctor?.doctorId || ""}_${selectedDate}`;
  if (docIdDateKey !== prevDocIdAndDate) {
    setPrevDocIdAndDate(docIdDateKey);
    if (!currentDoctor || !currentDoctor.doctorId || !selectedDate) {
      setApiSlots([]);
      setIsLoadingSlots(false);
    } else {
      setIsLoadingSlots(true);
    }
  }

  useEffect(() => {
    if (!currentDoctor || !currentDoctor.doctorId || !selectedDate) return;
    let cancelled = false;
    appointmentService
      .listAvailableSlots(currentDoctor.doctorId, selectedDate)
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data) && data.length > 0) {
          interface RawSlotItem {
            id?: number;
            slotId?: number;
            time?: string;
            startTime?: string;
            status?: string;
            available?: boolean;
          }
          const mappedSlots: DoctorDailySlot[] = (data as RawSlotItem[]).map(
            (s, idx) => {
              const startT = s.time || s.startTime || "09:00 AM";
              const statusUpper = (s.status || "").toUpperCase();
              const isAvail =
                s.available !== false &&
                (statusUpper === "" ||
                  ["AVAILABLE", "OPEN", "FREE", "TRUE"].includes(statusUpper));
              return {
                id: String(s.id || s.slotId || idx + 1),
                slotId: s.id || s.slotId || idx + 1,
                startTime: startT,
                endTime: startT,
                status: isAvail ? "AVAILABLE" : "BOOKED",
              };
            },
          );
          setApiSlots(mappedSlots);
        } else {
          setApiSlots([]);
        }
      })
      .catch(() => {
        if (!cancelled) setApiSlots([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentDoctor, selectedDate]);

  const dynamicTimeSlotGroups = useMemo(() => {
    if (!selectedDocKey || !currentDoctor) {
      return { morning: [], afternoon: [], evening: [] };
    }

    if (apiSlots.length === 0) {
      const defaultSlots = {
        morning: [
          { time: "09:00 AM", available: true },
          { time: "09:30 AM", available: true },
          { time: "10:00 AM", available: false },
          { time: "10:30 AM", available: true },
          { time: "11:00 AM", available: true },
        ],
        afternoon: [
          { time: "12:00 PM", available: true },
          { time: "12:30 PM", available: false },
          { time: "01:00 PM", available: true },
          { time: "02:00 PM", available: true },
        ],
        evening: [
          { time: "04:00 PM", available: true },
          { time: "04:30 PM", available: true },
          { time: "05:00 PM", available: false },
        ],
      };

      const filterGroup = (group: { time: string; available: boolean }[]) =>
        group.map((slot) => ({
          ...slot,
          available:
            slot.available && !isTimeSlotPassed(slot.time, selectedDate),
        }));

      return {
        morning: filterGroup(defaultSlots.morning),
        afternoon: filterGroup(defaultSlots.afternoon),
        evening: filterGroup(defaultSlots.evening),
      };
    }

    const morning: { time: string; available: boolean }[] = [];
    const afternoon: { time: string; available: boolean }[] = [];
    const evening: { time: string; available: boolean }[] = [];

    apiSlots.forEach((slot) => {
      const timeStr = slot.startTime;
      const parts = timeStr.split(":");
      const hour = parseInt(parts[0], 10);
      const formatted = formatSlotTime(timeStr);
      const statusUpper = (slot.status || "").toUpperCase();
      const available =
        (statusUpper === "AVAILABLE" ||
          statusUpper === "OPEN" ||
          statusUpper === "FREE") &&
        !isTimeSlotPassed(formatted, selectedDate);

      if (hour < 12) {
        morning.push({ time: formatted, available });
      } else if (hour >= 12 && hour < 16) {
        afternoon.push({ time: formatted, available });
      } else {
        evening.push({ time: formatted, available });
      }
    });

    return { morning, afternoon, evening };
  }, [apiSlots, selectedDate, selectedDocKey, currentDoctor]);

  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [prevTimeSlotGroups, setPrevTimeSlotGroups] = useState(
    dynamicTimeSlotGroups,
  );

  if (dynamicTimeSlotGroups !== prevTimeSlotGroups) {
    setPrevTimeSlotGroups(dynamicTimeSlotGroups);
    const groups = [
      dynamicTimeSlotGroups.morning,
      dynamicTimeSlotGroups.afternoon,
      dynamicTimeSlotGroups.evening,
    ];
    let selected = false;
    for (const group of groups) {
      const avail = group.find((s) => s.available);
      if (avail) {
        setSelectedTimeSlot(avail.time);
        selected = true;
        break;
      }
    }
    if (!selected && dynamicTimeSlotGroups.morning.length > 0) {
      setSelectedTimeSlot(dynamicTimeSlotGroups.morning[0].time);
    }
  }

  const [visitType, setVisitType] = useState<"New Consultation" | "Follow-up">(
    "New Consultation",
  );
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [remarks, setRemarks] = useState("");

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmedAptId, setConfirmedAptId] = useState("");
  const [notificationPrefs] = useState<{
    sms: boolean;
    email: boolean;
  }>({ sms: true, email: true });
  void notificationPrefs;

  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [selectedDetailsAppt, setSelectedDetailsAppt] =
    useState<AppointmentRecord | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);

  const handleConfirm = async () => {
    if (!selectedPatient || !currentDoctor) return;
    setIsBooking(true);
    setBookingError(null);

    const convertTo24Hour = (time12h: string): string => {
      const [time, modifier] = time12h.trim().split(" ");

      let [hours] = time.split(":").map(Number);
      const minutes = time.split(":")[1];

      if (modifier === "PM" && hours !== 12) {
        hours += 12;
      }

      if (modifier === "AM" && hours === 12) {
        hours = 0;
      }

      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    };

    try {
      const payload: CreateAppointmentRequest = {
        patientMrn: selectedPatient.mrn || "",
        mrn: selectedPatient.mrn || "",
        doctorId: currentDoctor.doctorId,
        appointmentDate: selectedDate,
        startTime: convertTo24Hour(selectedTimeSlot),
        appointmentType:
          visitType === "New Consultation" ? "CONSULTATION" : "FOLLOW_UP",
        reason: chiefComplaint,
        symptoms: remarks,
      };

      const createdRecord = await appointmentService.bookAppointment(payload);
      const aptNum = String(
        createdRecord.appointmentNumber ||
          createdRecord.appointmentId ||
          createdRecord.id ||
          "APT-CONFIRMED",
      );
      setConfirmedAptId(aptNum);
      setShowSuccessModal(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to book appointment.";
      setBookingError(msg);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div
      className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F1F5F9]"
      style={{ fontFamily: RB }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1">
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack ? onBack : () => navigate(-1)}
              className="p-1.5 -ml-1 text-slate-400 hover:text-[#0D47A1] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              title="Go Back"
            >
              <ChevronLeft size={22} />
            </button>
            <h1
              className="text-2xl font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Book Appointment
            </h1>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            {role === "patient"
              ? "Select a doctor, date & available time slot to book your appointment."
              : "Search a patient, select a doctor and confirm an appointment."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-12 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg bg-blue-50 text-[#0D47A1] flex items-center justify-center font-bold text-xs"
                  style={{ fontFamily: PP }}
                >
                  01
                </div>
                <h2
                  className="text-base font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  {role === "patient"
                    ? "Active Patient (Read Only)"
                    : "Patient Search & Selection"}
                </h2>
              </div>
              <span className="text-xs text-red-500 font-semibold">
                * Required
              </span>
            </div>

            {role !== "patient" && (
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  aria-label="Input field"
                  type="text"
                  value={patientQuery}
                  onChange={(e) => setPatientQuery(e.target.value)}
                  placeholder="Search patient by MRN, Patient Name, Mobile Number or Appointment ID..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#0D47A1] focus:bg-white transition-colors shadow-inner"
                />
              </div>
            )}

            {role !== "patient" &&
              !selectedPatient &&
              patientQuery.trim() !== "" && (
                <div className="max-h-48 overflow-y-auto border border-[#E5E7EB] rounded-xl divide-y divide-gray-100 bg-white shadow-lg">
                  {searchedPatients.length > 0 ? (
                    searchedPatients.map((p) => (
                      <div
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            (e.currentTarget as HTMLElement).click();
                          }
                        }}
                        role="button"
                        key={
                          p.id
                            ? `pat-id-${p.id}`
                            : p.mrn
                              ? `pat-mrn-${p.mrn}`
                              : `pat-name-${p.name}`
                        }
                        onClick={() => {
                          setSelectedPatient(p);
                          setPatientQuery("");
                          if (onPatientSelect && p.mrn) onPatientSelect(p.mrn);
                        }}
                        className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#0D47A1] text-white flex items-center justify-center font-bold text-[10px]">
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-[#111827]">{p.name}</p>
                            <p className="text-[11px] text-[#64748B]">
                              {p.gender}
                              {p.age && p.age > 0
                                ? ` · ${p.age} yrs`
                                : ""} · {p.phone}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-[#0D47A1]">
                          {p.mrn}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No matching patient records found.
                      <button
                        onClick={onRegisterNewPatientClick}
                        className="ml-2 text-[#0D47A1] font-bold underline"
                      >
                        Register New Patient
                      </button>
                    </div>
                  )}
                </div>
              )}

            {selectedPatient ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-blue-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#0D47A1] text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {(selectedPatient.name ?? "Patient")
                      .split(" ")
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#111827]">
                        {selectedPatient.name}
                      </h3>
                      {selectedPatient.mrn && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-[#0D47A1] text-[10px] font-mono font-bold">
                          {selectedPatient.mrn}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {selectedPatient.gender
                        ? `${selectedPatient.gender}`
                        : ""}
                      {selectedPatient.age && selectedPatient.age > 0
                        ? ` · ${selectedPatient.age} yrs`
                        : ""}
                      {selectedPatient.bloodGroup
                        ? ` · Blood Group: ${selectedPatient.bloodGroup}`
                        : ""}
                      {selectedPatient.phone
                        ? ` · Mobile: ${selectedPatient.phone}`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl border-2 border-dashed border-slate-200 text-center text-xs text-slate-400">
                Search for a patient to begin booking an appointment.
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg bg-teal-50 text-[#009688] flex items-center justify-center font-bold text-xs"
                  style={{ fontFamily: PP }}
                >
                  02
                </div>
                <h2
                  className="text-base font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Department & Doctor Selection
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block font-semibold text-[#111827] mb-1">
                  Select Department *
                  <select
                    aria-label="Select option"
                    value={selectedDept}
                    onChange={(e) => handleDeptChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#009688] font-medium"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((dept) => (
                      <option
                        key={dept.departmentName}
                        value={dept.departmentName}
                      >
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                </span>
              </div>

              <div>
                <span className="block font-semibold text-[#111827] mb-1">
                  Specialty
                  <select
                    aria-label="Select option"
                    value={selectedSpecialty}
                    disabled={!selectedDept}
                    onChange={(e) => {
                      const newSpec = e.target.value;
                      setSelectedSpecialty(newSpec);
                      setSelectedDocKey("");
                      const specDocs = doctorsList.filter(
                        (d) => !newSpec || d.spec === newSpec,
                      );
                      if (specDocs.length > 0)
                        setSelectedDocKey(specDocs[0].key);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs text-[#111827] focus:outline-none focus:border-[#009688] font-medium ${
                      !selectedDept
                        ? "bg-slate-100 border-[#E5E7EB] text-slate-400 cursor-not-allowed"
                        : "bg-slate-50 border-[#E5E7EB]"
                    }`}
                  >
                    {!selectedDept ? (
                      <option value="">Select Department First</option>
                    ) : (
                      <>
                        <option value="">All Specialties</option>
                        {specialties.map((spec) => (
                          <option key={spec} value={spec}>
                            {spec}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="block text-xs font-semibold text-[#111827]">
                Available Doctors *
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {!selectedDept ? (
                  <div className="col-span-full p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-1">
                    <span className="font-semibold text-slate-700">
                      No Department Selected
                    </span>
                    <span>
                      Please select a department above to view available
                      doctors.
                    </span>
                  </div>
                ) : isLoadingDoctors ? (
                  <div className="col-span-full p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center gap-2">
                    <RefreshCw
                      size={14}
                      className="animate-spin text-[#009688]"
                    />{" "}
                    Fetching doctors from database...
                  </div>
                ) : filteredDoctors.length === 0 ? (
                  <div className="col-span-full p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No doctors found in database for {selectedDept}.
                  </div>
                ) : (
                  filteredDoctors.map((doc) => {
                    const isSelected = selectedDocKey === doc.key;
                    return (
                      <div
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            (e.currentTarget as HTMLElement).click();
                          }
                        }}
                        role="button"
                        key={doc.key}
                        onClick={() => setSelectedDocKey(doc.key)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-colors flex items-start gap-3 ${
                          isSelected
                            ? "border-[#009688] bg-teal-50/50 shadow-sm ring-1 ring-[#009688]"
                            : "border-[#E5E7EB] bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {doc.name
                            .replace("Dr. ", "")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0 text-xs">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-[#111827] truncate">
                              {doc.name}
                            </h4>
                            <span className="font-bold text-[#0D47A1]">
                              ₹{doc.fee}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748B]">
                            {doc.dept} {doc.spec ? `· ${doc.spec}` : ""}
                          </p>
                          {doc.exp && (
                            <p className="text-[10px] text-slate-500 mt-1">
                              {doc.exp}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg bg-blue-50 text-[#0D47A1] flex items-center justify-center font-bold text-xs"
                  style={{ fontFamily: PP }}
                >
                  03
                </div>
                <h2
                  className="text-base font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Appointment Date & Time Slot
                </h2>
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-[#111827] mb-2">
                Select Date *
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {availableDates.map((item) => {
                  const isSelected = selectedDate === item.date;
                  return (
                    <button
                      key={item.date}
                      type="button"
                      disabled={!item.isAvailable}
                      onClick={() => setSelectedDate(item.date)}
                      className={`p-2.5 rounded-xl border text-center transition-colors ${
                        !item.isAvailable
                          ? "opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed"
                          : isSelected
                            ? "bg-[#0D47A1] border-[#0D47A1] text-white shadow-sm font-bold"
                            : "bg-white border-[#E5E7EB] text-[#111827] hover:border-blue-300"
                      }`}
                    >
                      <span className="block text-[10px] uppercase opacity-80">
                        {item.day}
                      </span>
                      <span className="block text-xs font-bold mt-0.5">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <span className="block text-xs font-semibold text-[#111827]">
                Select Time Slot *
              </span>

              {!selectedDocKey || !currentDoctor ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Please select a doctor above to view available time slots.
                </div>
              ) : isLoadingSlots ? (
                <div className="flex items-center gap-2 py-6 text-xs text-slate-400">
                  <RefreshCw size={14} className="animate-spin text-teal-600" />{" "}
                  Loading availability slots...
                </div>
              ) : dynamicTimeSlotGroups.morning.length === 0 &&
                dynamicTimeSlotGroups.afternoon.length === 0 &&
                dynamicTimeSlotGroups.evening.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No available time slots found for this doctor on{" "}
                  {selectedDate}.
                </div>
              ) : (
                <>
                  {dynamicTimeSlotGroups.morning.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                        Morning Session
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {dynamicTimeSlotGroups.morning.map((slot) => {
                          const isSelected = selectedTimeSlot === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => setSelectedTimeSlot(slot.time)}
                              className={`px-3 py-2 rounded-xl text-xs font-mono transition-colors border ${
                                !slot.available
                                  ? "bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed"
                                  : isSelected
                                    ? "bg-[#009688] text-white border-[#009688] font-bold shadow-sm"
                                    : "bg-slate-50 text-[#111827] border-[#E5E7EB] hover:bg-teal-50 hover:border-teal-300"
                              }`}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {dynamicTimeSlotGroups.afternoon.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                        Afternoon Session
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {dynamicTimeSlotGroups.afternoon.map((slot) => {
                          const isSelected = selectedTimeSlot === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => setSelectedTimeSlot(slot.time)}
                              className={`px-3 py-2 rounded-xl text-xs font-mono transition-colors border ${
                                !slot.available
                                  ? "bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed"
                                  : isSelected
                                    ? "bg-[#009688] text-white border-[#009688] font-bold shadow-sm"
                                    : "bg-slate-50 text-[#111827] border-[#E5E7EB] hover:bg-teal-50 hover:border-teal-300"
                              }`}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {dynamicTimeSlotGroups.evening.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
                        Evening Session
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {dynamicTimeSlotGroups.evening.map((slot) => {
                          const isSelected = selectedTimeSlot === slot.time;
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => setSelectedTimeSlot(slot.time)}
                              className={`px-3 py-2 rounded-xl text-xs font-mono transition-colors border ${
                                !slot.available
                                  ? "bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed"
                                  : isSelected
                                    ? "bg-[#009688] text-white border-[#009688] font-bold shadow-sm"
                                    : "bg-slate-50 text-[#111827] border-[#E5E7EB] hover:bg-teal-50 hover:border-teal-300"
                              }`}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg bg-teal-50 text-[#009688] flex items-center justify-center font-bold text-xs"
                  style={{ fontFamily: PP }}
                >
                  04
                </div>
                <h2
                  className="text-base font-bold text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  Visit Details
                </h2>
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-[#111827] mb-2">
                Visit Type *
              </span>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-xs text-[#111827] cursor-pointer">
                  <input
                    type="radio"
                    name="visitType"
                    checked={visitType === "New Consultation"}
                    onChange={() => setVisitType("New Consultation")}
                    className="accent-[#0D47A1]"
                  />
                  <span>New Consultation</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-[#111827] cursor-pointer">
                  <input
                    type="radio"
                    name="visitType"
                    checked={visitType === "Follow-up"}
                    onChange={() => setVisitType("Follow-up")}
                    className="accent-[#0D47A1]"
                  />
                  <span>Follow-up Visit</span>
                </label>
              </div>
            </div>

            <div className="text-xs">
              <span className="block font-semibold text-[#111827] mb-1">
                Chief Complaint / Symptoms *
              </span>
              <textarea
                aria-label="Text area"
                rows={2}
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Describe patient's primary symptoms or reason for visit..."
                className="w-full p-3 rounded-xl bg-slate-50 border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#0D47A1]"
              />
            </div>

            <div className="text-xs">
              <span className="block font-semibold text-[#111827] mb-1">
                Receptionist Remarks (Optional)
              </span>
              <textarea
                aria-label="Text area"
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add optional notes for OPD staff..."
                className="w-full p-3 rounded-xl bg-slate-50 border border-[#E5E7EB] text-xs text-[#111827] focus:outline-none focus:border-[#0D47A1]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-[#E5E7EB] p-4 rounded-2xl shadow-lg flex items-center justify-between z-10">
        {bookingError && (
          <div className="absolute bottom-full left-0 right-0 mb-2 mx-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#EF4444] font-semibold flex items-center gap-2 transition-opacity fade-in">
            <AlertCircle size={14} /> {bookingError}
          </div>
        )}
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-[#E5E7EB] text-xs font-semibold text-[#64748B] hover:bg-slate-100 transition-colors"
          style={{ fontFamily: PP }}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedPatient || !currentDoctor || isBooking}
          className="px-6 py-2.5 rounded-xl bg-[#0D47A1] text-white text-xs font-semibold hover:bg-[#0c3d8a] transition-colors shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: PP }}
        >
          {isBooking ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          {isBooking ? "Booking..." : "Confirm Appointment"}
        </button>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-2xl space-y-5 text-center transition-transform duration-200 border border-slate-100"
            style={{ fontFamily: RB }}
          >
            {/* Top Checkmark Circle */}
            <div className="w-16 h-16 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={34} />
            </div>

            <div className="space-y-1">
              <h2
                className="text-xl font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                Appointment Booked Successfully!
              </h2>
              <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                Your OPD appointment has been registered with the Healthcare
                Operations Center.
              </p>
            </div>

            {/* Appointment ID Pill */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-50/80 border border-blue-100 text-[#0D47A1] text-xs font-mono font-bold">
                <span>Appointment ID:</span>
                <span className="font-extrabold">{confirmedAptId}</span>
              </span>
            </div>

            {/* Inner Details Card matching Screenshot */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 text-left space-y-3.5">
              {/* Doctor Header Row */}
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0D47A1] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {(currentDoctor?.name || "DR").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div
                      className="text-xs font-bold text-[#111827]"
                      style={{ fontFamily: PP }}
                    >
                      {currentDoctor?.name || "Dr. Arjun Mehta"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {currentDoctor?.dept || "Cardiology"}
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0D47A1] border border-blue-100">
                  Scheduled
                </span>
              </div>

              {/* Patient Info Row */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0D47A1] flex items-center justify-center font-bold text-xs">
                    {(selectedPatient?.name || "Patient")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Patient Name
                    </span>
                    <span className="text-xs font-bold text-[#111827]">
                      {selectedPatient?.name || "Unknown Patient"}
                    </span>
                  </div>
                </div>
                {selectedPatient?.mrn && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#0D47A1] border border-blue-100 text-[10px] font-mono font-bold">
                    MRN: {selectedPatient.mrn}
                  </span>
                )}
              </div>

              {/* 2-Column Field Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Appointment Date
                  </span>
                  <span className="font-bold text-[#111827]">
                    {selectedDate}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Time Slot
                  </span>
                  <span className="font-bold text-[#0D47A1]">
                    {selectedTimeSlot}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Visit Type
                  </span>
                  <span className="font-semibold text-slate-700">
                    {visitType}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Hospital OPD Location
                  </span>
                  <span className="font-medium text-slate-700">
                    Wing A, OPD Room 102
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Consultation Fee
                  </span>
                  <span className="font-bold text-[#009688]">
                    {currentDoctor?.fee
                      ? `₹${currentDoctor.fee} (OPD Counter)`
                      : "₹65 (OPD Counter)"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Chief Complaint
                  </span>
                  <span className="font-medium text-slate-700 truncate block">
                    {chiefComplaint || "General Consultation"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons matching Screenshot */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const apptData = {
                    id: confirmedAptId,
                    appointmentNumber: confirmedAptId,
                    patientName: selectedPatient?.name || "Patient",
                    mrn: selectedPatient?.mrn || "",
                    patientId: selectedPatient?.id,
                    doctorName: currentDoctor?.name || "Doctor",
                    departmentName: currentDoctor?.dept || "OPD",
                    department: currentDoctor?.dept || "OPD",
                    appointmentDate: selectedDate,
                    startTime: selectedTimeSlot,
                    timeSlot: selectedTimeSlot,
                    visitType:
                      visitType === "New Consultation"
                        ? "CONSULTATION"
                        : "FOLLOW_UP",
                    reason: chiefComplaint || "General Consultation",
                    chiefComplaint: chiefComplaint || "General Consultation",
                    symptoms: remarks,
                    status: "Scheduled",
                    tokenNo: confirmedAptId,
                    opdRoom: "Wing A, OPD Room 102",
                    doctor: {
                      id: currentDoctor?.doctorId || "",
                      name: currentDoctor?.name || "",
                      department: currentDoctor?.dept || "",
                      specialty: currentDoctor?.spec || "",
                      consultationFee: currentDoctor?.fee || 0,
                      opdRoom: "Wing A, OPD Room 102",
                    },
                  } as unknown as AppointmentRecord;

                  setShowSuccessModal(false);
                  if (onBookSuccess) {
                    onBookSuccess(apptData, true);
                  }
                  setSelectedDetailsAppt(apptData);
                  setShowDetailsDrawer(true);
                }}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-[#0D47A1] hover:bg-[#0c3d8a] text-white text-xs font-bold transition-colors shadow-sm flex items-center justify-center cursor-pointer"
                style={{ fontFamily: PP }}
              >
                View Appointment Details
              </button>
              <button
                type="button"
                onClick={() => {
                  const apptData = {
                    id: confirmedAptId,
                    appointmentNumber: confirmedAptId,
                    patientName: selectedPatient?.name,
                    mrn: selectedPatient?.mrn,
                    doctorName: currentDoctor?.name,
                    departmentName: currentDoctor?.dept,
                    appointmentDate: selectedDate,
                    startTime: selectedTimeSlot,
                    visitType: visitType,
                    reason: chiefComplaint,
                    symptoms: remarks,
                  } as unknown as AppointmentRecord;
                  setShowSuccessModal(false);
                  if (onBookSuccess) {
                    onBookSuccess(apptData, false);
                  } else if (onConfirmSuccess) {
                    onConfirmSuccess(confirmedAptId);
                  } else if (onBack) {
                    onBack();
                  } else {
                    if (role === "patient") {
                      navigate("/patients/appointments");
                    } else {
                      navigate("/appointments");
                    }
                  }
                }}
                className="w-full sm:flex-1 py-3 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                style={{ fontFamily: PP }}
              >
                Return to My Appointments
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailsDrawer && selectedDetailsAppt && (
        <AppointmentDetailsDrawer
          apt={selectedDetailsAppt}
          isOpen={showDetailsDrawer}
          onClose={() => {
            setShowDetailsDrawer(false);
            if (onConfirmSuccess) onConfirmSuccess(confirmedAptId);
            else if (onBack) onBack();
            else {
              if (role === "patient") {
                navigate("/patients/appointments");
              } else {
                navigate("/appointments");
              }
            }
          }}
          onEditClick={() => {}}
          onPrintClick={() => window.print()}
          onPatientSelect={
            onPatientSelect
              ? (id: number | string) => onPatientSelect(String(id))
              : undefined
          }
          userRole={role === "patient" ? "Patient" : "Receptionist"}
        />
      )}
    </div>
  );
}
