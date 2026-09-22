import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  Printer,
  AlertTriangle,
  Pill,
  Droplets,
  Phone,
  Mail,
  MapPin,
  Calendar,
} from "lucide-react";
import type {
  Patient,
  ApiPatientAppointment,
  ApiPatientPrescription,
  ApiPatientInvoice,
} from "../types/patient.types";
import { PP, RB } from "../../doctors/constants/doctors.constants";
import { can, type Role } from "../utils/patientPermissions";
import { patientsApi } from "../api/patient.api";
import { ROUTES } from "../../../app/routes/routes";

import { formatCompactCurrency } from "../../billing/utils/billing.utils";
import { normalizeImageUrl } from "../../../lib/image-utils";

function extractPatientPhotoUrl(p?: Patient | null): string | undefined {
  if (!p) return undefined;
  const obj = p as unknown as Record<string, unknown>;
  const candidates = [
    p.photoUrl,
    obj.photo_url,
    obj.photoUrl,
    obj.photo,
    obj.avatar,
    obj.avatarUrl,
    obj.avatar_url,
    obj.profileImage,
    obj.profile_image,
    obj.profileImageUrl,
    obj.profile_image_url,
    obj.image,
    obj.imageUrl,
    obj.image_url,
    obj.picture,
    obj.pictureUrl,
    obj.profilePicture,
  ];

  for (const c of candidates) {
    if (
      typeof c === "string" &&
      c.trim() &&
      c.trim() !== "—" &&
      c.trim() !== "null" &&
      c.trim() !== "undefined"
    ) {
      const normalized = normalizeImageUrl(c);
      if (normalized) return normalized;
    }
  }
  return undefined;
}

// Tabs
import { PatientAppointmentsTab } from "../components/tabs/AppointmentsTab";
import { VisitHistoryTab } from "../components/tabs/VisitHistoryTab";
import { PatientPrescriptionsTab } from "../components/tabs/PrescriptionsTab";
import { PatientBillingTab } from "../components/tabs/BillingTab";
import { PatientDocumentsTab } from "../components/tabs/DocumentsTab";

// Edit Patient Screen
import { EditPatientScreen } from "./EditPatientScreen";

export type PatientTabId =
  | "overview"
  | "appointments"
  | "visitHistory"
  | "prescriptions"
  | "billing"
  | "documents";

interface PatientProfilePageProps {
  patient: Patient;
  currentRole?: Role;
  onBack?: () => void;
  onBookAppointment?: (mrn?: string) => void;
  onEdit?: (patient?: Patient) => void;
  onNextPatient?: () => void;
  onPrevPatient?: () => void;
}

const TAB_CONFIG: Array<{ id: PatientTabId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "appointments", label: "Appointments" },
  { id: "prescriptions", label: "Prescriptions" },
  { id: "billing", label: "Billing & Payments" } /* 
  { id: "documents", label: "Documents" }, */,
];

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (err) {
    console.log(err);
    return dateStr;
  }
}

function formatBloodGroup(bg?: string): string {
  if (!bg) return "—";
  const cleaned = bg.trim().toUpperCase().replace(/_/g, " ");
  if (cleaned.includes("O POSITIVE") || cleaned === "O POSITIVE") return "O+";
  if (cleaned.includes("O NEGATIVE") || cleaned === "O NEGATIVE") return "O-";
  if (cleaned.includes("A POSITIVE") || cleaned === "A POSITIVE") return "A+";
  if (cleaned.includes("A NEGATIVE") || cleaned === "A NEGATIVE") return "A-";
  if (cleaned.includes("B POSITIVE") || cleaned === "B POSITIVE") return "B+";
  if (cleaned.includes("B NEGATIVE") || cleaned === "B NEGATIVE") return "B-";
  if (cleaned.includes("AB POSITIVE") || cleaned === "AB POSITIVE")
    return "AB+";
  if (cleaned.includes("AB NEGATIVE") || cleaned === "AB NEGATIVE")
    return "AB-";
  return cleaned;
}

