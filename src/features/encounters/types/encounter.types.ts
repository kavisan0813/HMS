type EncounterStatus =
  | "CREATED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FINALIZED"
  | string;

type PrescriptionOutcome =
  | "MEDICATION_PRESCRIBED"
  | "NO_MEDICATION"
  | "REFERRED"
  | "NO_OUTCOME"
  | string;

/**
 * POST /api/v1/encounters (Request Body)
 */
export interface CreateEncounterRequest {
  appointmentId: string | number;
}

/**
 * POST /api/v1/encounters (Response) & POST /api/v1/encounters/{encounterId}/finalize (Response)
 */
export interface Encounter {
  encounterId: string | number;
  encounterNumber?: string;
  appointmentId?: string | number;
  patientId?: string | number;
  doctorId?: string | number;
  encounterType?: string;
  status?: EncounterStatus;
  version?: number;
  prescriptionOutcome?: PrescriptionOutcome;
  prescriptionOutcomeReason?: string;
  startedAt?: string;
  completedAt?: string;
  finalizedAt?: string;
  finalizedByUserId?: string | number;
  primary?: boolean;
}

/**
 * POST /api/v1/encounters/{encounterId}/consultation (Request Body)
 */
export interface SaveConsultationRequest {
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  generalExamination?: string;
  physicalExamination?: string;
  assessmentSummary?: string;
  advice?: string;
  followUpInstructions?: string;
  followUpType?: string;
  followUpIntervalValue?: number;
  followUpIntervalUnit?: string;
  followUpDate?: string;
}

/**
 * POST /api/v1/encounters/{encounterId}/consultation (Response)
 */
export interface Consultation {
  id: string | number;
  encounterId: string | number;
  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  generalExamination?: string;
  physicalExamination?: string;
  assessmentSummary?: string;
  advice?: string;
  followUpInstructions?: string;
  followUpType?: string;
  followUpIntervalValue?: number;
  followUpIntervalUnit?: string;
  followUpDate?: string;
  status?: string;
  version?: number;
  finalizedAt?: string;
  finalizedByUserId?: string | number;
}

/**
 * POST /api/v1/encounters/{encounterId}/diagnoses (Request Body)
 */
export interface AddDiagnosisRequest {
  diagnosisCode: string;
  diagnosisName: string;
  codingSystem?: string;
  diagnosisType?: string;
  certainty?: string;
  clinicalNotes?: string;
}

/**
 * POST /api/v1/encounters/{encounterId}/diagnoses (Response)
 */
export interface Diagnosis {
  id: string | number;
  encounterId: string | number;
  diagnosisCode?: string;
  diagnosisName?: string;
  codingSystem?: string;
  diagnosisType?: string;
  certainty?: string;
  clinicalNotes?: string;
  active?: boolean;
}

/**
 * POST /api/v1/encounters/{encounterId}/finalize (Request Body)
 */
export interface FinalizeEncounterRequest {
  version?: number;
  confirmation: boolean;
}

/**
 * POST /api/v1/encounters/{encounterId}/prescription (Request Body)
 */
export interface CreatePrescriptionRequest {
  outcome?: PrescriptionOutcome;
  encounterId?: string | number;
}

/**
 * POST /api/v1/prescriptions/{prescriptionId}/medications (Request Body)
 */
export interface AddMedicationRequest {
  source?: "CATALOGUE" | string;
  medicineId?: string | number;
  medicineName?: string;
  strength?: string;
  form?: string;
  route?: string;
  doseValue?: number;
  doseUnit?: string;
  frequencyCode?: string;
  frequencyDisplay?: string;
  durationValue?: number;
  durationUnit?: string;
  quantityValue?: number;
  quantityUnit?: string;
  instructions?: string;
}

interface PrescriptionMedication {
  medicationId?: string | number;
  displayOrder?: number;
  source?: string;
  medicineId?: string | number;
  medicineName?: string;
  strength?: string;
  form?: string;
  route?: string;
  dose?: {
    value?: number;
    unit?: string;
  };
  frequency?: {
    code?: string;
    display?: string;
  };
  duration?: {
    value?: number;
    unit?: string;
  };
  quantity?: {
    value?: number;
    unit?: string;
  };
  instructions?: string;
}

/**
 * POST /api/v1/encounters/{encounterId}/prescription (Response)
 * POST /api/v1/prescriptions/{prescriptionId}/medications (Response)
 */
export interface Prescription {
  id?: string | number;
  prescriptionId?: string | number;
  encounterId?: string | number;
  encounterNumber?: string;
  patient?: {
    fullName?: string;
    mrn?: string;
    gender?: string;
    age?: string | number;
  };
  prescriber?: {
    doctorId?: string | number;
    fullName?: string;
    registrationNumber?: string;
    department?: string;
  };
  status?: string;
  outcome?: PrescriptionOutcome;
  currentVersion?: number;
  amendmentReason?: string;
  amendedFromVersion?: number;
  medications?: PrescriptionMedication[];
  advice?: {
    general?: string;
    diet?: string;
    precautions?: string;
    additionalInstructions?: string;
  };
  followUp?: {
    instructions?: string;
    type?: string;
    intervalValue?: number;
    intervalUnit?: string;
    followUpDate?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  finalizedAt?: string;
}

/**
 * POST /api/v1/prescriptions/{prescriptionId}/finalize (Request Body)
 */
export interface FinalizePrescriptionRequest {
  confirmation?: boolean;
  generalAdvice?: string;
  dietAdvice?: string;
  followUpNotes?: string;
  followUpDate?: string;
}

/**
 * POST /api/v1/prescriptions/{prescriptionId}/finalize (Response)
 */
export interface FinalizePrescriptionResponse {
  prescriptionId?: string | number;
  status?: string;
  version?: number;
  issuedAt?: string;
  issuedBy?: {
    doctorId?: string | number;
    fullName?: string;
    registrationNumber?: string;
  };
}
