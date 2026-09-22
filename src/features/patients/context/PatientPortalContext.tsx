/**
 * PatientPortalContext – Shared patient portal state.
 * Loads the logged-in patient's family members (GET /api/v1/patients/my),
 * tracks the currently active patient (self or switched family member),
 * and persists the active MRN in localStorage so all patient screens
 * stay in sync with the Header profile switcher and the My Profile page.
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuthStore } from "../../auth/store/auth.store";
import { patientsApi } from "../api/patient.api";
import type { FamilyMember } from "../pages/FamilyMembersManagement";
import {
  PatientPortalContext,
  SWITCH_ACCOUNT_STORAGE_KEY,
  type PatientPortalContextValue,
} from "./PatientPortalContext";

export type { PatientPortalContextValue };

interface PatientPortalPayload {
  name?: string;
  id?: string | number;
  mrn?: string;
  patientName?: string;
  fullName?: string;
  relationship?: string;
  age?: number;
  dateOfBirth?: string;
  dob?: string;
  gender?: string;
  mobileNumber?: string;
  phone?: string;
  registeredMobile?: string;
  email?: string;
  photoUrl?: string;
  photo?: string;
  address?: unknown;
  lastAppointment?: string;
  lastVisit?: string;
  lastVisitDate?: string;
  lastConsultationDate?: string;
  upcomingAppointmentsCount?: number;
  pendingBillsCount?: number;
  pendingBillsAmount?: number;
  activePrescriptionsCount?: number;
  knownAllergies?: string[];
  allergies?: string[];
}

function calculateAge(dob?: string, ageVal?: number): number {
  if (typeof ageVal === "number" && ageVal > 0) return ageVal;
  if (!dob) return 0;
  try {
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return 0;
    const today = new Date();
    let computedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      computedAge--;
    }
    return Math.max(0, computedAge);
  } catch (err) {
    console.log(err);
    return 0;
  }
}

function mapApiToFamilyMember(
  p: PatientPortalPayload,
  currentUser?: {
    fullName?: string;
    name?: string;
    mrn?: string;
    patientId?: string | null;
  } | null,
): FamilyMember {
  let customSaved: Record<string, unknown> = {};
  try {
    const keys = [
      p.mrn,
      p.id,
      currentUser?.mrn,
      currentUser?.patientId,
      "me",
    ].filter(Boolean);
    for (const k of keys) {
      const stored = localStorage.getItem(`patient_profile_custom_${k}`);
      if (stored) {
        customSaved = { ...customSaved, ...JSON.parse(stored) };
      }
    }
  } catch (err) {
    console.log(err);
    // Ignore
  }

  const isSelf =
    String(p.relationship).toUpperCase() === "SELF" ||
    (currentUser?.mrn && p.mrn === currentUser.mrn) ||
    (currentUser?.patientId && p.mrn === currentUser.patientId);

  const primaryName = (
    (customSaved.name as string) ||
    currentUser?.fullName ||
    currentUser?.name ||
    ""
  ).trim();

  let resolvedName =
    (customSaved.name as string) || p.patientName || p.fullName || p.name || "";

  if (isSelf) {
    resolvedName = resolvedName || primaryName || "Patient";
  } else {
    const relStr = p.relationship
      ? String(p.relationship).charAt(0).toUpperCase() +
        String(p.relationship).slice(1).toLowerCase()
      : "Member";

    if (
      !resolvedName ||
      (primaryName &&
        resolvedName.toLowerCase().trim() === primaryName.toLowerCase().trim())
    ) {
      const baseName = resolvedName || primaryName || "Family Member";
      resolvedName = `${baseName} (${relStr})`;
    }
  }

  return {
    id: String(p.id ?? p.mrn ?? Math.random()),
    patientName: resolvedName,
    name: resolvedName,
    mrn: p.mrn || "",
    relationship: (p.relationship as FamilyMember["relationship"]) || "Self",
    dateOfBirth: p.dateOfBirth || p.dob || "",
    age: calculateAge(p.dateOfBirth || p.dob, p.age),
    gender: (p.gender as FamilyMember["gender"]) || "Other",
    registeredMobile:
      (customSaved.phone as string) ||
      p.registeredMobile ||
      p.mobileNumber ||
      p.phone ||
      "",
    verificationStatus: "Verified",
    patientStatus: "Active",
    lastAppointment:
      p.lastAppointment ||
      p.lastVisit ||
      p.lastVisitDate ||
      p.lastConsultationDate ||
      "",
    upcomingAppointmentsCount: p.upcomingAppointmentsCount ?? 0,
    pendingBillsCount: p.pendingBillsCount ?? 0,
    pendingBillsAmount: p.pendingBillsAmount ?? 0,
    activePrescriptionsCount: p.activePrescriptionsCount ?? 0,
    knownAllergies: p.knownAllergies || p.allergies || [],
  };
}

export function PatientPortalProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isPatient = String(user?.role ?? "").toUpperCase() === "PATIENT";
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [activePatient, setActivePatient] = useState<FamilyMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!isPatient) return;
    let cancelled = false;
    setIsLoading(true);
    patientsApi
      .getMyPatients()
      .then((data) => {
        if (cancelled) return;
        const mapped: FamilyMember[] = (Array.isArray(data) ? data : []).map(
          (p) => mapApiToFamilyMember(p as PatientPortalPayload, user),
        );
        const self = mapped.find(
          (member) => String(member.relationship).toUpperCase() === "SELF",
        );
        const primary =
          self || mapped.find((member) => member.mrn === user?.patientId);

        setFamilyMembers(mapped);
        const storedMrn = localStorage.getItem(SWITCH_ACCOUNT_STORAGE_KEY);
        setActivePatient((prev) => {
          return (
            mapped.find((m) => String(m.mrn) === storedMrn) ||
            (prev && mapped.some((m) => String(m.mrn) === String(prev.mrn))
              ? prev
              : primary || mapped[0]) ||
            null
          );
        });
      })
      .catch(() => {
        if (cancelled) return;
        setFamilyMembers([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isPatient, user]);

  useEffect(() => {
    let cancelled = false;

    const loadPortal = async () => {
      if (!isPatient) return;
      try {
        const data = await patientsApi.getMyPatients();
        if (cancelled) return;
        const mapped: FamilyMember[] = (Array.isArray(data) ? data : []).map(
          (p) => mapApiToFamilyMember(p as PatientPortalPayload, user),
        );
        const self = mapped.find(
          (member) => String(member.relationship).toUpperCase() === "SELF",
        );
        const primary =
          self || mapped.find((member) => member.mrn === user?.patientId);

        setFamilyMembers(mapped);
        const storedMrn = localStorage.getItem(SWITCH_ACCOUNT_STORAGE_KEY);
        setActivePatient((prev) => {
          return (
            mapped.find((m) => String(m.mrn) === storedMrn) ||
            (prev && mapped.some((m) => String(m.mrn) === String(prev.mrn))
              ? prev
              : primary || mapped[0]) ||
            null
          );
        });
      } catch (err) {
        console.log(err);
        if (!cancelled) setFamilyMembers([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadPortal();

    return () => {
      cancelled = true;
    };
  }, [isPatient, user]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SWITCH_ACCOUNT_STORAGE_KEY) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  const switchToPatient = useCallback((member: FamilyMember) => {
    const mrn = member.mrn || String(member.id);
    if (mrn) localStorage.setItem(SWITCH_ACCOUNT_STORAGE_KEY, mrn);
    setActivePatient(member);
  }, []);

  const value = useMemo<PatientPortalContextValue>(
    () => ({
      familyMembers,
      activePatient,
      activeMrn: activePatient?.mrn || null,
      primaryMrn:
        familyMembers.find(
          (member) => String(member.relationship).toUpperCase() === "SELF",
        )?.mrn ||
        user?.patientId ||
        null,
      isLoading,
      switchToPatient,
      refresh,
    }),
    [
      familyMembers,
      activePatient,
      user?.patientId,
      isLoading,
      switchToPatient,
      refresh,
    ],
  );

  return (
    <PatientPortalContext.Provider value={value}>
      {children}
    </PatientPortalContext.Provider>
  );
}