function extractDeptName(dept: unknown): string {
  if (!dept) return "General OPD";
  if (typeof dept === "string") return dept.trim() || "General OPD";
  if (typeof dept === "object" && dept !== null) {
    const d = dept as Record<string, unknown>;
    const name = String(
      d.departmentName || d.name || d.nameEn || d.title || "",
    ).trim();
    if (name) return name;
  }
  return "General OPD";
}

function extractDoctorNameFromAppt(appt: ApiPatientAppointment): string {
  if (
    appt.doctorName &&
    typeof appt.doctorName === "string" &&
    appt.doctorName.trim()
  ) {
    return appt.doctorName.trim();
  }
  if (appt.doctor) {
    if (typeof appt.doctor === "string" && appt.doctor.trim()) {
      return appt.doctor.trim();
    }
    if (typeof appt.doctor === "object" && appt.doctor !== null) {
      const d = appt.doctor as Record<string, unknown>;
      const name = String(
        d.fullName || d.name || d.doctorName || d.nameEn || "",
      ).trim();
      if (name) return name;
    }
  }
  return "Doctor";
}

function extractRxDoctorName(rx: ApiPatientPrescription): string {
  if (
    rx.doctorName &&
    typeof rx.doctorName === "string" &&
    rx.doctorName.trim()
  ) {
    return rx.doctorName.trim();
  }
  const obj = rx as unknown as Record<string, unknown>;
  if (obj.doctor) {
    if (typeof obj.doctor === "string" && obj.doctor.trim()) {
      return obj.doctor.trim();
    }
    if (typeof obj.doctor === "object" && obj.doctor !== null) {
      const d = obj.doctor as Record<string, unknown>;
      const name = String(
        d.fullName || d.name || d.doctorName || d.nameEn || "",
      ).trim();
      if (name) return name;
    }
  }
  return "Doctor";
}

function extractRxMedCount(rx: ApiPatientPrescription): number {
  const obj = rx as unknown as Record<string, unknown>;
  if (typeof obj.medicineCount === "number" && obj.medicineCount > 0) {
    return obj.medicineCount;
  }
  if (Array.isArray(rx.medicines) && rx.medicines.length > 0) {
    return rx.medicines.length;
  }
  if (Array.isArray(obj.items) && obj.items.length > 0) {
    return (obj.items as unknown[]).length;
  }
  if (
    Array.isArray(obj.prescriptionItems) &&
    obj.prescriptionItems.length > 0
  ) {
    return (obj.prescriptionItems as unknown[]).length;
  }
  return 1;
}

