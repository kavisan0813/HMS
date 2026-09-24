import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  User,
  MapPin,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  RotateCcw,
  Calendar,
  ArrowLeft,
} from "lucide-react";
import { PP, RB } from "../constants/patient.fonts";
import { useCreatePatient } from "../hooks/useCreatePatient";
import { patientsApi } from "../api/patient.api";
import type {
  CreatePatientRequest,
  RegistrationType,
} from "../types/patient.types";
import { ROLE_FIELD_PERMISSIONS } from "../types/patient.types";
import { useAuthStore } from "../../auth/store/auth.store";
import { usePatientPortal } from "../context/usePatientPortal";
import { CustomDatePicker } from "../../../components/CustomDatePicker";
import { apiClient } from "../../../lib/axios";

/* ─────────────────── Design Tokens ─────────────────── */
const inputBase =
  "w-full px-3.5 py-2.5 text-[13px] bg-white border border-gray-200 rounded-xl text-[#111827] outline-none focus:border-[#0D47A1] focus:ring-2 focus:ring-[#0D47A1]/10 transition-colors duration-200 placeholder:text-slate-400";
const inputError =
  "w-full px-3.5 py-2.5 text-[13px] bg-white border border-red-300 rounded-xl text-[#111827] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 transition-colors duration-200 placeholder:text-slate-400";
const inputDisabled =
  "w-full px-3.5 py-2.5 text-[13px] bg-slate-50 border border-gray-200 rounded-xl text-slate-500 font-mono outline-none cursor-not-allowed";
const labelBase = "block text-xs font-semibold text-slate-600 mb-1.5";

/* ─────────────────── Helper Normalizers ─────────────────── */
function normalizeBloodGroup(bg?: unknown): string {
  if (!bg) return "";
  const s = String(bg).trim().toUpperCase();
  if (
    s === "A+" ||
    s === "A_POSITIVE" ||
    s === "A POSITIVE" ||
    s === "A POS" ||
    s === "A-POSITIVE"
  )
    return "A_POSITIVE";
  if (
    s === "A-" ||
    s === "A_NEGATIVE" ||
    s === "A NEGATIVE" ||
    s === "A NEG" ||
    s === "A-NEGATIVE"
  )
    return "A_NEGATIVE";
  if (
    s === "B+" ||
    s === "B_POSITIVE" ||
    s === "B POSITIVE" ||
    s === "B POS" ||
    s === "B-POSITIVE"
  )
    return "B_POSITIVE";
  if (
    s === "B-" ||
    s === "B_NEGATIVE" ||
    s === "B NEGATIVE" ||
    s === "B NEG" ||
    s === "B-NEGATIVE"
  )
    return "B_NEGATIVE";
  if (
    s === "AB+" ||
    s === "AB_POSITIVE" ||
    s === "AB POSITIVE" ||
    s === "AB POS" ||
    s === "AB-POSITIVE"
  )
    return "AB_POSITIVE";
  if (
    s === "AB-" ||
    s === "AB_NEGATIVE" ||
    s === "AB NEGATIVE" ||
    s === "AB NEG" ||
    s === "AB-NEGATIVE"
  )
    return "AB_NEGATIVE";
  if (
    s === "O+" ||
    s === "O_POSITIVE" ||
    s === "O POSITIVE" ||
    s === "O POS" ||
    s === "O-POSITIVE"
  )
    return "O_POSITIVE";
  if (
    s === "O-" ||
    s === "O_NEGATIVE" ||
    s === "O NEGATIVE" ||
    s === "O NEG" ||
    s === "O-NEGATIVE"
  )
    return "O_NEGATIVE";
  if (s === "UNKNOWN") return "UNKNOWN";
  return s;
}

function normalizeMaritalStatus(ms?: unknown): string {
  if (!ms) return "";
  const s = String(ms).trim().toUpperCase();
  if (s.includes("SINGLE") || s.includes("UNMARRIED")) return "SINGLE";
  if (s.includes("MARRIED")) return "MARRIED";
  if (s.includes("DIVORCED")) return "DIVORCED";
  if (s.includes("WIDOW")) return "WIDOWED";
  if (s.includes("SEPARAT")) return "SEPARATED";
  return s;
}

function parseListField(val: unknown): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (Array.isArray(val)) {
    return val
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null) {
          const obj = item as Record<string, unknown>;
          return (
            obj.allergyName ||
            obj.allergy ||
            obj.diseaseName ||
            obj.disease ||
            obj.name ||
            obj.title ||
            ""
          );
        }
        return String(item);
      })
      .filter(Boolean)
      .join(", ");
  }
  return String(val);
}

function extractAddressFields(src: unknown): {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
} {
  if (!src) {
    return {
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    };
  }

  let addrObj: Record<string, unknown> = {};
  if (typeof src === "object" && src !== null) {
    const raw = src as Record<string, unknown>;
    if (typeof raw.address === "object" && raw.address !== null) {
      addrObj = raw.address as Record<string, unknown>;
    } else if (typeof raw.address === "string" && raw.address.trim()) {
      const str = raw.address.trim();
      const parts = str
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      return {
        addressLine1: parts[0] || str,
        addressLine2: parts[1] || "",
        city: parts[2] || (raw.city as string) || "",
        state: parts[3] || (raw.state as string) || "",
        pincode:
          parts[4] || (raw.pincode as string) || (raw.zipCode as string) || "",
        country: parts[5] || (raw.country as string) || "India",
      };
    } else {
      addrObj = raw;
    }
  } else if (typeof src === "string" && src.trim()) {
    const str = src.trim();
    const parts = str
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    return {
      addressLine1: parts[0] || str,
      addressLine2: parts[1] || "",
      city: parts[2] || "",
      state: parts[3] || "",
      pincode: parts[4] || "",
      country: parts[5] || "India",
    };
  }

  const line1 = String(
    addrObj.addressLine1 ||
      addrObj.address1 ||
      addrObj.line1 ||
      addrObj.street ||
      "",
  );
  const line2 = String(
    addrObj.addressLine2 ||
      addrObj.address2 ||
      addrObj.line2 ||
      addrObj.street2 ||
      "",
  );
  const city = String(
    addrObj.city || addrObj.cityName || addrObj.district || "",
  );
  const state = String(
    addrObj.state || addrObj.stateName || addrObj.province || "",
  );
  const pincode = String(
    addrObj.pincode ||
      addrObj.pinCode ||
      addrObj.zipCode ||
      addrObj.postalCode ||
      addrObj.zip ||
      addrObj.pin ||
      "",
  );
  const country = String(addrObj.country || addrObj.countryName || "India");

  return {
    addressLine1: line1,
    addressLine2: line2,
    city: city,
    state: state,
    pincode: pincode,
    country: country,
  };
}

