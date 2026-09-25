import { apiClient } from "../../../lib/axios";
import type {
  HospitalAddress,
  HospitalAdministrative,
  HospitalBranding,
  HospitalConfiguration,
  HospitalConfigurationPayload,
  HospitalContact,
  HospitalInformationForm,
  HospitalOperationalDetails,
  HospitalSocialChannels,
  PrintHeaderPreview,
  UploadResponse,
  OpdBreak,
  OpdHoliday,
  OpdHolidayPayload,
  OpdWeeklySchedule,
} from "../types/settings.types";

// ─── Envelope unwrapping ───

interface ApiEnvelope<T> {
  data: T;
}

function unwrap<T>(response: { data: unknown }): T {
  const body = response.data;
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

// ─── HTTP layer: /api/v1/admin/hospital/configuration ───

export async function fetchHospitalConfiguration(): Promise<HospitalConfiguration> {
  const res = await apiClient.get<ApiEnvelope<HospitalConfiguration>>(
    "/api/v1/admin/hospital/configuration",
  );
  return unwrap<HospitalConfiguration>(res);
}

export async function saveHospitalConfiguration(
  payload: HospitalConfigurationPayload,
): Promise<void> {
  await apiClient.put<ApiEnvelope<unknown>>(
    "/api/v1/admin/hospital/configuration",
    payload,
  );
}

export async function uploadHospitalLogo(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<ApiEnvelope<UploadResponse>>(
    "/api/v1/admin/hospital/configuration/logo",
    formData,
  );
  return unwrap<UploadResponse>(res);
}

export async function uploadHospitalHeaderBanner(
  file: File,
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<ApiEnvelope<UploadResponse>>(
    "/api/v1/admin/hospital/configuration/header-banner",
    formData,
  );
  return unwrap<UploadResponse>(res);
}

export function getUploadedFileUrl(result: UploadResponse): string {
  const candidates = [
    result.logoUrl,
    result.headerBannerUrl,
    result.url,
    result.fileUrl,
    result.path,
    result.filePath,
    result.uploadUrl,
    result.publicUrl,
    result.location,
  ];
  const direct = candidates.find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
  if (direct) return direct.trim();

  // Accept backend upload DTOs that wrap the URL in an arbitrary data object.
  for (const value of Object.values(result)) {
    if (value && typeof value === "object") {
      const nested = getUploadedFileUrl(value as UploadResponse);
      if (nested) return nested;
    }
  }
  return "";
}

export function isUsableMediaUrl(value: string | undefined): value is string {
  if (!value?.trim()) return false;
  try {
    const url = new URL(value, window.location.origin);
    return !["cdn.example.com", "hospital.com"].includes(url.hostname);
  } catch (err) {
    console.log(err);
    return false;
  }
}

export async function fetchPrintHeaderPreview(): Promise<PrintHeaderPreview> {
  const res = await apiClient.get<ApiEnvelope<PrintHeaderPreview>>(
    "/api/v1/admin/hospital/configuration/print-header",
  );
  return unwrap<PrintHeaderPreview>(res);
}

export async function resetHospitalConfiguration(): Promise<void> {
  await apiClient.post<ApiEnvelope<unknown>>(
    "/api/v1/admin/hospital/configuration/reset",
    { confirm: true },
  );
}

export async function updateOpdBreaks(payload: {
  dayOfWeek: string;
  breaks: OpdBreak[];
}): Promise<OpdWeeklySchedule> {
  const res = await apiClient.put<ApiEnvelope<OpdWeeklySchedule>>(
    "/api/v1/admin/opd/breaks",
    payload,
  );
  return unwrap<OpdWeeklySchedule>(res);
}

export async function fetchOpdHolidays(year: number): Promise<OpdHoliday[]> {
  const res = await apiClient.get<ApiEnvelope<OpdHoliday[]>>(
    `/api/v1/admin/opd/holidays?year=${year}`,
  );
  return unwrap<OpdHoliday[]>(res);
}

export async function createOpdHoliday(
  payload: OpdHolidayPayload,
): Promise<OpdHoliday> {
  const res = await apiClient.post<ApiEnvelope<OpdHoliday>>(
    "/api/v1/admin/opd/holidays",
    payload,
  );
  return unwrap<OpdHoliday>(res);
}

export async function updateOpdHoliday(
  id: number,
  payload: OpdHolidayPayload,
): Promise<OpdHoliday> {
  const res = await apiClient.put<ApiEnvelope<OpdHoliday>>(
    `/api/v1/admin/opd/holidays/${id}`,
    payload,
  );
  return unwrap<OpdHoliday>(res);
}

export async function updateOpdHolidayStatus(
  id: number,
  status: "ACTIVE" | "INACTIVE",
): Promise<OpdHoliday> {
  const res = await apiClient.patch<ApiEnvelope<OpdHoliday>>(
    `/api/v1/admin/opd/holidays/${id}/status`,
    { status },
  );
  return unwrap<OpdHoliday>(res);
}

export async function fetchOpdWeeklySchedule(): Promise<OpdWeeklySchedule> {
  const res = await apiClient.get<ApiEnvelope<OpdWeeklySchedule>>(
    "/api/v1/admin/opd/weekly-schedule",
  );
  return unwrap<OpdWeeklySchedule>(res);
}

export async function saveOpdWeeklySchedule(
  payload: OpdWeeklySchedule,
): Promise<OpdWeeklySchedule> {
  const res = await apiClient.put<ApiEnvelope<OpdWeeklySchedule>>(
    "/api/v1/admin/opd/weekly-schedule",
    payload,
  );
  return unwrap<OpdWeeklySchedule>(res);
}

// ─── DTO ↔ form mapping ───

export function mapConfigurationToForm(
  config: HospitalConfiguration,
): HospitalInformationForm {
  const branding = (config.branding ?? {}) as HospitalBranding;
  const contact = (config.contact ?? {}) as HospitalContact;
  const address = (config.address ?? {}) as HospitalAddress;
  const operational = (config.operationalDetails ??
    {}) as HospitalOperationalDetails;
  const social = (config.socialChannels ?? {}) as HospitalSocialChannels;
  const administrative = (config.administrative ??
    {}) as HospitalAdministrative;

  return {
    hospitalName: branding.legalName ?? "",
    hospitalShortName: branding.shortName ?? "",
    hospitalTagline: branding.tagline ?? "",
    registrationNumber: branding.registrationNumber ?? "",
    licenseNumber: branding.licenseNumber ?? "",
    logoUrl: isUsableMediaUrl(branding.logoUrl) ? branding.logoUrl : "",
    bannerUrl: isUsableMediaUrl(branding.headerBannerUrl)
      ? branding.headerBannerUrl
      : "",
    primaryPhone: contact.primaryPhone ?? "",
    secondaryPhone: contact.secondaryPhone ?? "",
    emergencyPhone: contact.emergencyHotline ?? "",
    officialEmail: contact.officialEmail ?? "",
    website: contact.officialWebsite ?? "",
    supportEmail: contact.supportEmail ?? "",
    workingHours: contact.workingHours ?? "",
    is24x7: contact.emergency24x7 ?? false,
    addressLine1: address.addressLine1 ?? "",
    addressLine2: address.addressLine2 ?? "",
    city: address.city ?? "",
    district: address.district ?? "",
    state: address.state ?? "",
    country: address.country ?? "",
    postalCode: address.postalCode ?? "",
    mapUrl: address.googleMapUrl ?? "",
    hospitalType: operational.hospitalType ?? "",
    ownership: operational.ownershipStructure ?? "",
    establishedYear: operational.establishedYear
      ? String(operational.establishedYear)
      : "",
    numDepartments: operational.activeDepartments
      ? String(operational.activeDepartments)
      : "",
    numDoctors: operational.registeredDoctors
      ? String(operational.registeredDoctors)
      : "",
    numConsultationRooms: operational.consultationRooms
      ? String(operational.consultationRooms)
      : "",
    facebook: social.facebookUrl ?? "",
    linkedin: social.linkedinUrl ?? "",
    instagram: social.instagramUrl ?? "",
    youtube: "",
    whatsapp: social.whatsappNumber ?? "",
    internalNotes: administrative.internalNotes ?? "",
  };
}

export function mapFormToConfiguration(
  form: HospitalInformationForm,
): HospitalConfigurationPayload {
  const toNumber = (value: string): number | undefined => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && value.trim() !== "" ? parsed : undefined;
  };

  return {
    branding: {
      legalName: form.hospitalName,
      shortName: form.hospitalShortName,
      tagline: form.hospitalTagline || undefined,
      registrationNumber: form.registrationNumber || undefined,
      licenseNumber: form.licenseNumber,
    },
    contact: {
      primaryPhone: form.primaryPhone,
      secondaryPhone: form.secondaryPhone || undefined,
      emergencyHotline: form.emergencyPhone || undefined,
      officialEmail: form.officialEmail,
      officialWebsite: form.website || undefined,
      supportEmail: form.supportEmail || undefined,
      workingHours: form.workingHours || undefined,
      emergency24x7: form.is24x7,
    },
    address: {
      addressLine1: form.addressLine1 || undefined,
      addressLine2: form.addressLine2 || undefined,
      city: form.city || undefined,
      district: form.district || undefined,
      state: form.state || undefined,
      country: form.country || undefined,
      postalCode: form.postalCode || undefined,
      googleMapUrl: form.mapUrl || undefined,
    },
    operationalDetails: {
      hospitalType: form.hospitalType || undefined,
      ownershipStructure: form.ownership || undefined,
      establishedYear: toNumber(form.establishedYear),
      activeDepartments: toNumber(form.numDepartments),
      registeredDoctors: toNumber(form.numDoctors),
      consultationRooms: toNumber(form.numConsultationRooms),
    },
    socialChannels: {
      whatsappNumber: form.whatsapp || undefined,
      facebookUrl: form.facebook || undefined,
      linkedinUrl: form.linkedin || undefined,
      instagramUrl: form.instagram || undefined,
    },
    administrative: {
      internalNotes: form.internalNotes || undefined,
    },
  };
}
