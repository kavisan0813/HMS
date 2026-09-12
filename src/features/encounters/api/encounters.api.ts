import { apiClient, axios } from "../../../lib/axios";
import type {
  AddDiagnosisRequest,
  AddMedicationRequest,
  Consultation,
  CreateEncounterRequest,
  CreatePrescriptionRequest,
  Diagnosis,
  Encounter,
  FinalizeEncounterRequest,
  FinalizePrescriptionRequest,
  FinalizePrescriptionResponse,
  Prescription,
  SaveConsultationRequest,
} from "../types/encounter.types";

interface ApiEnvelope<T> {
  success?: boolean;
  code?: string;
  message?: string;
  timestamp?: string;
  data?: T;
  errors?: Record<string, unknown>;
}

export interface UpdateClinicalNotesPayload {
  subjective?: {
    chiefComplaint?: string;
    historyOfPresentIllness?: string;
    pastMedicalHistory?: string;
  };
  objective?: {
    generalExamination?: string;
    physicalExamination?: string;
  };
  assessment?: {
    summary?: string;
  };
  plan?: {
    advice?: string;
    followUpInstructions?: string;
    followUp?: {
      type?: string;
      intervalValue?: number;
      intervalUnit?: string;
      followUpDate?: string;
    };
  };

  chiefComplaint?: string;
  historyOfPresentIllness?: string;
  pastMedicalHistory?: string;
  generalExamination?: string;
  physicalExamination?: string;
  summary?: string;
  assessmentSummary?: string;
  advice?: string;
  followUpInstructions?: string;
  followUpType?: string;
  followUpIntervalValue?: number;
  followUpIntervalUnit?: string;
  followUpDate?: string;
  clinicalNotes?: string;
  version?: number;
}

export interface UpdateDiagnosisPayload {
  diagnosisCode: string;
  diagnosisName: string;
  codingSystem?: string;
  diagnosisType: string;
  certainty?: string;
  clinicalNotes?: string;
}

export interface UpdateVitalsPayload {
  temperature?: {
    value: number;
    unit: string;
  };
  bloodPressure?: {
    systolic: number;
    diastolic: number;
    unit: string;
  };
  pulseRate?: {
    value: number;
    unit: string;
  };
  respiratoryRate?: {
    value: number;
    unit: string;
  };
  oxygenSaturation?: {
    value: number;
    unit: string;
  };
  weight?: {
    value: number;
    unit: string;
  };
  height?: {
    value: number;
    unit: string;
  };

  tempValue?: number;
  bloodPressureStr?: string;
  bpSystolicVal?: number;
  bpDiastolicVal?: number;
  pulseVal?: number;
  respiratoryRateVal?: number;
  spo2Val?: number;
  weightVal?: number;
  heightVal?: number;
  chiefComplaint?: string;
  symptoms?: string;
}

export interface UpdatePrescriptionAdvicePayload {
  generalAdvice?: string;
  dietAdvice?: string;
  precautions?: string;
  additionalInstructions?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  followUpTimeFrame?: string;
  followUpNotes?: string;
}

export interface UpdateMedicationPayload {
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

const unwrap = <T>(body: ApiEnvelope<T> | T): T => {
  if (
    body !== null &&
    typeof body === "object" &&
    "data" in body &&
    (body as ApiEnvelope<T>).data !== undefined
  ) {
    return (body as ApiEnvelope<T>).data as T;
  }
  return body as T;
};

const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) {
      throw new Error(data.message);
    }
  }
  throw error;
};

/**
 * Layered API module for the encounter / prescription management flow.
 * One function per backend endpoint, no business logic, no UI concerns.
 */
