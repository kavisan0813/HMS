// ─── Hospital Configuration DTOs (backend: /api/v1/admin/hospital/configuration) ───

export interface HospitalBranding {
  logoUrl?: string;
  headerBannerUrl?: string;
  legalName: string;
  shortName: string;
  tagline?: string;
  registrationNumber?: string;
  licenseNumber?: string;
}

export interface HospitalContact {
  primaryPhone: string;
  secondaryPhone?: string;
  emergencyHotline?: string;
  officialEmail: string;
  officialWebsite?: string;
  supportEmail?: string;
  workingHours?: string;
  emergency24x7?: boolean;
}

export interface HospitalAddress {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  googleMapUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface HospitalOperationalDetails {
  hospitalType?: string;
  ownershipStructure?: string;
  establishedYear?: number;
  activeDepartments?: number;
  registeredDoctors?: number;
  consultationRooms?: number;
}

export interface HospitalSocialChannels {
  whatsappNumber?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
}

export interface HospitalAdministrative {
  internalNotes?: string;
}

export interface HospitalConfiguration {
  branding?: HospitalBranding;
  contact?: HospitalContact;
  address?: HospitalAddress;
  operationalDetails?: HospitalOperationalDetails;
  socialChannels?: HospitalSocialChannels;
  administrative?: HospitalAdministrative;
}

export interface HospitalConfigurationPayload {
  branding?: Partial<Omit<HospitalBranding, "logoUrl" | "headerBannerUrl">>;
  contact?: Partial<HospitalContact>;
  address?: Partial<HospitalAddress>;
  operationalDetails?: Partial<HospitalOperationalDetails>;
  socialChannels?: Partial<HospitalSocialChannels>;
  administrative?: Partial<HospitalAdministrative>;
}

export interface PrintHeaderPreview {
  logoUrl?: string;
  hospitalName?: string;
  shortName?: string;
  tagline?: string;
  registrationNumber?: string;
  licenseNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  emergencyHotline?: string;
  emergency24x7?: boolean;
}

export interface UploadResponse {
  logoUrl?: string;
  headerBannerUrl?: string;
  url?: string;
  fileUrl?: string;
  path?: string;
  filePath?: string;
  uploadUrl?: string;
  publicUrl?: string;
  location?: string;
  [key: string]: unknown;
}

export interface OpdBreak {
  breakName: string;
  startTime: string;
  endTime: string;
}

interface OpdWorkingInterval {
  startTime: string;
  endTime: string;
}

export interface OpdWeeklyScheduleDay {
  dayOfWeek: string;
  workingIntervals: OpdWorkingInterval[];
  breaks: OpdBreak[];
  isOpen: boolean;
}

export interface OpdWeeklySchedule {
  weeklySchedule: OpdWeeklyScheduleDay[];
}

export interface OpdHoliday {
  id: number;
  holidayDate: string;
  holidayName: string;
  holidayType: string;
  description?: string;
  status: "ACTIVE" | "INACTIVE" | string;
  fullDay: boolean;
}

export interface OpdHolidayPayload {
  holidayDate: string;
  holidayName: string;
  holidayType: string;
  description?: string;
  isFullDay: boolean;
}

// ─── Hospital Information Form Model (UI) ───

export interface HospitalInformationForm {
  hospitalName: string;
  hospitalShortName: string;
  hospitalTagline: string;
  registrationNumber: string;
  licenseNumber: string;
  logoUrl: string;
  bannerUrl: string;
  primaryPhone: string;
  secondaryPhone: string;
  emergencyPhone: string;
  officialEmail: string;
  website: string;
  supportEmail: string;
  workingHours: string;
  is24x7: boolean;
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  state: string;
  country: string;
  postalCode: string;
  mapUrl: string;
  hospitalType: string;
  ownership: string;
  establishedYear: string;
  numDepartments: string;
  numDoctors: string;
  numConsultationRooms: string;
  facebook: string;
  linkedin: string;
  instagram: string;
  youtube: string;
  whatsapp: string;
  internalNotes: string;
}

export const EMPTY_HOSPITAL_INFORMATION_FORM: HospitalInformationForm = {
  hospitalName: "",
  hospitalShortName: "",
  hospitalTagline: "",
  registrationNumber: "",
  licenseNumber: "",
  logoUrl: "",
  bannerUrl: "",
  primaryPhone: "",
  secondaryPhone: "",
  emergencyPhone: "",
  officialEmail: "",
  website: "",
  supportEmail: "",
  workingHours: "",
  is24x7: false,
  addressLine1: "",
  addressLine2: "",
  city: "",
  district: "",
  state: "",
  country: "",
  postalCode: "",
  mapUrl: "",
  hospitalType: "",
  ownership: "",
  establishedYear: "",
  numDepartments: "",
  numDoctors: "",
  numConsultationRooms: "",
  facebook: "",
  linkedin: "",
  instagram: "",
  youtube: "",
  whatsapp: "",
  internalNotes: "",
};
