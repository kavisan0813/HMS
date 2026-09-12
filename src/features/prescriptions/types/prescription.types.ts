export type RxStatus =
  | "Draft"
  | "Issued"
  | "Completed"
  | "Cancelled"
  | "Archived";

export interface UnifiedPrescription {
  id: string;
  prescriptionId?: string;
  encounterNumber?: string;
  encounterId?: string | number;
  patientName: string;
  mrn: string;
  consultationId: string;
  department: string;
  consultationDate: string;
  date?: string;
  medicineCount: number;
  totalMedicines?: number;
  sampleMedicines?: string[];
  followup: boolean;
  followupDate?: string;
  status: RxStatus;
  doctorName: string;
  diagnosis: string;
  medicines: Array<{
    name: string;
    strength?: string;
    route?: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    quantity?: string;
    instructions?: string;
  }>;
}

/** Backend DTO: GET /api/v1/patients/{mrn}/prescriptions response item */
export interface PatientPrescriptionSummary {
  prescriptionId: string;
  appointmentId?: string;
  encounterId?: string;
  visitDateTime?: string;
  doctor?: {
    doctorId?: string;
    doctorName?: string;
    doctorSpecialization?: string;
  };
  department?: {
    departmentId?: string;
    departmentName?: string;
  };
  diagnosis?: {
    primaryDiagnosis?: string;
    icd10Code?: string;
  };
  medications?: {
    totalMedicines?: number;
    highRiskMedicine?: boolean;
    sampleMedicines?: string[];
    containsControlledMedicine?: boolean;
  };
  prescriptionStatus?: string;
  followUp?: {
    required?: boolean;
    followUpDate?: string;
  };
  billing?: {
    invoiceNumber?: string;
    billingStatus?: string;
  };
  documents?: {
    prescriptionDocumentId?: string;
    pdfAvailable?: boolean;
    digitalSignature?: boolean;
    downloadable?: boolean;
  };
  createdAt?: string;
}

/** Paginated response from backend */
export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface PrescriptionPatient {
  fullName?: string;
  mrn?: string;
  gender?: string;
  age?: string | number;
}

interface PrescriptionPrescriber {
  doctorId?: string | number;
  fullName?: string;
  registrationNumber?: string;
  department?: string;
}

export interface PrescriptionMedicationItem {
  medicationId?: number;
  displayOrder?: number;
  source?: string;
  medicineId?: number;
  medicineName: string;
  strength?: string;
  form?: string;
  route?: string;
  dose?: { value?: number; unit?: string } | string;
  frequency?: { code?: string; display?: string } | string;
  duration?: { value?: number; unit?: string } | string;
  quantity?: { value?: number; unit?: string } | string | number;
  instructions?: string;
}

interface PrescriptionAdvice {
  general?: string;
  diet?: string;
  precautions?: string;
  additionalInstructions?: string;
}

interface PrescriptionFollowUp {
  instructions?: string;
  type?: string;
  intervalValue?: number;
  intervalUnit?: string;
  followUpDate?: string;
}

export interface EncounterPrescriptionResponse {
  id: number;
  prescriptionId: string;
  encounterId: number;
  encounterNumber: string;
  patient?: PrescriptionPatient;
  prescriber?: PrescriptionPrescriber;
  status: string;
  outcome?: string;
  currentVersion?: number;
  amendmentReason?: string | null;
  amendedFromVersion?: number | null;
  medications: PrescriptionMedicationItem[];
  advice?: PrescriptionAdvice | null;
  followUp?: PrescriptionFollowUp | null;
  createdAt?: string;
  updatedAt?: string;
  finalizedAt?: string | null;
}