export const encountersApi = {
  /**
   * POST /api/v1/encounters
   */
  createEncounter: async (
    payload: CreateEncounterRequest,
  ): Promise<Encounter> => {
    try {
      const response = await apiClient.post<ApiEnvelope<Encounter> | Encounter>(
        "/api/v1/encounters",
        payload,
      );
      return unwrap<Encounter>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * POST /api/v1/encounters/{encounterId}/consultation
   */
  saveConsultation: async (
    encounterId: string | number,
    payload: SaveConsultationRequest,
  ): Promise<Consultation> => {
    try {
      const response = await apiClient.post<
        ApiEnvelope<Consultation> | Consultation
      >(`/api/v1/encounters/${encounterId}/consultation`, payload);
      return unwrap<Consultation>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * POST /api/v1/encounters/{encounterId}/diagnoses
   */
  addDiagnosis: async (
    encounterId: string | number,
    payload: AddDiagnosisRequest,
  ): Promise<Diagnosis> => {
    try {
      const response = await apiClient.post<ApiEnvelope<Diagnosis> | Diagnosis>(
        `/api/v1/encounters/${encounterId}/diagnoses`,
        payload,
      );
      return unwrap<Diagnosis>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * POST /api/v1/encounters/{encounterId}/finalize
   */
  finalizeEncounter: async (
    encounterId: string | number,
    payload: FinalizeEncounterRequest,
  ): Promise<Encounter> => {
    try {
      const response = await apiClient.post<ApiEnvelope<Encounter> | Encounter>(
        `/api/v1/encounters/${encounterId}/finalize`,
        payload,
      );
      return unwrap<Encounter>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * POST /api/v1/encounters/{encounterId}/prescription
   */
  createPrescription: async (
    encounterId: string | number,
    payload: CreatePrescriptionRequest,
  ): Promise<Prescription> => {
    try {
      const response = await apiClient.post<
        ApiEnvelope<Prescription> | Prescription
      >(`/api/v1/encounters/${encounterId}/prescription`, payload);
      const resData = unwrap<Prescription>(response.data);
      console.log("CREATE PRESCRIPTION RESPONSE:", resData);
      return resData;
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * POST /api/v1/prescriptions/{prescriptionId}/medications
   */
  addMedication: async (
    prescriptionId: string | number,
    payload: AddMedicationRequest,
  ): Promise<Prescription | null> => {
    try {
      const response = await apiClient.post<
        ApiEnvelope<Prescription> | Prescription
      >(`/api/v1/prescriptions/${prescriptionId}/medications`, payload);
      const res = unwrap<Prescription>(response.data);
      console.log("ADD MEDICATION PRIMARY RESPONSE:", res);
      return res;
    } catch (primaryErr) {
      console.warn(
        "Primary addMedication endpoint failed, attempting fallbacks:",
        primaryErr,
      );
      try {
        const fallback1 = await apiClient.post<
          ApiEnvelope<Prescription> | Prescription
        >(`/api/v1/encounters/${prescriptionId}/medications`, payload);
        const res1 = unwrap<Prescription>(fallback1.data);
        console.log("ADD MEDICATION FALLBACK 1 RESPONSE:", res1);
        return res1;
      } catch {
        try {
          const fallback2 = await apiClient.post<
            ApiEnvelope<Prescription> | Prescription
          >(
            `/api/v1/encounters/${prescriptionId}/prescription/medications`,
            payload,
          );
          const res2 = unwrap<Prescription>(fallback2.data);
          console.log("ADD MEDICATION FALLBACK 2 RESPONSE:", res2);
          return res2;
        } catch (finalErr) {
          console.error(
            "All addMedication fallback endpoints failed:",
            finalErr,
          );
          return null;
        }
      }
    }
  },

  /**
   * PUT /api/v1/prescriptions/{prescriptionId}/medications/{medicationId}
   * Modifies dosage, frequency, or instructions of an existing medication item.
   */
  updateMedication: async (
    prescriptionId: string | number,
    medicationId: string | number,
    payload: {
      doseValue?: number;
      doseUnit?: string;
      frequencyCode?: string;
      frequencyDisplay?: string;
      durationValue?: number;
      durationUnit?: string;
      instructions?: string;
    },
  ): Promise<Prescription | null> => {
    try {
      const response = await apiClient.put<
        ApiEnvelope<Prescription> | Prescription
      >(
        `/api/v1/prescriptions/${prescriptionId}/medications/${medicationId}`,
        payload,
      );
      return unwrap<Prescription>(response.data);
    } catch (error) {
      console.error("updateMedication failed:", error);
      return null;
    }
  },

  /**
   * DELETE /api/v1/prescriptions/{prescriptionId}/medications/{medicationId}
   * Removes a medication item from a draft prescription.
   */
  deleteMedication: async (
    prescriptionId: string | number,
    medicationId: string | number,
  ): Promise<Prescription | null> => {
    try {
      const response = await apiClient.delete<
        ApiEnvelope<Prescription> | Prescription
      >(`/api/v1/prescriptions/${prescriptionId}/medications/${medicationId}`);
      return unwrap<Prescription>(response.data);
    } catch (error) {
      console.error("deleteMedication failed:", error);
      return null;
    }
  },

  /**
   * POST /api/v1/prescriptions/{prescriptionId}/finalize
   */
  finalizePrescription: async (
    prescriptionId: string | number,
    payload: FinalizePrescriptionRequest = { confirmation: true },
  ): Promise<FinalizePrescriptionResponse | null> => {
    try {
      const response = await apiClient.post<
        ApiEnvelope<FinalizePrescriptionResponse> | FinalizePrescriptionResponse
      >(`/api/v1/prescriptions/${prescriptionId}/finalize`, payload);
      return unwrap<FinalizePrescriptionResponse>(response.data);
    } catch {
      return null;
    }
  },

  /**
   * POST /api/v1/encounters/appointment/{appointmentId}/finalize
   * Legacy adapter endpoint to finalize encounter by appointment ID.
   */
  finalizeEncounterByAppointment: async (
    appointmentId: string | number,
  ): Promise<Encounter | null> => {
    try {
      const response = await apiClient.post<ApiEnvelope<Encounter> | Encounter>(
        `/api/v1/encounters/appointment/${appointmentId}/finalize`,
      );
      return unwrap<Encounter>(response.data);
    } catch {
      return null;
    }
  },

  /**
   * PUT /api/v1/prescriptions/{prescriptionId}/advice
   */
  savePrescriptionAdvice: async (
    prescriptionId: string | number,
    payload: {
      generalAdvice?: string;
      dietAdvice?: string;
      precautions?: string;
    },
  ): Promise<Prescription | null> => {
    try {
      const response = await apiClient.put<{
        data?: Prescription;
        status?: number;
      }>(`/api/v1/prescriptions/${prescriptionId}/advice`, payload);
      return response.data?.data || null;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { code?: string } | undefined;
        if (data?.code === "PRESCRIPTION_VERSION_IMMUTABLE") {
          return null;
        }
      }
      return handleApiError(error);
    }
  },

  /**
   * POST /api/v1/prescriptions/{prescriptionId}/validate
   */
  validatePrescription: async (
    prescriptionId: string | number,
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null> => {
    try {
      const response = await apiClient.post<
        ApiEnvelope<{ valid: boolean; errors: string[]; warnings: string[] }>
      >(`/api/v1/prescriptions/${prescriptionId}/validate`);
      return unwrap(response.data);
    } catch {
      return null;
    }
  },

  /**
   * GET /api/v1/prescriptions/{prescriptionId}/print-output (Use Case 3)
   */
  getPrintablePrescription: async (
    prescriptionId: string | number,
  ): Promise<{
    headerTitle?: string;
    prescriptionId?: string;
    patient?: { fullName?: string; mrn?: string };
    doctor?: { fullName?: string };
    medications?: Array<{
      medicineName: string;
      dosage?: string;
      frequency?: string;
      duration?: string;
      quantity?: string;
      instructions?: string;
    }>;
  } | null> => {
    try {
      const response = await apiClient.get<unknown>(
        `/api/v1/prescriptions/${prescriptionId}/print-output`,
      );
      return unwrap(response.data) as {
        headerTitle?: string;
        prescriptionId?: string;
        patient?: { fullName?: string; mrn?: string };
        doctor?: { fullName?: string };
        medications?: Array<{
          medicineName: string;
          dosage?: string;
          frequency?: string;
          duration?: string;
          quantity?: string;
          instructions?: string;
        }>;
      };
    } catch {
      return null;
    }
  },

  /**
   * GET /api/v1/encounters/{encounterId}/finalization-check
   */
  getFinalizationCheck: async (
    encounterId: string | number,
  ): Promise<{
    ready: boolean;
    checks: { code: string; passed: boolean }[];
  } | null> => {
    try {
      const response = await apiClient.get<
        ApiEnvelope<{
          ready: boolean;
          checks: { code: string; passed: boolean }[];
        }>
      >(`/api/v1/encounters/${encounterId}/finalization-check`);
      return unwrap(response.data);
    } catch {
      return null;
    }
  },

  /**
   * GET /api/v1/encounters/{encounterId}/prescription
   */
  getPrescriptionByEncounterId: async (
    encounterId: string | number,
  ): Promise<Prescription | null> => {
    try {
      const response = await apiClient.get<
        ApiEnvelope<Prescription> | Prescription
      >(`/api/v1/encounters/${encounterId}/prescription`);
      return unwrap<Prescription>(response.data);
    } catch {
      return null;
    }
  },
  /**
   * GET /api/v1/encounters/{encounterId}/diagnoses
   */
  getDiagnoses: async (
    encounterId: string | number,
  ): Promise<unknown[] | null> => {
    try {
      const response = await apiClient.get<ApiEnvelope<unknown[]> | unknown[]>(
        `/api/v1/encounters/${encounterId}/diagnoses`,
      );
      return unwrap<unknown[]>(response.data);
    } catch {
      return null;
    }
  },

  /**
   * POST /api/v1/encounters/{encounterId}/prescription-resolution
   */
  setPrescriptionResolution: async (
    encounterId: string | number,
    payload: { outcome: string; reason?: string },
  ): Promise<Record<string, unknown> | null> => {
    try {
      const response = await apiClient.post<
        ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
      >(`/api/v1/encounters/${encounterId}/prescription-resolution`, payload);
      return unwrap<Record<string, unknown>>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * PUT /api/v1/consultations/{consultationId}/clinical-notes
   */
  updateClinicalNotes: async (
    consultationId: string | number,
    payload: UpdateClinicalNotesPayload | Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> => {
    try {
      const response = await apiClient.put<
        ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
      >(`/api/v1/consultations/${consultationId}/clinical-notes`, payload);
      return unwrap<Record<string, unknown>>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * PUT /api/v1/encounters/{encounterId}/diagnoses/{diagnosisId}
   */
  updateDiagnosis: async (
    encounterId: string | number,
    diagnosisId: string | number,
    payload: UpdateDiagnosisPayload,
  ): Promise<Diagnosis | Record<string, unknown> | null> => {
    try {
      const response = await apiClient.put<ApiEnvelope<Diagnosis> | Diagnosis>(
        `/api/v1/encounters/${encounterId}/diagnoses/${diagnosisId}`,
        payload,
      );
      return unwrap<Diagnosis>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * PUT /api/v1/encounters/{encounterId}/vitals
   */
  updateVitals: async (
    encounterId: string | number,
    payload: UpdateVitalsPayload,
  ): Promise<Record<string, unknown> | null> => {
    try {
      const response = await apiClient.put<
        ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
      >(`/api/v1/encounters/${encounterId}/vitals`, payload);
      return unwrap<Record<string, unknown>>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * PUT /api/v1/prescriptions/{prescriptionId}/advice
   */
  updatePrescriptionAdvice: async (
    prescriptionId: string | number,
    payload: UpdatePrescriptionAdvicePayload,
  ): Promise<Prescription | Record<string, unknown> | null> => {
    try {
      const response = await apiClient.put<
        ApiEnvelope<Prescription> | Prescription
      >(`/api/v1/prescriptions/${prescriptionId}/advice`, payload);
      return unwrap<Prescription>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * PUT /api/v1/prescriptions/{prescriptionId}/medications/{medicationId}
   */
  updatePrescriptionMedication: async (
    prescriptionId: string | number,
    medicationId: string | number,
    payload: UpdateMedicationPayload,
  ): Promise<Prescription | null> => {
    try {
      const response = await apiClient.put<
        ApiEnvelope<Prescription> | Prescription
      >(
        `/api/v1/prescriptions/${prescriptionId}/medications/${medicationId}`,
        payload,
      );
      return unwrap<Prescription>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * GET /api/v1/encounters/{encounterId}/workspace
   */
  getWorkspace: async (
    encounterId: string | number,
  ): Promise<Record<string, unknown> | null> => {
    try {
      const response = await apiClient.get<
        ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
      >(`/api/v1/encounters/${encounterId}/workspace`);
      return unwrap<Record<string, unknown>>(response.data);
    } catch {
      return null;
    }
  },

  /**
   * GET /api/v1/consultations/{consultationId}
   */
  getConsultation: async (
    consultationId: string | number,
  ): Promise<Record<string, unknown> | null> => {
    try {
      const response = await apiClient.get<
        ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
      >(`/api/v1/consultations/${consultationId}`);
      return unwrap<Record<string, unknown>>(response.data);
    } catch {
      return null;
    }
  },

  /**
   * GET /api/v1/encounters/{encounterId}/consultation
   */
  getEncounterConsultation: async (
    encounterId: string | number,
  ): Promise<Record<string, unknown> | null> => {
    try {
      const response = await apiClient.get<
        ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
      >(`/api/v1/encounters/${encounterId}/consultation`);
      return unwrap<Record<string, unknown>>(response.data);
    } catch {
      return null;
    }
  },

  /**
   * GET /api/v1/patients/{mrn}/encounters
   */
  getPatientEncounters: async (
    mrn: string,
  ): Promise<Array<Record<string, unknown>>> => {
    try {
      const response = await apiClient.get<
        | ApiEnvelope<Array<Record<string, unknown>>>
        | Array<Record<string, unknown>>
      >(`/api/v1/patients/${mrn}/encounters`);
      const data = unwrap<Array<Record<string, unknown>>>(response.data);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  /**
   * PUT /api/v1/encounters/{encounterId}/consultation
   */
  initConsultationPut: async (
    encounterId: string | number,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> => {
    try {
      const response = await apiClient.put<
        ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
      >(`/api/v1/encounters/${encounterId}/consultation`, payload);
      return unwrap<Record<string, unknown>>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * POST /api/v1/encounters/{encounterId}/consultation
   */
  initConsultationPost: async (
    encounterId: string | number,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> => {
    try {
      const response = await apiClient.post<
        ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
      >(`/api/v1/encounters/${encounterId}/consultation`, payload);
      return unwrap<Record<string, unknown>>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * GET /api/v1/encounters/{encounterId}/amendments
   */
  getAmendments: async (
    encounterId: string | number,
  ): Promise<Array<Record<string, unknown>>> => {
    try {
      const response = await apiClient.get<
        | ApiEnvelope<Array<Record<string, unknown>>>
        | Array<Record<string, unknown>>
      >(`/api/v1/encounters/${encounterId}/amendments`);
      const data = unwrap<Array<Record<string, unknown>>>(response.data);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  },

  /**
   * POST /api/v1/encounters/{encounterId}/draft
   */
  saveDraft: async (
    encounterId: string | number,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null> => {
    try {
      const response = await apiClient.post<
        ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
      >(`/api/v1/encounters/${encounterId}/draft`, payload);
      return unwrap<Record<string, unknown>>(response.data);
    } catch {
      return null;
    }
  },
};
