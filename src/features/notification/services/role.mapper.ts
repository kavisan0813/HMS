import type { UserRole } from "../types/notifications.types";

const ROLE_MAP: Record<string, UserRole> = {
  HOSPITAL_ADMIN: "Hospital Admin",
  ADMIN: "Hospital Admin",
  SUPER_ADMIN: "Hospital Admin",
  "SUPER-ADMIN": "Hospital Admin",
  ROLE_ADMIN: "Hospital Admin",
  ROLE_HOSPITAL_ADMIN: "Hospital Admin",
  ROLE_SUPER_ADMIN: "Hospital Admin",
  DOCTOR: "Doctor",
  ROLE_DOCTOR: "Doctor",
  RECEPTIONIST: "Receptionist",
  ROLE_RECEPTIONIST: "Receptionist",
  ACCOUNTANT: "Accountant",
  ROLE_ACCOUNTANT: "Accountant",
  NURSE: "Nurse",
  ROLE_NURSE: "Nurse",
  PATIENT: "Patient Portal",
  ROLE_PATIENT: "Patient Portal",
  PATIENT_PORTAL: "Patient Portal",
  "Patient Portal": "Patient Portal",
  "Hospital Admin": "Hospital Admin",
  Doctor: "Doctor",
  Receptionist: "Receptionist",
  Accountant: "Accountant",
  Nurse: "Nurse",
};

export function normalizeRole(role: string | undefined): UserRole {
  if (!role) return "Hospital Admin";
  const trimmed = String(role).trim();
  const cleaned = trimmed
    .toUpperCase()
    .replace(/^ROLE_/, "")
    .replace(/[\s-]+/g, "_");

  return (
    ROLE_MAP[cleaned] ??
    ROLE_MAP[trimmed.toUpperCase()] ??
    ROLE_MAP[trimmed] ??
    "Hospital Admin"
  );
}
