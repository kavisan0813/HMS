const HOSPITAL_BRANDING_STORAGE_KEY = "hms.hospital.branding:v1";
export const HOSPITAL_BRANDING_CHANGED_EVENT = "hms:hospital-branding-changed";

export interface StoredHospitalBranding {
  logoUrl?: string;
}

export function getStoredHospitalBranding(): StoredHospitalBranding {
  if (typeof window === "undefined") return {};

  try {
    const value = window.localStorage.getItem(HOSPITAL_BRANDING_STORAGE_KEY);
    if (!value) return {};
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object"
      ? (parsed as StoredHospitalBranding)
      : {};
  } catch (err) {
    console.log(err);
    return {};
  }
}

export function publishHospitalBranding(
  branding: StoredHospitalBranding,
): void {
  if (typeof window === "undefined") return;

  const next: StoredHospitalBranding = {
    logoUrl: branding.logoUrl,
  };

  if (next.logoUrl) {
    window.localStorage.setItem(
      HOSPITAL_BRANDING_STORAGE_KEY,
      JSON.stringify(next),
    );
  } else {
    window.localStorage.removeItem(HOSPITAL_BRANDING_STORAGE_KEY);
  }

  window.dispatchEvent(
    new CustomEvent(HOSPITAL_BRANDING_CHANGED_EVENT, { detail: next }),
  );
}