export function PatientProfilePage({
  patient,
  currentRole = "ADMIN",
  onBack,
  onBookAppointment,
  onEdit,
  onNextPatient,
  onPrevPatient,
}: PatientProfilePageProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<PatientTabId>("overview");
  const [patientData, setPatientData] = useState<Patient>(patient);
  const [prevPatient, setPrevPatient] = useState<Patient>(patient);
  const [isEditing, setIsEditing] = useState(false);

  const [appointments, setAppointments] = useState<ApiPatientAppointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<ApiPatientPrescription[]>(
    [],
  );
  const [billing, setBilling] = useState<ApiPatientInvoice[]>([]);
  const [rxSummary, setRxSummary] = useState<{
    active: number;
    completed: number;
    expired: number;
    total: number;
  } | null>(null);

  if (patient !== prevPatient) {
    setPrevPatient(patient);
    setPatientData(patient);
  }

  const mrn = patientData?.mrn || patient?.mrn || String(patient?.id || "");

  // Fetch data specifically for THIS particular patient MRN
  useEffect(() => {
    if (!mrn) return;
    let cancelled = false;

    async function loadData() {
      try {
        const [pRes, apptRes, rxRes, billRes, rxSumRes] =
          await Promise.allSettled([
            patientsApi.getPatientByMrn(mrn),
            patientsApi.getAppointments(mrn),
            patientsApi.getPrescriptions(mrn),
            patientsApi.getBilling(mrn),
            patientsApi.getPrescriptionSummary(mrn),
          ]);

        if (cancelled) return;

        if (pRes.status === "fulfilled" && pRes.value) {
          setPatientData((prev) => ({ ...prev, ...pRes.value }));
        }

        if (apptRes.status === "fulfilled" && Array.isArray(apptRes.value)) {
          setAppointments(apptRes.value);
        }

        if (rxRes.status === "fulfilled" && Array.isArray(rxRes.value)) {
          setPrescriptions(rxRes.value);
        }

        if (billRes.status === "fulfilled" && Array.isArray(billRes.value)) {
          setBilling(billRes.value);
        }

        if (rxSumRes.status === "fulfilled" && rxSumRes.value) {
          setRxSummary(rxSumRes.value);
        }
      } catch (err) {
        console.log(err);
        // Handle silently
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [mrn]);

  const currentPatient = { ...patient, ...patientData };

  // Render EditPatientScreen if editing state is active
  if (isEditing) {
    return (
      <EditPatientScreen
        patient={currentPatient}
        patientMrn={mrn}
        onBack={() => {
          setIsEditing(false);
          if (mrn) {
            patientsApi
              .getPatientByMrn(mrn)
              .then((p) => {
                if (p) setPatientData((prev) => ({ ...prev, ...p }));
              })
              .catch(() => {});
          }
        }}
      />
    );
  }

  // Dynamic patient values
  const displayName =
    currentPatient.fullName ||
    currentPatient.name ||
    currentPatient.patientName ||
    "Patient";

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() || "P";

  const displayMrn =
    currentPatient.mrn || (currentPatient.id ? String(currentPatient.id) : "—");
  const displayStatus = String(currentPatient.status || "Active").toUpperCase();

  const calculateAge = (dob?: string, directAge?: number | string): string => {
    if (directAge && !isNaN(Number(directAge)) && Number(directAge) > 0) {
      return `${directAge} Y`;
    }
    if (!dob) return "—";
    try {
      const birth = new Date(dob);
      if (isNaN(birth.getTime())) return "—";
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const monthDiff = now.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate()))
        age--;
      return `${age >= 0 ? age : "—"} Y`;
    } catch (err) {
      console.log(err);
      return "—";
    }
  };

  const ageStr = calculateAge(
    currentPatient.dateOfBirth || currentPatient.dob,
    currentPatient.age,
  );
  const genderStr = currentPatient.gender || "—";
  const rawBlood = currentPatient.bloodGroup || currentPatient.blood_type;
  const bloodGroupStr = formatBloodGroup(rawBlood);
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const getValidEmail = (p: Patient): string => {
    const candidates = [
      p.email,
      (p as unknown as Record<string, unknown>).userEmail,
      (p as unknown as Record<string, unknown>).contactEmail,
      (p as unknown as Record<string, unknown>).primaryEmail,
      (p as unknown as Record<string, unknown>).registeredEmail,
      (p as unknown as Record<string, unknown>).patientEmail,
    ];
    for (const c of candidates) {
      if (typeof c === "string" && c.trim()) {
        const lower = c.trim().toLowerCase();
        if (
          lower !== "family@example.com" &&
          lower !== "email@example.com" &&
          lower !== "patient@example.com" &&
          lower !== "test@example.com"
        ) {
          return c.trim();
        }
      }
    }
    return "—";
  };

  const getRegistrationDateStr = (p: Patient): string => {
    const candidates = [
      p.registrationDate,
      p.createdAt,
      (p as unknown as Record<string, unknown>).registeredAt,
      (p as unknown as Record<string, unknown>).registeredDate,
      (p as unknown as Record<string, unknown>).created_at,
      (p as unknown as Record<string, unknown>).registration_date,
      (p as unknown as Record<string, unknown>).createdDate,
      (p as unknown as Record<string, unknown>).regDate,
    ];

    for (const c of candidates) {
      if (typeof c === "string" && c.trim()) {
        return formatDate(c.trim());
      }
    }
    return "—";
  };

  const phoneStr =
    currentPatient.phone ||
    currentPatient.mobileNumber ||
    currentPatient.mobile ||
    "—";
  const emailStr = getValidEmail(currentPatient);
  const regDateStr = getRegistrationDateStr(currentPatient);

  // Address parsing
  const parseAddress = (p: Patient): string => {
    const addr = p.address;
    if (!addr) return "—";
    if (typeof addr === "string") return addr.trim() || "—";
    const parts = [
      addr.addressLine1 ?? addr.street,
      addr.addressLine2,
      addr.city,
      addr.state,
      addr.pincode ?? addr.zipCode,
    ].filter((s): s is string => typeof s === "string" && s.trim().length > 0);
    return parts.length > 0 ? parts.join(", ") : "—";
  };
  const addressStr = parseAddress(currentPatient);

  // Emergency contact parsing
  const emergencyName =
    currentPatient.emergencyContact?.name ||
    currentPatient.emergencyContact?.contactName ||
    (currentPatient.emergencyContact?.relationship
      ? `Emergency Contact (${currentPatient.emergencyContact.relationship})`
      : "—");
  const emergencyPhone =
    currentPatient.emergencyContact?.mobile ||
    currentPatient.emergencyContact?.mobileNumber ||
    currentPatient.emergencyContact?.contactNumber ||
    currentPatient.emergencyContact?.phone ||
    "—";

  // Particular API metrics for this patient
  const totalVisits = appointments.length;
  const visitHistory = appointments.filter((a) => {
    const s = (a.status || "").toLowerCase().trim();
    return s === "completed" || s === "finalized" || s === "closed";
  });
  const lastVisitDate =
    visitHistory.length > 0
      ? formatDate(visitHistory[0].date || visitHistory[0].appointmentDate)
      : "—";

  const upcomingAppts = appointments.filter((a) => {
    const s = (a.status || "").toLowerCase().trim();
    return (
      s !== "completed" &&
      s !== "cancelled" &&
      s !== "canceled" &&
      s !== "closed" &&
      s !== "no_show" &&
      s !== "no-show"
    );
  });
  const upcomingDate =
    upcomingAppts.length > 0
      ? formatDate(upcomingAppts[0].date || upcomingAppts[0].appointmentDate)
      : "—";

  const activeScriptsCount =
    rxSummary && rxSummary.active > 0
      ? rxSummary.active
      : prescriptions.filter((p) => {
          const s = (p.status || "").toLowerCase().trim();
          return (
            s === "active" ||
            s === "issued" ||
            s === "finalized" ||
            s === "completed" ||
            s === "medication_prescribed"
          );
        }).length;

  const outstandingCalc = billing.reduce((sum, inv) => {
    const s = (inv.status || "").toLowerCase();
    if (s === "pending" || s === "overdue" || s === "unpaid") {
      const amt =
        typeof inv.amount === "number"
          ? inv.amount
          : parseFloat(String(inv.amount).replace(/[^0-9.-]/g, "")) || 0;
      return sum + amt;
    }
    return sum;
  }, 0);
  const outstandingDisplay = formatCompactCurrency(outstandingCalc);

  const rawAllergies: unknown = currentPatient.knownAllergies;
  const allergiesList: string[] =
    Array.isArray(rawAllergies) && rawAllergies.length > 0
      ? (rawAllergies as string[])
      : typeof rawAllergies === "string" && rawAllergies.trim()
        ? rawAllergies
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

  const rawConditions: unknown = currentPatient.chronicDiseases;
  const conditionsList: string[] =
    Array.isArray(rawConditions) && rawConditions.length > 0
      ? (rawConditions as string[])
      : typeof rawConditions === "string" && rawConditions.trim()
        ? rawConditions
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

  return (
    <div
      className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F1F5F9]"
      style={{ fontFamily: RB }}
    >
      {/* ── 1. HEADER & BREADCRUMB ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              type="button"
              onClick={handleBack}
              className="p-1.5 -ml-1 text-slate-400 hover:text-[#0D47A1] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              title="Go Back"
            >
              <ChevronLeft size={20} />
            </button>
            <h1
              className="text-xl font-bold text-[#111827]"
              style={{ fontFamily: PP }}
            >
              Patient Profile
            </h1>
          </div>
          <div
            className="flex items-center gap-1.5 text-xs text-[#64748B] pl-7"
            style={{ fontFamily: RB }}
          >
            <button
              type="button"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="hover:text-[#0D47A1] transition-colors cursor-pointer"
            >
              Hospital Admin
            </button>
            <ChevronRight size={13} className="text-slate-300" />
            <button
              type="button"
              onClick={() => navigate(ROUTES.PATIENTS)}
              className="hover:text-[#0D47A1] transition-colors cursor-pointer"
            >
              Patient Management
            </button>
            <ChevronRight size={13} className="text-slate-300" />
            <span className="font-semibold text-[#111827]">{displayName}</span>
          </div>
        </div>

        {/* ── Patient Navigation Controls ── */}
        {(onPrevPatient || onNextPatient) && (
          <div className="flex items-center gap-2">
            {onPrevPatient && (
              <button
                type="button"
                onClick={onPrevPatient}
                className="px-3 py-2 rounded-xl bg-white border border-[#E5E7EB] text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                title="Previous Patient"
                style={{ fontFamily: PP }}
              >
                <ChevronLeft size={14} /> Previous Patient
              </button>
            )}
            {onNextPatient && (
              <button
                type="button"
                onClick={onNextPatient}
                className="px-3.5 py-2 rounded-xl bg-[#0D47A1] text-white hover:bg-[#0a3880] text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                title="Next Patient"
                style={{ fontFamily: PP }}
              >
                Next Patient <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 2. PATIENT HERO BANNER CARD ── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar */}
          {(() => {
            const photoUrl = extractPatientPhotoUrl(currentPatient);
            return (
              <div
                className="w-16 h-16 rounded-full bg-[#EF4444] text-white font-bold text-xl flex items-center justify-center shadow-md overflow-hidden shrink-0"
                style={{ fontFamily: PP }}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  initials
                )}
              </div>
            );
          })()}

          {/* Details */}
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2
                className="text-xl font-bold text-[#111827]"
                style={{ fontFamily: PP }}
              >
                {displayName}
              </h2>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-50 text-[#0D47A1] border border-blue-100">
                {displayMrn}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {displayStatus}
              </span>
            </div>

            {/* Sub details row with Registration Date */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64748B] mt-2">
              <span className="font-medium text-[#111827]">
                {ageStr} / {genderStr}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#111827] font-medium">
                <Droplets size={13} className="text-red-500" /> Blood{" "}
                {bloodGroupStr}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#111827]">
                <Phone size={13} className="text-slate-400" /> {phoneStr}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#64748B] font-medium">
                <Calendar size={13} className="text-blue-500" /> Reg:{" "}
                {regDateStr}
              </span>
            </div>
          </div>
        </div>

        {/* Top Right Actions: ONLY Edit Patient Information & Print Profile */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => {
              if (onEdit) {
                onEdit(currentPatient);
              } else {
                setIsEditing(true);
              }
            }}
            className="px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            style={{ fontFamily: PP }}
          >
            <Edit size={14} className="text-slate-500" /> Edit Patient
            Information
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            style={{ fontFamily: PP }}
          >
            <Printer size={14} className="text-slate-500" /> Print Profile
          </button>
        </div>
      </div>

      {/* ── 3. 6 KPI SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm text-center">
          <div className="text-[11px] text-[#64748B] font-medium mb-1">
            Total Visits
          </div>
          <div
            className="text-2xl font-bold text-[#111827]"
            style={{ fontFamily: PP }}
          >
            {totalVisits}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm text-center">
          <div className="text-[11px] text-[#64748B] font-medium mb-1">
            Last Visit
          </div>
          <div className="text-xs font-bold text-[#111827] mt-1.5">
            {lastVisitDate}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm text-center">
          <div className="text-[11px] text-[#64748B] font-medium mb-1">
            Upcoming
          </div>
          <div className="text-xs font-bold text-[#0D47A1] mt-1.5">
            {upcomingDate}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm text-center">
          <div className="text-[11px] text-[#64748B] font-medium mb-1">
            Active Scripts
          </div>
          <div
            className="text-2xl font-bold text-[#009688]"
            style={{ fontFamily: PP }}
          >
            {activeScriptsCount}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-sm text-center">
          <div className="text-[11px] text-[#64748B] font-medium mb-1">
            Outstanding
          </div>
          <div className="text-base font-bold text-[#EF4444] mt-1">
            {outstandingDisplay}
          </div>
        </div>
      </div>

      {/* ── 4. TABS NAVIGATION BAR ── */}
      <div className="flex items-center gap-1 border-b border-[#E5E7EB] overflow-x-auto pb-0.5">
        {TAB_CONFIG.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold transition-all rounded-xl whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[#0D47A1] text-white shadow-sm"
                  : "text-[#64748B] hover:bg-slate-100 hover:text-[#111827]"
              }`}
              style={{ fontFamily: PP }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── 5. TAB CONTENTS ── */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Top Row: Patient Info & Allergies/Conditions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patient Information & Emergency Contact Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
              <h3
                className="text-xs font-bold uppercase tracking-wider text-[#0D47A1]"
                style={{ fontFamily: PP }}
              >
                PATIENT INFORMATION &amp; EMERGENCY CONTACT
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#64748B] text-[11px] block">
                    Full Address
                  </span>
                  <span className="font-semibold text-[#111827] flex items-center gap-1.5 mt-0.5">
                    <MapPin size={13} className="text-[#0D47A1] shrink-0" />
                    {addressStr}
                  </span>
                </div>

                <div>
                  <span className="text-[#64748B] text-[11px] block">
                    Email Address
                  </span>
                  <span className="font-semibold text-[#111827] flex items-center gap-1.5 mt-0.5">
                    <Mail size={13} className="text-[#0D47A1] shrink-0" />
                    {emailStr}
                  </span>
                </div>

                <div>
                  <span className="text-[#64748B] text-[11px] block">
                    Emergency Contact Person
                  </span>
                  <span className="font-semibold text-[#111827] block mt-0.5">
                    {emergencyName}
                  </span>
                </div>

                <div>
                  <span className="text-[#64748B] text-[11px] block">
                    Emergency Phone
                  </span>
                  <span className="font-semibold text-red-600 flex items-center gap-1.5 mt-0.5">
                    <Phone size={13} className="text-red-500 shrink-0" />
                    {emergencyPhone}
                  </span>
                </div>
              </div>
            </div>

            {/* Known Allergies & Medical Conditions Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
              <h3
                className="text-xs font-bold uppercase tracking-wider text-[#009688]"
                style={{ fontFamily: PP }}
              >
                KNOWN ALLERGIES &amp; MEDICAL CONDITIONS
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[#64748B] text-[11px] block font-medium mb-1.5">
                    Known Allergies
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {allergiesList.length > 0 ? (
                      allergiesList.map((a) => (
                        <span
                          key={a}
                          className="px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 bg-red-50 text-[#EF4444] border-red-100"
                        >
                          <AlertTriangle size={12} /> {a}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-xs italic">
                        No known allergies
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[#64748B] text-[11px] block font-medium mb-1.5">
                    Existing Medical Conditions
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {conditionsList.length > 0 ? (
                      conditionsList.map((c) => (
                        <span
                          key={c}
                          className="px-3 py-1 rounded-full text-xs font-medium border bg-blue-50 text-[#0D47A1] border-blue-100"
                        >
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-xs italic">
                        No medical conditions recorded
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Recent Appointments & Active Prescriptions Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Appointments Summary */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3
                  className="text-xs font-bold uppercase tracking-wider text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  RECENT APPOINTMENTS SUMMARY
                </h3>
                <button
                  onClick={() => setActiveTab("appointments")}
                  className="text-xs font-bold text-[#0D47A1] hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              {appointments.length > 0 ? (
                <div className="space-y-3">
                  {appointments.slice(0, 3).map((appt) => (
                    <div
                      key={String(appt.id || appt.appointmentId)}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#111827]">
                          {extractDoctorNameFromAppt(appt)}
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          {extractDeptName(appt.department)} ·{" "}
                          {formatDate(appt.appointmentDate || appt.date)}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                        ● {appt.status || "Scheduled"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center italic">
                  No appointments found
                </p>
              )}
            </div>

            {/* Active Prescriptions Summary */}
            <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3
                  className="text-xs font-bold uppercase tracking-wider text-[#111827]"
                  style={{ fontFamily: PP }}
                >
                  ACTIVE PRESCRIPTIONS SUMMARY
                </h3>
                <button
                  onClick={() => setActiveTab("prescriptions")}
                  className="text-xs font-bold text-[#0D47A1] hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              {prescriptions.filter((p) => {
                const s = (p.status || "").toLowerCase().trim();
                return (
                  s === "active" ||
                  s === "issued" ||
                  s === "finalized" ||
                  s === "completed" ||
                  s === "medication_prescribed"
                );
              }).length > 0 ? (
                <div className="space-y-3">
                  {prescriptions
                    .filter((p) => {
                      const s = (p.status || "").toLowerCase().trim();
                      return (
                        s === "active" ||
                        s === "issued" ||
                        s === "finalized" ||
                        s === "completed" ||
                        s === "medication_prescribed"
                      );
                    })
                    .slice(0, 3)
                    .map((rx) => (
                      <div
                        key={String(rx.id)}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#009688] flex items-center justify-center">
                            <Pill size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#111827]">
                              Prescribed by Dr. {extractRxDoctorName(rx)}
                            </div>
                            <div className="text-[11px] text-[#64748B]">
                              {extractRxMedCount(rx)} Medication(s) ·{" "}
                              {formatDate(rx.date)}
                            </div>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-50 text-[#009688]">
                          {rx.status || "Active"}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center italic">
                  No active prescriptions found
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPOINTMENTS */}
      {activeTab === "appointments" && (
        <PatientAppointmentsTab
          patient={currentPatient}
          canEdit={can(
            currentRole,
            "manageAppointments",
            currentRole === "PATIENT",
          )}
          isOwnProfile={currentRole === "PATIENT"}
          onBookAppointment={onBookAppointment}
        />
      )}

      {/* TAB 3: MEDICAL HISTORY */}
      {/*  {activeTab === "medicalHistory" && (
        <PatientMedicalRecordsTab
          patient={currentPatient}
          canEdit={can(currentRole, "editMedicalRecords", currentRole === "PATIENT")}
          isOwnProfile={currentRole === "PATIENT"}
        />
      )} */}

      {/* TAB 4: VISIT HISTORY */}
      {activeTab === "visitHistory" && (
        <VisitHistoryTab
          patient={currentPatient}
          isOwnProfile={currentRole === "PATIENT"}
        />
      )}

      {/* TAB 5: PRESCRIPTIONS */}
      {activeTab === "prescriptions" && (
        <PatientPrescriptionsTab
          patient={currentPatient}
          canEdit={can(
            currentRole,
            "editPrescriptions",
            currentRole === "PATIENT",
          )}
          isOwnProfile={currentRole === "PATIENT"}
        />
      )}

      {/* TAB 6: BILLING */}
      {activeTab === "billing" && (
        <PatientBillingTab
          patient={currentPatient}
          canEdit={can(currentRole, "manageBilling", currentRole === "PATIENT")}
          isOwnProfile={currentRole === "PATIENT"}
        />
      )}

      {/* TAB 7: DOCUMENTS */}
      {activeTab === "documents" && (
        <PatientDocumentsTab
          patient={currentPatient}
          canEdit={can(currentRole, "editProfile", currentRole === "PATIENT")}
          isOwnProfile={currentRole === "PATIENT"}
        />
      )}
    </div>
  );
}