/* ─────────────────── Option Data ─────────────────── */
const BLOOD_GROUPS = [
  { value: "", label: "Select Blood Group" },
  { value: "A_POSITIVE", label: "A+" },
  { value: "A_NEGATIVE", label: "A−" },
  { value: "B_POSITIVE", label: "B+" },
  { value: "B_NEGATIVE", label: "B−" },
  { value: "AB_POSITIVE", label: "AB+" },
  { value: "AB_NEGATIVE", label: "AB−" },
  { value: "O_POSITIVE", label: "O+" },
  { value: "O_NEGATIVE", label: "O−" },
  { value: "UNKNOWN", label: "Unknown" },
];

const GENDERS = [
  { value: "", label: "Select Gender" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

const MARITAL_STATUSES = [
  { value: "", label: "Select Status" },
  { value: "SINGLE", label: "Single" },
  { value: "MARRIED", label: "Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
  { value: "SEPARATED", label: "Separated" },
];

const RELATIONSHIPS = [
  { value: "", label: "Select Relationship" },
  { value: "Spouse", label: "Spouse" },
  { value: "Parent", label: "Parent" },
  { value: "Child", label: "Child" },
  { value: "Sibling", label: "Sibling" },
  { value: "Guardian", label: "Guardian" },
  { value: "Friend", label: "Friend" },
  { value: "Other", label: "Other" },
];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
];

/* ─────────────────── Form State ─────────────────── */
interface RegistrationFormState {
  fullName: string;
  gender: string;
  dateOfBirth: string;
  mobileNumber: string;
  email: string;
  bloodGroup: string;
  maritalStatus: string;
  nationalId: string;
  photoUrl: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  ecName: string;
  ecRelationship: string;
  ecMobile: string;
  ecAltMobile: string;
  patientCategory: string;
  knownAllergies: string;
  chronicDiseases: string;
  specialNotes: string;
  registrationDate: string;
  relationship: string;
}

const today = new Date();
const pad = (n: number) => n.toString().padStart(2, "0");
const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

const INITIAL_FORM: RegistrationFormState = {
  fullName: "",
  gender: "",
  dateOfBirth: "",
  mobileNumber: "",
  email: "",
  bloodGroup: "",
  maritalStatus: "",
  nationalId: "",
  photoUrl: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  ecName: "",
  ecRelationship: "",
  ecMobile: "",
  ecAltMobile: "",
  patientCategory: "GENERAL",
  knownAllergies: "",
  chronicDiseases: "",
  specialNotes: "",
  registrationDate: todayStr,
  relationship: "SELF",
};

/* ─────────────────── Toast ─────────────────── */
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  return (
    <div
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium max-w-md animate-[slideIn_0.35s_ease-out] ${
        type === "success"
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-red-50 border-red-200 text-red-800"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
      ) : (
        <AlertCircle size={18} className="text-red-500 shrink-0" />
      )}
      <span className="flex-1">{message}</span>
      <button
        type="button"
        aria-label="Close notification"
        onClick={onClose}
        className="ml-2 p-0.5 rounded-lg hover:bg-black/5 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}

/* ─────────────────── Section Header ─────────────────── */
function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
      <div className="w-9 h-9 rounded-xl bg-[#0D47A1]/[0.07] flex items-center justify-center">
        <Icon size={17} className="text-[#0D47A1]" />
      </div>
      <div>
        <h2
          className="text-[14px] font-bold text-[#111827]"
          style={{ fontFamily: PP }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-[11px] text-slate-400 mt-0.5"
            style={{ fontFamily: RB }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── Success Dialog ─────────────────── */
function RegistrationSuccessDialog({
  mrn,
  patientName,
  isFamilyMode = false,
  isEditMode = false,
  onClose,
  onBookAppointment,
  onViewProfile,
  onSwitchToNewPatient,
}: {
  mrn: string;
  patientName: string;
  isFamilyMode?: boolean;
  isEditMode?: boolean;
  onClose: () => void;
  onBookAppointment?: (mrn: string) => void;
  onViewProfile?: (mrn: string) => void;
  onSwitchToNewPatient?: (mrn: string, patientName: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 text-center animate-[scaleIn_0.25s_ease-out]">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <h3
          className="text-xl font-bold text-[#111827] mb-2"
          style={{ fontFamily: PP }}
        >
          {isEditMode
            ? "Family Member Updated!"
            : isFamilyMode
              ? "Family Member Registered!"
              : "Registration Successful!"}
        </h3>
        <p className="text-sm text-slate-500 mb-1" style={{ fontFamily: RB }}>
          <span className="font-semibold text-[#111827]">{patientName}</span>{" "}
          {isEditMode
            ? "details have been updated successfully."
            : isFamilyMode
              ? "has been registered successfully as a family member."
              : "has been registered."}
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-100 mt-2 mb-6">
          <span className="text-xs text-slate-500" style={{ fontFamily: RB }}>
            MRN
          </span>
          <span className="text-sm font-bold font-mono text-[#0D47A1]">
            {mrn}
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {isFamilyMode || isEditMode ? (
            <>
              {onViewProfile && (
                <button
                  onClick={() => onViewProfile(mrn)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white text-sm font-semibold hover:bg-[#0c3d8a] transition-colors shadow-sm"
                  style={{ fontFamily: PP }}
                >
                  <User size={16} />
                  View Patient Profile
                </button>
              )}
              <button
                onClick={onClose}
                className="w-full px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                style={{ fontFamily: PP }}
              >
                Return to Family Members
              </button>
            </>
          ) : (
            <>
              {onSwitchToNewPatient && (
                <button
                  onClick={() => onSwitchToNewPatient(mrn, patientName)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D47A1] text-white text-sm font-semibold hover:bg-[#0c3d8a] transition-colors shadow-sm"
                  style={{ fontFamily: PP }}
                >
                  <User size={16} />
                  Switch to New Patient
                </button>
              )}
              {onBookAppointment && (
                <button
                  onClick={() => onBookAppointment(mrn)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#009688] text-white text-sm font-semibold hover:bg-teal-700 transition-colors shadow-sm"
                  style={{ fontFamily: PP }}
                >
                  <Calendar size={16} />
                  Book Appointment
                </button>
              )}
              {onViewProfile && (
                <button
                  onClick={() => onViewProfile(mrn)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
                  style={{ fontFamily: PP }}
                >
                  <User size={16} />
                  View Patient Profile
                </button>
              )}
              <button
                onClick={onClose}
                className="w-full px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                style={{ fontFamily: PP }}
              >
                Register Another Patient
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export type RegistrationMode =
  | "ADMIN"
  | "RECEPTIONIST"
  | "PATIENT_SELF"
  | "PATIENT_FAMILY";

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export function RegisterPatientScreen({
  onBack,
  onBookAppointment,
  onViewProfile,
  onSwitchToNewPatient,
  onRegistered,
  registrationMode = "ADMIN",
  isFamilyMode = false,
  primaryPatientMrn,
  isEditMode = false,
  editMember = null,
}: {
  onBack?: () => void;
  onBookAppointment?: (mrn: string) => void;
  onViewProfile?: (mrn: string) => void;
  onSwitchToNewPatient?: (mrn: string, patientName: string) => void;
  onRegistered?: (member: {
    mrn: string;
    patientName: string;
    relationship?: string;
    gender?: string;
    mobileNumber?: string;
  }) => void;
  registrationMode?: RegistrationMode;
  isFamilyMode?: boolean;
  primaryPatientMrn?: string;
  isEditMode?: boolean;
  editMember?: {
    id?: string | number;
    mrn?: string;
    patientName?: string;
    name?: string;
    fullName?: string;
    relationship?: string;
    gender?: string;
    dateOfBirth?: string;
    registeredMobile?: string;
    mobileNumber?: string;
    phone?: string;
    email?: string;
    bloodGroup?: string;
    knownAllergies?: string[];
  } | null;
}) {
  const effectiveMode = isFamilyMode ? "PATIENT_FAMILY" : registrationMode;
  const showRelationship =
    effectiveMode === "PATIENT_SELF" || effectiveMode === "PATIENT_FAMILY";

  const initialRelationship =
    effectiveMode === "PATIENT_SELF"
      ? "SELF"
      : effectiveMode === "PATIENT_FAMILY"
        ? ""
        : "SELF";

  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const portal = usePatientPortal();

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  }, [onBack, navigate]);

  // Role-based field gating (RBAC) for staff-facing (ADMIN) registrations.
  const roleKey = String(user?.role ?? "").toUpperCase();
  const rolePerms =
    effectiveMode === "ADMIN" || effectiveMode === "RECEPTIONIST"
      ? ROLE_FIELD_PERMISSIONS[roleKey]
      : undefined;
  const hideField = (field: string) =>
    rolePerms?.hiddenFields.includes(field) ?? false;
  const readOnlyField = (field: string) =>
    (rolePerms?.alwaysReadOnly.includes(field) ||
      rolePerms?.readOnlyFields.includes(field)) ??
    false;

  const isAddingFamilyMember = effectiveMode === "PATIENT_FAMILY";
  const isPatientUser = String(user?.role || "").toUpperCase() === "PATIENT";
  const isSelfRegistration =
    effectiveMode === "PATIENT_SELF" ||
    (isPatientUser && !isAddingFamilyMember);

  const [form, setForm] = useState<RegistrationFormState>(() => {
    let pendingDob = "";
    let pendingGender = "";
    try {
      const userEmail = String(user?.email || "")
        .trim()
        .toLowerCase();
      const raw1 = userEmail
        ? localStorage.getItem(`hms-pending-patient:${userEmail}`)
        : null;
      const raw2 =
        localStorage.getItem("hms-pending-patient-last:v1") ||
        localStorage.getItem("hms-pending-patient-last");
      const raw3 = localStorage.getItem("hms-pending-patient-profile:v1");
      const storedPending = raw1 || raw2 || raw3;
      if (storedPending) {
        const parsed = JSON.parse(storedPending);
        pendingDob = parsed?.dateOfBirth || parsed?.dob || "";
        pendingGender = parsed?.gender || "";
      }
    } catch (err) {
      console.log(err);
      /* ignore */
    }

    const rawDob = user?.dateOfBirth || user?.dob || pendingDob;
    const rawGender = user?.gender || pendingGender;

    return {
      ...INITIAL_FORM,
      relationship: initialRelationship,
      ...(isSelfRegistration
        ? {
            fullName: user?.fullName || user?.name || "",
            email: user?.email || "",
            mobileNumber:
              user?.mobile || user?.phone || user?.mobileNumber || "",
            dateOfBirth: rawDob ? String(rawDob).split("T")[0] : "",
            gender: rawGender ? String(rawGender).toUpperCase() : "",
          }
        : {}),
    };
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [successData, setSuccessData] = useState<{
    mrn: string;
    name: string;
  } | null>(null);

  const [submitting, setSubmitting] = useState(false);

  const createPatient = useCreatePatient();

  // Fetch patient profile details (including dateOfBirth & gender) for PATIENT self-registration
  useEffect(() => {
    if (!isSelfRegistration) return;
    let cancelled = false;

    async function loadSelfPatientData() {
      try {
        let pendingDob = "";
        let pendingGender = "";
        try {
          const userEmail = String(user?.email || "")
            .trim()
            .toLowerCase();
          const raw1 = userEmail
            ? localStorage.getItem(`hms-pending-patient:${userEmail}`)
            : null;
          const raw2 =
            localStorage.getItem("hms-pending-patient-last:v1") ||
            localStorage.getItem("hms-pending-patient-last");
          const raw3 = localStorage.getItem("hms-pending-patient-profile:v1");
          const storedPending = raw1 || raw2 || raw3;
          if (storedPending) {
            const parsed = JSON.parse(storedPending);
            pendingDob = parsed?.dateOfBirth || parsed?.dob || "";
            pendingGender = parsed?.gender || "";
          }
        } catch (err) {
          console.log(err);
          /* ignore */
        }

        const patients = await patientsApi.getMyPatients().catch(() => []);
        if (cancelled) return;

        const patient =
          Array.isArray(patients) && patients.length > 0
            ? patients.find(
                (entry) => String(entry.relationship).toUpperCase() === "SELF",
              ) ||
              patients.find((entry) => entry.mrn === user?.patientId) ||
              patients[0]
            : undefined;

        const rawDob =
          patient?.dateOfBirth ||
          patient?.dob ||
          user?.dateOfBirth ||
          user?.dob ||
          pendingDob ||
          "";
        const cleanDob = rawDob ? String(rawDob).split("T")[0] : "";

        const rawGender =
          (patient?.gender ? String(patient.gender).toUpperCase() : "") ||
          (user?.gender ? String(user.gender).toUpperCase() : "") ||
          (pendingGender ? String(pendingGender).toUpperCase() : "");

        setForm((prev) => ({
          ...prev,
          fullName:
            prev.fullName ||
            patient?.patientName ||
            patient?.fullName ||
            patient?.name ||
            user?.fullName ||
            user?.name ||
            "",
          email: prev.email || patient?.email || user?.email || "",
          mobileNumber:
            prev.mobileNumber ||
            patient?.registeredMobile ||
            patient?.mobileNumber ||
            patient?.phone ||
            user?.mobile ||
            "",
          dateOfBirth: prev.dateOfBirth || cleanDob,
          gender: prev.gender || rawGender,
          bloodGroup: prev.bloodGroup || patient?.bloodGroup || "",
        }));
      } catch (e) {
        console.error("Failed to load patient profile details:", e);
      }
    }

    void loadSelfPatientData();
    return () => {
      cancelled = true;
    };
  }, [
    isSelfRegistration,
    user?.patientId,
    user?.dateOfBirth,
    user?.dob,
    user?.gender,
    user?.fullName,
    user?.name,
    user?.email,
    user?.mobile,
  ]);

  // Pre-fill form when editing a family member
  useEffect(() => {
    if (!isEditMode || !editMember) return;
    let cancelled = false;

    const emObj = editMember as Record<string, unknown>;
    const emName =
      editMember.patientName ||
      (editMember.fullName as string) ||
      (editMember.name as string) ||
      "";
    const emGender = editMember.gender
      ? String(editMember.gender).toUpperCase()
      : "";
    const emDob = editMember.dateOfBirth
      ? String(editMember.dateOfBirth).split("T")[0]
      : "";
    const emMobile =
      editMember.registeredMobile ||
      (editMember.mobileNumber as string) ||
      (editMember.phone as string) ||
      "";
    const emEmail = String(
      editMember.email ||
        emObj.emailAddress ||
        emObj.contactEmail ||
        emObj.patientEmail ||
        "",
    );
    const emBlood = normalizeBloodGroup(
      editMember.bloodGroup || emObj.blood_group || emObj.bloodGroupEnum,
    );
    const emMarital = normalizeMaritalStatus(
      emObj.maritalStatus || emObj.marital_status || emObj.maritalStatusEnum,
    );
    const emAllergies = parseListField(
      editMember.knownAllergies || emObj.allergies || emObj.known_allergies,
    );
    const emRel = editMember.relationship
      ? String(editMember.relationship).toUpperCase()
      : "";
    const emAddr = extractAddressFields(emObj.address || emObj);

    // Immediate initial population from editMember prop
    Promise.resolve().then(() => {
      if (cancelled) return;
      setForm((prev) => ({
        ...prev,
        fullName: emName || prev.fullName,
        gender: emGender || prev.gender,
        dateOfBirth: emDob || prev.dateOfBirth,
        mobileNumber: emMobile || prev.mobileNumber,
        email: emEmail || prev.email,
        bloodGroup: emBlood || prev.bloodGroup,
        maritalStatus: emMarital || prev.maritalStatus,
        knownAllergies: emAllergies || prev.knownAllergies,
        relationship: emRel || prev.relationship,
        addressLine1: emAddr.addressLine1 || prev.addressLine1,
        addressLine2: emAddr.addressLine2 || prev.addressLine2,
        city: emAddr.city || prev.city,
        state: emAddr.state || prev.state,
        pincode: emAddr.pincode || prev.pincode,
        country: emAddr.country || prev.country || "India",
      }));
    });

    // Fetch full patient record from API
    const mrn = editMember.mrn;
    if (!mrn) return;

    async function loadPatientDetails() {
      try {
        const res = await apiClient.get(
          `/api/v1/patients/${encodeURIComponent(mrn!)}`,
        );
        if (cancelled) return;
        const rawData = ((res.data as { data?: Record<string, unknown> })
          ?.data || res.data) as Record<string, unknown>;
        if (rawData) {
          const em =
            (rawData.emergencyContact as Record<string, unknown>) || {};
          const apiAddr = extractAddressFields(rawData.address || rawData);

          const apiEmail = String(
            rawData.email ||
              rawData.emailAddress ||
              rawData.contactEmail ||
              rawData.patientEmail ||
              emEmail ||
              "",
          );
          const apiBloodGroup = normalizeBloodGroup(
            rawData.bloodGroup ||
              rawData.blood_group ||
              rawData.bloodGroupEnum ||
              editMember?.bloodGroup ||
              emObj.blood_group,
          );
          const apiMaritalStatus = normalizeMaritalStatus(
            rawData.maritalStatus ||
              rawData.marital_status ||
              rawData.maritalStatusEnum ||
              emObj.maritalStatus ||
              emObj.marital_status,
          );
          const apiAllergies = parseListField(
            rawData.knownAllergies ||
              rawData.allergies ||
              rawData.known_allergies ||
              rawData.allergyDetails ||
              editMember?.knownAllergies ||
              emObj.allergies,
          );
          const apiDiseases = parseListField(
            rawData.chronicDiseases ||
              rawData.chronicConditions ||
              rawData.diseases ||
              rawData.chronic_diseases ||
              emObj.chronicDiseases,
          );

          setForm((prev) => ({
            ...prev,
            fullName: String(
              rawData.fullName ||
                rawData.patientName ||
                rawData.name ||
                prev.fullName,
            ),
            gender: String(rawData.gender || prev.gender).toUpperCase(),
            dateOfBirth: rawData.dateOfBirth
              ? String(rawData.dateOfBirth).split("T")[0]
              : rawData.dob
                ? String(rawData.dob).split("T")[0]
                : prev.dateOfBirth,
            mobileNumber: String(
              rawData.phone ||
                rawData.mobileNumber ||
                rawData.registeredMobile ||
                prev.mobileNumber,
            ),
            email: apiEmail || prev.email,
            bloodGroup: apiBloodGroup || prev.bloodGroup,
            maritalStatus: apiMaritalStatus || prev.maritalStatus,
            nationalId: String(
              rawData.nationalId ||
                rawData.aadharNumber ||
                rawData.aadhar ||
                prev.nationalId ||
                "",
            ),
            photoUrl: String(rawData.photoUrl || prev.photoUrl || ""),
            addressLine1:
              apiAddr.addressLine1 || emAddr.addressLine1 || prev.addressLine1,
            addressLine2:
              apiAddr.addressLine2 || emAddr.addressLine2 || prev.addressLine2,
            city: apiAddr.city || emAddr.city || prev.city,
            state: apiAddr.state || emAddr.state || prev.state,
            pincode: apiAddr.pincode || emAddr.pincode || prev.pincode,
            country:
              apiAddr.country || emAddr.country || prev.country || "India",
            ecName: String(em.name || ""),
            ecRelationship: String(em.relationship || ""),
            ecMobile: String(em.mobileNumber || em.phone || ""),
            ecAltMobile: String(em.alternativeMobileNumber || ""),
            patientCategory: String(
              rawData.patientCategory || "GENERAL",
            ).toUpperCase(),
            knownAllergies: apiAllergies || prev.knownAllergies,
            chronicDiseases: apiDiseases || prev.chronicDiseases,
            specialNotes: String(rawData.specialNotes || rawData.notes || ""),
            relationship: String(
              rawData.relationship ||
                editMember?.relationship ||
                prev.relationship,
            ).toUpperCase(),
          }));
        }
      } catch (err) {
        console.error("Failed to load patient details for edit:", err);
      }
    }

    void loadPatientDetails();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, editMember]);

  const set = useCallback(
    (key: keyof RegistrationFormState, value: string) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const markTouched = useCallback(
    (field: string) => setTouched((prev) => ({ ...prev, [field]: true })),
    [],
  );

  const calculatedAge = useMemo(() => {
    if (!form.dateOfBirth) return null;
    const dob = new Date(form.dateOfBirth);
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
    return age >= 0 ? age : null;
  }, [form.dateOfBirth]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Full Name is required";
    if (!form.gender) e.gender = "Gender is required";
    if (!form.dateOfBirth) e.dateOfBirth = "Date of birth is required";
    if (!form.mobileNumber.trim()) e.mobileNumber = "Mobile number is required";
    else if (!/^[\d+\s()-]{7,15}$/.test(form.mobileNumber.trim()))
      e.mobileNumber = "Enter a valid mobile number";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Enter a valid email address";
    if (form.pincode && !/^\d{5,10}$/.test(form.pincode.trim()))
      e.pincode = "Enter a valid pincode";
    if (
      showRelationship &&
      effectiveMode === "PATIENT_FAMILY" &&
      !form.relationship
    )
      e.relationship = "Relationship is required";
    return e;
  }, [form, showRelationship, effectiveMode]);

  const fieldError = (field: string) =>
    touched[field] && errors[field] ? (
      <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1">
        <AlertCircle size={11} /> {errors[field]}
      </p>
    ) : null;

  const fClass = (field: string) =>
    touched[field] && errors[field] ? inputError : inputBase;

  const handleSubmit = useCallback(async () => {
    if (createPatient.isPending) return;
    setTouched({
      fullName: true,
      gender: true,
      dateOfBirth: true,
      mobileNumber: true,
      email: true,
      pincode: true,
      relationship: true,
    });

    const submitErrors: Record<string, string> = {};
    if (!form.fullName.trim()) submitErrors.fullName = "Full Name is required";
    if (!form.gender) submitErrors.gender = "Gender is required";
    if (!form.dateOfBirth)
      submitErrors.dateOfBirth = "Date of birth is required";
    if (!form.mobileNumber.trim())
      submitErrors.mobileNumber = "Mobile number is required";
    else if (!/^[\d+\s()-]{7,15}$/.test(form.mobileNumber.trim()))
      submitErrors.mobileNumber = "Enter a valid mobile number";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      submitErrors.email = "Enter a valid email address";
    if (form.pincode && !/^\d{5,10}$/.test(form.pincode.trim()))
      submitErrors.pincode = "Enter a valid pincode";
    if (
      showRelationship &&
      effectiveMode === "PATIENT_FAMILY" &&
      !form.relationship
    )
      submitErrors.relationship = "Relationship is required";

    if (Object.keys(submitErrors).length > 0) {
      setToast({
        message: "Please fix the validation errors before submitting.",
        type: "error",
      });
      return;
    }

    const regType: RegistrationType =
      effectiveMode === "PATIENT_SELF" || effectiveMode === "PATIENT_FAMILY"
        ? "ONLINE"
        : "WALK_IN";

    const payload: CreatePatientRequest = {
      fullName: form.fullName.trim(),
      gender: form.gender,
      mobileNumber: form.mobileNumber.trim(),
      registrationType: regType,
      relationship: showRelationship
        ? form.relationship ||
          (effectiveMode === "PATIENT_SELF" ? "SELF" : "OTHER")
        : "SELF",
    };

    if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
    if (form.email?.trim()) payload.email = form.email.trim();
    if (form.bloodGroup) payload.bloodGroup = form.bloodGroup;
    if (form.maritalStatus) payload.maritalStatus = form.maritalStatus;
    if (form.nationalId?.trim()) payload.nationalId = form.nationalId.trim();
    if (form.photoUrl?.trim()) payload.photoUrl = form.photoUrl.trim();
    if (form.patientCategory) payload.patientCategory = form.patientCategory;
    if (form.specialNotes?.trim())
      payload.specialNotes = form.specialNotes.trim();

    if (form.knownAllergies?.trim()) {
      payload.knownAllergies = form.knownAllergies
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (form.chronicDiseases?.trim()) {
      payload.chronicDiseases = form.chronicDiseases
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const hasAddress = [
      form.addressLine1,
      form.addressLine2,
      form.city,
      form.state,
      form.pincode,
      form.country,
    ].some((v) => v?.trim());

    if (hasAddress) {
      payload.address = {};
      if (form.addressLine1?.trim())
        payload.address.addressLine1 = form.addressLine1.trim();
      if (form.addressLine2?.trim())
        payload.address.addressLine2 = form.addressLine2.trim();
      if (form.city?.trim()) payload.address.city = form.city.trim();
      if (form.state?.trim()) payload.address.state = form.state.trim();
      if (form.pincode?.trim()) payload.address.pincode = form.pincode.trim();
      if (form.country?.trim()) payload.address.country = form.country.trim();
    }

    if (form.ecName?.trim() && form.ecMobile?.trim()) {
      const ecMobile = form.ecMobile.trim();
      const ecAltMobile = form.ecAltMobile?.trim();
      payload.emergencyContact = {
        name: form.ecName.trim(),
        relationship: form.ecRelationship?.trim() || "OTHER",
        mobileNumber: ecMobile,
        ...(ecAltMobile ? { alternativeMobileNumber: ecAltMobile } : {}),
      };
    }

    try {
      const rawPortal = portal as unknown as {
        patient?: { mrn?: string };
        primaryMrn?: string;
      };
      const rawUser = user as unknown as {
        mrn?: string;
        patientMrn?: string;
        id?: string | number;
      };
      const primaryMrn = String(
        primaryPatientMrn ||
          rawPortal?.patient?.mrn ||
          portal?.primaryMrn ||
          rawUser?.mrn ||
          rawUser?.patientMrn ||
          user?.patientId ||
          "",
      );
      let mrn = "";

      if (isEditMode) {
        const targetMrn = editMember?.mrn;
        if (!targetMrn) {
          throw new Error("Patient MRN is missing for edit operation.");
        }

        const updatePayload: Record<string, unknown> = {
          fullName: payload.fullName,
          gender: payload.gender || "MALE",
          dateOfBirth: payload.dateOfBirth || todayStr,
          bloodGroup: payload.bloodGroup || "A_POSITIVE",
          mobileNumber: payload.mobileNumber,
          phone: payload.mobileNumber,
          maritalStatus: payload.maritalStatus || "SINGLE",
          patientCategory: payload.patientCategory || "GENERAL",
          registrationType: payload.registrationType || "WALK_IN",
          knownAllergies: payload.knownAllergies || [],
          chronicDiseases: payload.chronicDiseases || [],
          specialNotes: payload.specialNotes || "",
          changeReason: "Updated via Patient Portal Family Management",
        };

        if (payload.email?.trim()) {
          updatePayload.email = payload.email.trim();
        }
        if (payload.nationalId?.trim()) {
          updatePayload.nationalId = payload.nationalId.trim();
        }
        if (payload.photoUrl?.trim()) {
          updatePayload.photoUrl = payload.photoUrl.trim();
        }
        if (payload.address) {
          updatePayload.address = payload.address;
        }

        if (payload.emergencyContact) {
          const ec: Record<string, string> = {
            name: payload.emergencyContact.name,
            relationship: payload.emergencyContact.relationship,
            mobileNumber: payload.emergencyContact.mobileNumber,
            phone: payload.emergencyContact.mobileNumber,
          };
          if (payload.emergencyContact.alternativeMobileNumber?.trim()) {
            ec.alternativeMobileNumber =
              payload.emergencyContact.alternativeMobileNumber.trim();
          }
          updatePayload.emergencyContact = ec;
        } else if (form.ecName?.trim() && form.ecMobile?.trim()) {
          const ec: Record<string, string> = {
            name: form.ecName.trim(),
            relationship: form.ecRelationship || "OTHER",
            mobileNumber: form.ecMobile.trim(),
            phone: form.ecMobile.trim(),
          };
          if (form.ecAltMobile?.trim()) {
            ec.alternativeMobileNumber = form.ecAltMobile.trim();
          }
          updatePayload.emergencyContact = ec;
        }

        try {
          await patientsApi.updatePatient(targetMrn, updatePayload);
        } catch (err: unknown) {
          console.warn(
            "[RegisterPatientScreen] patientsApi.updatePatient failed, falling back to direct PUT:",
            err,
          );
          await apiClient.put(
            `/api/v1/patients/${encodeURIComponent(targetMrn)}`,
            updatePayload,
          );
        }

        mrn = targetMrn;
      } else if (effectiveMode === "PATIENT_SELF" && primaryMrn) {
        try {
          const updated = await patientsApi.updatePatient(primaryMrn, {
            ...payload,
          });
          mrn = updated.mrn || primaryMrn;
        } catch (err) {
          console.log(err);
          const created = (await createPatient.mutateAsync(payload)) as {
            mrn?: string;
            MRNId?: string;
          };
          mrn = created.mrn || created.MRNId || primaryMrn;
        }
      } else if (effectiveMode === "PATIENT_FAMILY" && primaryMrn) {
        const primaryUserId = user?.id;
        if (!primaryUserId) {
          throw new Error("Primary user ID not found. Please try again.");
        }

        const created = (await createPatient.mutateAsync(payload)) as Record<
          string,
          unknown
        >;
        const raw = (created.data as Record<string, unknown>) || created;
        const patientData = (raw.data as Record<string, unknown>) || raw;

        const familyMrn = String(
          patientData.mrn || patientData.MRNId || patientData.patientMrn || "",
        ).trim();

        const familyUserId =
          patientData.userId ||
          patientData.patientUserId ||
          patientData.id ||
          null;

        if (!familyMrn) {
          throw new Error(
            "Failed to create family member patient record. Please try again.",
          );
        }

        if (familyUserId) {
          const member = await patientsApi.linkFamilyMember(
            primaryUserId,
            Number(familyUserId),
            payload.relationship || "OTHER",
          );
          if (!member) {
            console.warn(
              "[RegisterPatient] linkFamilyMember returned null, but patient was created. Proceeding with success.",
            );
          }
        } else {
          console.warn(
            "[RegisterPatient] No familyUserId available to link. Patient was created.",
          );
        }

        mrn = familyMrn;
      } else {
        const created = (await createPatient.mutateAsync(payload)) as {
          mrn?: string;
          MRNId?: string;
        };
        mrn = created.mrn || created.MRNId || "";
      }

      setSuccessData({
        mrn,
        name: form.fullName.trim(),
      });
      onRegistered?.({
        mrn,
        patientName: form.fullName.trim(),
        relationship: showRelationship ? form.relationship : undefined,
        gender: form.gender,
        mobileNumber: form.mobileNumber.trim(),
      });
      portal?.refresh();
    } catch (err: unknown) {
      setToast({
        message:
          err instanceof Error
            ? err.message
            : isEditMode
              ? "Failed to update patient details. Please try again."
              : "Failed to register patient. Please try again.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }, [
    form,
    createPatient,
    showRelationship,
    effectiveMode,
    onRegistered,
    primaryPatientMrn,
    portal,
    user,
    isEditMode,
    editMember,
  ]);

  const handleClear = useCallback(() => {
    setForm({
      ...INITIAL_FORM,
      relationship: initialRelationship,
      ...(isSelfRegistration
        ? {
            fullName: user?.fullName || user?.name || "",
            email: user?.email || "",
            mobileNumber:
              user?.mobile || user?.phone || user?.mobileNumber || "",
            dateOfBirth: user?.dateOfBirth || user?.dob || "",
            gender: user?.gender || "",
          }
        : {}),
    });
    setTouched({});
  }, [initialRelationship, isSelfRegistration, user]);

  return (
    <div className="flex-1 min-h-screen bg-[#F4F6F9] overflow-y-auto">
      {successData && (
        <RegistrationSuccessDialog
          mrn={successData.mrn}
          patientName={successData.name}
          isFamilyMode={effectiveMode === "PATIENT_FAMILY"}
          onBookAppointment={onBookAppointment}
          onViewProfile={onViewProfile}
          onSwitchToNewPatient={onSwitchToNewPatient}
          onClose={() => {
            setSuccessData(null);
            onBack?.();
          }}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-350 mx-auto px-6 py-6">
        <div className="mb-7">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 mb-4 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-all cursor-pointer"
            style={{ fontFamily: RB }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <h1
            className="text-2xl font-bold text-[#111827] mb-1"
            style={{ fontFamily: PP }}
          >
            {isEditMode
              ? "Edit Family Member"
              : effectiveMode === "PATIENT_FAMILY"
                ? "Add Family Member"
                : "Patient Registration"}
          </h1>
          <p className="text-sm text-slate-500" style={{ fontFamily: RB }}>
            {isEditMode
              ? "Update family member details under your patient account."
              : effectiveMode === "PATIENT_FAMILY"
                ? "Register a new family member under your patient account."
                : "Create a new patient record for hospital services."}
          </p>
        </div>

        <div className="max-w-full">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {/* 1. PERSONAL INFORMATION */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 md:p-7">
              <SectionHeader
                icon={User}
                title="Personal Information"
                subtitle="Enter the patient's personal and contact details"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {showRelationship && (
                  <div className="md:col-span-2">
                    <label className={labelBase}>
                      Relationship to Account Holder{" "}
                      <span className="text-red-500">*</span>
                      <select
                        value={form.relationship}
                        onChange={(e) => set("relationship", e.target.value)}
                        onBlur={() => markTouched("relationship")}
                        className={fClass("relationship")}
                      >
                        {effectiveMode === "PATIENT_FAMILY" && (
                          <option value="">Select Relationship</option>
                        )}
                        <option value="SELF">Self</option>
                        <option value="FATHER">Father</option>
                        <option value="MOTHER">Mother</option>
                        <option value="WIFE">Spouse</option>
                        <option value="SON">Son</option>
                        <option value="DAUGHTER">Daughter</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </label>
                    {fieldError("relationship")}
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className={labelBase}>
                    Full Name <span className="text-red-500">*</span>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => set("fullName", e.target.value)}
                      onBlur={() => markTouched("fullName")}
                      placeholder="e.g. Eleanor Vance"
                      className={fClass("fullName")}
                    />
                  </label>
                  {fieldError("fullName")}
                </div>

                <div>
                  <label className={labelBase}>
                    Gender <span className="text-red-500">*</span>
                    <select
                      value={form.gender}
                      onChange={(e) => set("gender", e.target.value)}
                      onBlur={() => markTouched("gender")}
                      className={fClass("gender")}
                    >
                      {GENDERS.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {fieldError("gender")}
                </div>

                <div>
                  <label className={labelBase}>
                    Date of Birth <span className="text-red-500">*</span>
                    <CustomDatePicker
                      value={form.dateOfBirth}
                      onChange={(val) => set("dateOfBirth", val)}
                      maxDate={todayStr}
                      error={
                        touched.dateOfBirth ? errors.dateOfBirth : undefined
                      }
                      inputClassName={fClass("dateOfBirth")}
                    />
                  </label>
                </div>

                <div>
                  <label className={labelBase}>
                    Age{" "}
                    <span className="text-slate-400 font-normal">
                      (Auto Calculated)
                    </span>
                    <input
                      type="text"
                      value={
                        calculatedAge !== null
                          ? `${calculatedAge} year${calculatedAge !== 1 ? "s" : ""}`
                          : "—"
                      }
                      disabled
                      className={inputDisabled}
                    />
                  </label>
                </div>

                <div>
                  <label className={labelBase}>
                    Mobile Number <span className="text-red-500">*</span>
                    <input
                      type="tel"
                      value={form.mobileNumber}
                      onChange={(e) => set("mobileNumber", e.target.value)}
                      onBlur={() => markTouched("mobileNumber")}
                      placeholder="+91 98765 43210"
                      className={fClass("mobileNumber")}
                    />
                  </label>
                  {fieldError("mobileNumber")}
                </div>

                <div>
                  <label className={labelBase}>
                    Email Address
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      onBlur={() => markTouched("email")}
                      placeholder="patient@example.com"
                      className={fClass("email")}
                    />
                  </label>
                  {fieldError("email")}
                </div>

                <div>
                  <label className={labelBase}>
                    Blood Group *
                    <select
                      value={form.bloodGroup}
                      onChange={(e) => set("bloodGroup", e.target.value)}
                      disabled={readOnlyField("bloodGroup")}
                      className={
                        readOnlyField("bloodGroup") ? inputDisabled : inputBase
                      }
                    >
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg.value} value={bg.value}>
                          {bg.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label className={labelBase}>
                    Marital Status
                    <select
                      value={form.maritalStatus}
                      onChange={(e) => set("maritalStatus", e.target.value)}
                      disabled={readOnlyField("maritalStatus")}
                      className={
                        readOnlyField("maritalStatus")
                          ? inputDisabled
                          : inputBase
                      }
                    >
                      {MARITAL_STATUSES.map((ms) => (
                        <option key={ms.value} value={ms.value}>
                          {ms.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label className={labelBase}>
                    Aadhar Number
                    <input
                      type="text"
                      value={form.nationalId}
                      onChange={(e) => set("nationalId", e.target.value)}
                      placeholder="Aadhar Number"
                      className={inputBase}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* 2. ADDRESS INFORMATION */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 md:p-7">
              <SectionHeader
                icon={MapPin}
                title="Address Information"
                subtitle="Patient's residential address details"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div className="md:col-span-2">
                  <label className={labelBase}>
                    Address Line 1
                    <input
                      type="text"
                      value={form.addressLine1}
                      onChange={(e) => set("addressLine1", e.target.value)}
                      placeholder="House / Flat No., Building, Street"
                      className={inputBase}
                    />
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className={labelBase}>
                    Address Line 2
                    <input
                      type="text"
                      value={form.addressLine2}
                      onChange={(e) => set("addressLine2", e.target.value)}
                      placeholder="Landmark, Cross Street"
                      className={inputBase}
                    />
                  </label>
                </div>

                <div>
                  <label className={labelBase}>
                    City
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                      placeholder="City Name"
                      className={inputBase}
                    />
                  </label>
                </div>

                <div>
                  <label className={labelBase}>
                    State
                    <select
                      value={form.state}
                      onChange={(e) => set("state", e.target.value)}
                      className={inputBase}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label className={labelBase}>
                    Pincode
                    <input
                      type="text"
                      value={form.pincode}
                      onChange={(e) => set("pincode", e.target.value)}
                      onBlur={() => markTouched("pincode")}
                      placeholder="6-digit Pincode"
                      maxLength={6}
                      className={fClass("pincode")}
                    />
                  </label>
                  {fieldError("pincode")}
                </div>

                <div>
                  <label className={labelBase}>
                    Country
                    <input
                      type="text"
                      value={form.country}
                      onChange={(e) => set("country", e.target.value)}
                      className={inputBase}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* 3. EMERGENCY CONTACT */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 md:p-7">
              <SectionHeader
                icon={Shield}
                title="Emergency Contact"
                subtitle="Person to be contacted in case of an emergency"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <label className={labelBase}>
                    Emergency Contact Name
                    <input
                      type="text"
                      value={form.ecName}
                      onChange={(e) => set("ecName", e.target.value)}
                      placeholder="Full name of emergency contact"
                      className={inputBase}
                    />
                  </label>
                </div>

                <div>
                  <label className={labelBase}>
                    Relationship
                    <select
                      value={form.ecRelationship}
                      onChange={(e) => set("ecRelationship", e.target.value)}
                      className={inputBase}
                    >
                      {RELATIONSHIPS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div>
                  <label className={labelBase}>
                    Mobile Number
                    <input
                      type="tel"
                      value={form.ecMobile}
                      onChange={(e) => set("ecMobile", e.target.value)}
                      placeholder="+91 98765 00000"
                      className={inputBase}
                    />
                  </label>
                </div>

                <div>
                  <label className={labelBase}>
                    Alternative Contact Number
                    <input
                      type="tel"
                      value={form.ecAltMobile}
                      onChange={(e) => set("ecAltMobile", e.target.value)}
                      placeholder="Landline or Secondary Mobile"
                      className={inputBase}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* 4. REGISTRATION DETAILS */}

            {/* 5. MEDICAL ALERTS & NOTES */}
            {!hideField("knownAllergies") && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 md:p-7">
                <SectionHeader
                  icon={AlertCircle}
                  title="Medical Alerts & Notes"
                  subtitle="Allergies, chronic conditions, and additional info"
                />

                <div className="grid grid-cols-1 gap-y-5">
                  <div>
                    <label className={labelBase}>
                      Known Allergies
                      <input
                        type="text"
                        value={form.knownAllergies}
                        onChange={(e) => set("knownAllergies", e.target.value)}
                        placeholder="e.g. Penicillin, Peanuts, Latex"
                        className={inputBase}
                      />
                    </label>
                  </div>

                  <div>
                    <label className={labelBase}>
                      Chronic Diseases
                      <input
                        type="text"
                        value={form.chronicDiseases}
                        onChange={(e) => set("chronicDiseases", e.target.value)}
                        placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                        className={inputBase}
                      />
                    </label>
                  </div>

                  <div>
                    <label className={labelBase}>
                      Special Notes
                      <textarea
                        rows={3}
                        value={form.specialNotes}
                        onChange={(e) => set("specialNotes", e.target.value)}
                        placeholder="e.g. Requires wheelchair assistance, prefers afternoon slots"
                        className={inputBase + " resize-none"}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* BOTTOM ACTION BAR */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                style={{ fontFamily: PP }}
              >
                <ArrowLeft size={14} />
                Cancel / Back
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                style={{ fontFamily: PP }}
              >
                <RotateCcw size={14} />
                Clear Form
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || createPatient.isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0D47A1] text-white text-sm font-semibold hover:bg-[#0c3d8a] transition-colors shadow-md shadow-[#0D47A1]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontFamily: PP }}
              >
                {submitting || createPatient.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {isEditMode ? "Updating…" : "Registering…"}
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    {isEditMode
                      ? "Update Family Member"
                      : effectiveMode === "PATIENT_FAMILY"
                        ? "Register Family Member"
                        : "Register Patient & Generate MRN"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
