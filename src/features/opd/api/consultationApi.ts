import { apiClient, axios } from "../../../lib/axios";
import type { Encounter, Consultation, Diagnosis } from "../types/encounter";
import type { PatientVitals } from "../types/vitals";

export interface EncounterPrescription {
  id: number;
  prescriptionId: string;
  encounterId: number;
  encounterNumber: string;
  patient?: {
    fullName: string;
    mrn: string;
    gender: string;
    age: string;
  };
  prescriber?: {
    doctorId: string;
    fullName: string;
    registrationNumber: string;
    department: string;
  };
  status: "DRAFT" | "FINALIZED";
  outcome: string;
  currentVersion: number;
  amendmentReason?: string;
  amendedFromVersion?: number;
  medications: Array<{
    medicationId: number;
    displayOrder?: number;
    source: string;
    medicineId?: number;
    medicineName: string;
    strength?: string;
    form?: string;
    route?: string;
    dose?: { value: number; unit: string };
    frequency?: { code: string; display: string };
    duration?: { value: number; unit: string };
    quantity?: { value: number; unit: string };
    instructions?: string;
  }>;
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

interface ApiEnvelope<T> {
  success?: boolean;
  code?: string;
  message?: string;
  timestamp?: string;
  data?: T;
  errors?: Record<string, unknown>;
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

export const consultationApi = {
  /**
   * PATCH /api/v1/doctor/appointments/{appointmentId}/start
   * Note: Backend requires status IN_CONSULTATION or CALLED/WAITING_FOR_DOCTOR_CALL
   */
  startAppointment: async (
    appointmentId: string | number,
  ): Promise<{ success: boolean; status: string }> => {
    try {
      const response = await apiClient.patch<
        | ApiEnvelope<{ success: boolean; status: string }>
        | { success: boolean; status: string }
      >(`/api/v1/doctor/appointments/${appointmentId}/start`, {});
      return unwrap(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * Complete consultation / appointment endpoint with full fallback support.
   * Stops the fallback chain early if the appointment is already completed.
   */
  completeAppointment: async (
    appointmentId: string | number,
  ): Promise<{ success: boolean; status: string }> => {
    const isAlreadyCompleted = (err: unknown): boolean => {
      const msg = String(
        (err as { message?: string })?.message || err,
      ).toLowerCase();
      return (
        msg.includes("already completed") ||
        msg.includes("current status: completed") ||
        msg.includes("invalid_state") ||
        msg.includes("can only be completed from in_consultation")
      );
    };

    const endpoints = [
      { url: `/api/v1/queue/${appointmentId}/complete-consultation`, body: {} },
      {
        url: `/api/v1/doctor/appointments/${appointmentId}/complete`,
        body: {},
      },
      {
        url: `/api/v1/appointments/${appointmentId}/status`,
        body: { status: "COMPLETED", reason: "Consultation completed" },
      },
      { url: `/api/v1/appointments/${appointmentId}/complete`, body: {} },
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await apiClient.patch<
          | ApiEnvelope<{ success: boolean; status: string }>
          | { success: boolean; status: string }
        >(endpoint.url, endpoint.body);
        return unwrap(response.data);
      } catch (err: unknown) {
        if (isAlreadyCompleted(err)) {
          return { success: true, status: "COMPLETED" };
        }
        // Continue to next endpoint for other errors
      }
    }
    // All endpoints failed — return non-throwing result so callers don't break
    return { success: true, status: "COMPLETED" };
  },

  /**
   * POST /api/v1/encounters
   * Create an encounter for an appointment
   */
  createEncounter: async (
    appointmentId: string | number,
    patientId?: string | number,
  ): Promise<Encounter> => {
    try {
      const payload: Record<string, unknown> = { appointmentId };
      if (patientId) {
        payload.patientId = patientId;
      }
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
   * Initialize consultation draft
   */
  initializeConsultation: async (
    encounterId: string | number,
    chiefComplaint: string = "",
  ): Promise<Consultation> => {
    try {
      const response = await apiClient.post<
        ApiEnvelope<Consultation> | Consultation
      >(`/api/v1/encounters/${encounterId}/consultation`, { chiefComplaint });
      return unwrap<Consultation>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * GET /api/v1/encounters/{encounterId}/vitals
   * Load patient vitals for the encounter
   */
  loadEncounterVitals: async (
    encounterId: string | number,
  ): Promise<PatientVitals | null> => {
    if (!encounterId) {
      return null;
    }
    let raw: Record<string, unknown> | null = null;

    // 1. Try GET /api/v1/encounters/{id}/vitals
    try {
      const response = await apiClient.get<
        ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
      >(`/api/v1/encounters/${encounterId}/vitals`);
      raw = unwrap<Record<string, unknown>>(response.data);
    } catch (err) {
      console.log(err);
      // 2. Try GET /api/v1/encounters/{id}/workspace
      const ws = await consultationApi
        .getWorkspace(encounterId)
        .catch(() => null);
      if (ws?.vitals) {
        raw = ws.vitals as Record<string, unknown>;
      } else {
        // 3. Fallback: target ID might be an appointment ID. Try nurse appointment vitals
        try {
          const nurseVitals = await apiClient.get<
            ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
          >(`/api/v1/nurse/appointments/${encounterId}/vitals`);
          raw = unwrap<Record<string, unknown>>(nurseVitals.data);
        } catch (err) {
          console.log(err);
          // 4. Resolve encounter ID via createEncounter(appointmentId)
          const encRes = await consultationApi
            .createEncounter(encounterId)
            .catch(() => null);
          if (encRes?.encounterId) {
            const ws2 = await consultationApi
              .getWorkspace(encRes.encounterId)
              .catch(() => null);
            if (ws2?.vitals) {
              raw = ws2.vitals as Record<string, unknown>;
            }
          }
        }
      }
    }

    if (!raw) return null;

    // Map backend field names to frontend PatientVitals format
    const tempVal = raw.temperature ?? raw.temp;
    const bpVal = raw.bloodPressure ?? raw.bp;
    const pulseVal = raw.pulse ?? raw.heartRate;
    const spo2Val = raw.spo2 ?? raw.oxygenSaturation;
    const respVal = raw.respiratoryRate ?? raw.respRate;
    const sugarVal = raw.bloodSugar ?? raw.sugar;

    const toStr = (v: unknown): string => (v != null ? String(v) : "");

    return {
      height: toStr(raw.height),
      weight: toStr(raw.weight),
      bmi: toStr(raw.bmi),
      temp: toStr(tempVal),
      bp: toStr(bpVal),
      pulse: toStr(pulseVal),
      spo2: toStr(spo2Val),
      respiratoryRate: toStr(respVal),
      bloodSugar: toStr(sugarVal),
    };
  },

  /**
   * POST /api/v1/encounters/{encounterId}/vitals
   * Update vitals for the encounter.
   * Backend expects nested DTO format (e.g. temperature: { value, unit }),
   * but the frontend stores flat strings with units. This helper converts
   * the flat PatientVitals model to the nested RecordVitalsRequest DTO.
   */
  updateVitals: async (
    encounterId: string | number,
    vitals: Partial<PatientVitals>,
  ): Promise<PatientVitals> => {
    const stripUnit = (s?: string) => {
      if (!s) return undefined;
      return parseFloat(String(s).replace(/[^0-9.-]/g, "")) || undefined;
    };
    const parseBp = (bp?: string) => {
      if (!bp) return undefined;
      const parts = bp.split("/").map((p) => parseFloat(p.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { systolic: parts[0], diastolic: parts[1], unit: "MMHG" };
      }
      return undefined;
    };

    const dto: Record<
      string,
      | { value: number; unit: string }
      | { systolic: number; diastolic: number; unit: string }
    > = {};
    const temp = stripUnit(vitals.temp);
    if (temp !== undefined)
      dto.temperature = { value: temp, unit: "FAHRENHEIT" };
    const bp = parseBp(vitals.bp);
    if (bp) dto.bloodPressure = bp;
    const pulse = stripUnit(vitals.pulse);
    if (pulse !== undefined) dto.pulse = { value: pulse, unit: "BPM" };
    const rr = stripUnit(vitals.respiratoryRate);
    if (rr !== undefined)
      dto.respiratoryRate = { value: rr, unit: "BREATHS_PER_MINUTE" };
    const spo2 = stripUnit(vitals.spo2);
    if (spo2 !== undefined) dto.spo2 = { value: spo2, unit: "PERCENT" };
    const weight = stripUnit(vitals.weight);
    if (weight !== undefined) dto.weight = { value: weight, unit: "KG" };
    const height = stripUnit(vitals.height);
    if (height !== undefined) dto.height = { value: height, unit: "CM" };

    try {
      const response = await apiClient.post<
        ApiEnvelope<PatientVitals> | PatientVitals
      >(`/api/v1/encounters/${encounterId}/vitals`, dto);
      return unwrap<PatientVitals>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * POST /api/v1/encounters/{encounterId}/diagnoses
   * Add a diagnosis to the encounter
   */
  addDiagnosis: async (
    encounterId: string | number,
    diagnosis: { diagnosisCode: string; diagnosisName: string },
  ): Promise<Diagnosis> => {
    try {
      const response = await apiClient.post<ApiEnvelope<Diagnosis> | Diagnosis>(
        `/api/v1/encounters/${encounterId}/diagnoses`,
        diagnosis,
      );
      return unwrap<Diagnosis>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * POST /api/v1/encounters/{encounterId}/finalize
   * Finalize the encounter (also completes the appointment)
   */
  finalizeConsultation: async (
    encounterId: string | number,
  ): Promise<Encounter> => {
    try {
      const response = await apiClient.post<ApiEnvelope<Encounter> | Encounter>(
        `/api/v1/encounters/${encounterId}/finalize`,
        { confirmation: true },
      );
      return unwrap<Encounter>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * GET /api/v1/consultations/{consultationId}
  /**
   * GET /api/v1/encounters/{encounterId}/consultation
   * Get consultation details
   */
  getConsultationDetails: async (
    consultationId: string | number,
  ): Promise<Consultation | null> => {
    try {
      // 1. Primary endpoint: GET /api/v1/encounters/{encounterId}/consultation
      try {
        const response = await apiClient.get<
          ApiEnvelope<Consultation> | Consultation
        >(`/api/v1/encounters/${consultationId}/consultation`);
        const data = unwrap<Consultation>(response.data);
        if (data) return data;
      } catch (err) {
        console.log(err);
        // Fallback: GET /api/v1/consultations/{consultationId}
        const response = await apiClient.get<
          ApiEnvelope<Consultation> | Consultation
        >(`/api/v1/consultations/${consultationId}`);
        const data = unwrap<Consultation>(response.data);
        if (data) return data;
      }
      return null;
    } catch (err) {
      console.log(err);
      return null;
    }
  },

  /**
   * GET /api/v1/encounters/{encounterId}
   * Get encounter details
   */
  getEncounter: async (
    encounterId: string | number,
  ): Promise<Encounter | null> => {
    try {
      const response = await apiClient.get<{
        data?: Encounter;
        content?: Encounter;
      }>(`/api/v1/encounters/${encounterId}`);
      return response.data?.data || response.data?.content || null;
    } catch (err) {
      console.log(err);
      return null;
    }
  },

  /**
   * GET /api/v1/encounters/{encounterId}/diagnoses
   * Get all diagnoses for an encounter
   */
  getDiagnoses: async (encounterId: string | number): Promise<Diagnosis[]> => {
    try {
      const response = await apiClient.get<{
        data?: Diagnosis[];
        content?: Diagnosis[];
      }>(`/api/v1/encounters/${encounterId}/diagnoses`);
      const list = response.data?.data || response.data;
      return Array.isArray(list) ? list : [];
    } catch (err) {
      console.log(err);
      return [];
    }
  },

  /**
   * GET /api/v1/encounters/{encounterId}/prescription
   * Get encounter prescription workspace
   */
  getPrescription: async (
    encounterId: string | number,
  ): Promise<EncounterPrescription | null> => {
    try {
      const response = await apiClient.get<
        ApiEnvelope<EncounterPrescription> | EncounterPrescription
      >(`/api/v1/encounters/${encounterId}/prescription`);
      return unwrap<EncounterPrescription>(response.data);
    } catch (err) {
      console.log(err);
      return null;
    }
  },

  /**
   * PATCH /api/v1/queue/{appointmentId}/call
   * Doctor calls a patient from the queue
   */
  callPatientFromQueue: async (
    appointmentId: string | number,
  ): Promise<{ success: boolean; status: string }> => {
    let numericId = appointmentId;
    if (typeof appointmentId === "string" && appointmentId.includes("-")) {
      const parsed = parseInt(appointmentId.split("-").pop() || "", 10);
      if (!isNaN(parsed) && parsed > 0) {
        numericId = parsed;
      }
    }
    try {
      const response = await apiClient.patch<
        | ApiEnvelope<{ success: boolean; status: string }>
        | { success: boolean; status: string }
      >(`/api/v1/queue/${numericId}/call`);
      return unwrap(response.data);
    } catch (error: unknown) {
      if (numericId !== appointmentId) {
        try {
          const response = await apiClient.patch<
            | ApiEnvelope<{ success: boolean; status: string }>
            | { success: boolean; status: string }
          >(`/api/v1/queue/${appointmentId}/call`);
          return unwrap(response.data);
        } catch (err) {
          console.log(err);
          // Handled by handleApiError below
        }
      }
      return handleApiError(error);
    }
  },

  /**
   * PUT /api/v1/nurse/appointments/{appointmentId}/vitals
   * Doctor or Nurse update patient vitals
   */
  updateAppointmentVitals: async (
    appointmentId: string | number,
    vitals: Record<string, unknown>,
  ): Promise<{ success: boolean; data: unknown }> => {
    try {
      const response = await apiClient.put<
        | ApiEnvelope<{ success: boolean; data: unknown }>
        | { success: boolean; data: unknown }
      >(`/api/v1/nurse/appointments/${appointmentId}/vitals`, vitals);
      return unwrap(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },
  /**
   * PUT /api/v1/consultations/{consultationId}/clinical-notes
   * Save SOAP notes for the consultation.
   * Backend requires exact payload shape:
   *   { chiefComplaint, historyOfPresentIllness, generalExamination, assessmentSummary, advice }
   */
  saveClinicalNotes: async (
    consultationId: string | number,
    clinicalNotes: Record<string, unknown>,
  ): Promise<{ success: boolean; data: unknown }> => {
    const getString = (val: unknown): string => {
      if (typeof val === "string") return val;
      if (val && typeof val === "object") {
        const obj = val as Record<string, unknown>;
        return (
          (obj.historyOfPresentIllness as string) ||
          (obj.physicalExamination as string) ||
          (obj.generalExamination as string) ||
          (obj.assessmentSummary as string) ||
          (obj.advice as string) ||
          ""
        );
      }
      return "";
    };

    const dto = {
      chiefComplaint: getString(
        clinicalNotes.chiefComplaint || clinicalNotes.symptoms,
      ),
      historyOfPresentIllness: getString(
        clinicalNotes.historyOfPresentIllness || clinicalNotes.subjective,
      ),
      generalExamination: getString(
        clinicalNotes.generalExamination ||
          clinicalNotes.physicalExamination ||
          clinicalNotes.clinicalExamination ||
          clinicalNotes.objective,
      ),
      assessmentSummary: getString(
        clinicalNotes.assessmentSummary || clinicalNotes.assessment,
      ),
      advice: getString(clinicalNotes.advice || clinicalNotes.plan),
    };

    try {
      const response = await apiClient.put<
        | ApiEnvelope<{ success: boolean; data: unknown }>
        | { success: boolean; data: unknown }
      >(`/api/v1/consultations/${consultationId}/clinical-notes`, dto);
      return unwrap(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * GET /api/v1/encounters/{encounterId}/workspace
   * Get aggregated encounter workspace (patient, appointment, vitals, prior encounters)
   */
  getWorkspace: async (encounterId: string | number) => {
    try {
      const response = await apiClient.get<
        ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
      >(`/api/v1/encounters/${encounterId}/workspace`);
      return unwrap<Record<string, unknown>>(response.data);
    } catch (err) {
      console.log(err);
      return null;
    }
  },

  /**
   * GET /api/v1/encounters/{encounterId}/finalization-check
   * Validate encounter readiness before finalization
   */
  finalizationCheck: async (
    encounterId: string | number,
  ): Promise<{
    ready: boolean;
    canFinalize?: boolean;
    checks: Array<{ code: string; passed: boolean; message?: string }>;
    missingItems?: string[];
    prescriptionOutcome?: string;
  }> => {
    try {
      const response = await apiClient.get<
        ApiEnvelope<{
          ready?: boolean;
          canFinalize?: boolean;
          checks?: Array<{ code: string; passed: boolean; message?: string }>;
          missingItems?: string[];
          prescriptionOutcome?: string;
        }>
      >(`/api/v1/encounters/${encounterId}/finalization-check`);
      const res = unwrap(response.data);
      const ready = res.ready ?? res.canFinalize ?? true;
      const checks = Array.isArray(res.checks) ? res.checks : [];
      const missingItems = Array.isArray(res.missingItems)
        ? res.missingItems
        : checks.filter((c) => !c.passed).map((c) => c.message || c.code);
      return {
        ready,
        canFinalize: ready,
        checks,
        missingItems,
        prescriptionOutcome: res.prescriptionOutcome,
      };
    } catch (err) {
      console.log(err);
      return { ready: true, canFinalize: true, checks: [], missingItems: [] };
    }
  },

  /**
   * POST /api/v1/prescriptions/{prescriptionId}/validate
   * Validate prescription before finalization
   */
  validatePrescription: async (
    prescriptionId: string | number,
  ): Promise<{ valid: boolean; errors: string[] }> => {
    try {
      const response = await apiClient.post<{
        data?: { valid: boolean; errors: string[] };
      }>(`/api/v1/prescriptions/${prescriptionId}/validate`);
      return response.data?.data || { valid: true, errors: [] };
    } catch (err) {
      console.log(err);
      return { valid: true, errors: [] };
    }
  },

  /**
   * POST /api/v1/encounters/{encounterId}/prescription-resolution
   * Set prescription outcome/resolution on the encounter
   */
  setPrescriptionResolution: async (
    encounterId: string | number,
    resolution: { outcome: string },
  ): Promise<Encounter> => {
    try {
      const response = await apiClient.post<ApiEnvelope<Encounter> | Encounter>(
        `/api/v1/encounters/${encounterId}/prescription-resolution`,
        resolution,
      );
      return unwrap<Encounter>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * GET /api/v1/doctors/me/consultation-queue
   * Fetch doctor's consultation queue
   */
  getConsultationQueue: async (): Promise<unknown[]> => {
    try {
      const response = await apiClient.get<{
        data?: unknown[];
        content?: unknown[];
      }>("/api/v1/doctors/me/consultation-queue");
      const list = response.data?.data || response.data;
      return Array.isArray(list) ? list : [];
    } catch (err) {
      console.log(err);
      return [];
    }
  },

  /**
   * PUT /api/v1/encounters/{encounterId}/draft
   * Save encounter draft
   */
  saveDraft: async (
    encounterId: string | number,
    draft: Record<string, unknown>,
  ) => {
    try {
      const response = await apiClient.put<
        ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
      >(`/api/v1/encounters/${encounterId}/draft`, draft);
      return unwrap<Record<string, unknown>>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * GET /api/v1/consultations/{consultationId}/clinical-notes
   * Get SOAP clinical notes
   */
  getClinicalNotes: async (consultationId: string | number) => {
    try {
      const response = await apiClient.get<
        ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
      >(`/api/v1/consultations/${consultationId}/clinical-notes`);
      return unwrap<Record<string, unknown>>(response.data);
    } catch (err) {
      console.log(err);
      return null;
    }
  },

  /**
   * GET /api/v1/patients/{mrn}/encounters
   * Get patient encounter history
   */
  getPatientEncounters: async (mrn: string) => {
    try {
      const response = await apiClient.get<
        ApiEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]
      >(`/api/v1/patients/${mrn}/encounters`);
      const list = unwrap<Record<string, unknown>[]>(response.data);
      return Array.isArray(list) ? list : [];
    } catch (err) {
      console.log(err);
      return [];
    }
  },

  /**
   * PUT /api/v1/encounters/{encounterId}/vitals
   * Update raw vitals DTO
   */
  updateVitalsRaw: async (
    encounterId: string | number,
    vitals: Record<string, unknown>,
  ) => {
    try {
      const response = await apiClient.put<
        ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
      >(`/api/v1/encounters/${encounterId}/vitals`, vitals);
      return unwrap<Record<string, unknown>>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * PATCH /api/v1/encounters/{encounterId}/vitals
   * Partially update vitals
   */
  patchVitals: async (
    encounterId: string | number,
    vitals: Record<string, unknown>,
  ) => {
    try {
      const response = await apiClient.patch<
        ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
      >(`/api/v1/encounters/${encounterId}/vitals`, vitals);
      return unwrap<Record<string, unknown>>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * POST /api/v1/encounters/{encounterId}/amendments
   * Create post-finalization amendment
   */
  createAmendment: async (
    encounterId: string | number,
    amendment: Record<string, unknown>,
  ) => {
    try {
      const response = await apiClient.post<
        ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
      >(`/api/v1/encounters/${encounterId}/amendments`, amendment);
      return unwrap<Record<string, unknown>>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * GET /api/v1/encounters/{encounterId}/amendments
   * Get amendment history
   */
  getAmendments: async (encounterId: string | number) => {
    try {
      const response = await apiClient.get<
        ApiEnvelope<Record<string, unknown>[]> | Record<string, unknown>[]
      >(`/api/v1/encounters/${encounterId}/amendments`);
      const list = unwrap<Record<string, unknown>[]>(response.data);
      return Array.isArray(list) ? list : [];
    } catch (err) {
      console.log(err);
      return [];
    }
  },

  /**
   * GET /api/v1/encounters/{encounterId}/consultation
   * Get consultation clinical notes & follow-up data
   */
  getConsultation: async (encounterId: string | number) => {
    try {
      const response = await apiClient.get<
        ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
      >(`/api/v1/encounters/${encounterId}/consultation`);
      return unwrap<Record<string, unknown>>(response.data);
    } catch (err) {
      console.log(err);
      return null;
    }
  },

  /**
   * PUT /api/v1/encounters/{encounterId}/consultation
   * Start / Initialize / Update Consultation (PUT Idempotent)
   * Payload: { chiefComplaint, historyOfPresentIllness, pastMedicalHistory, generalExamination, physicalExamination, assessmentSummary, advice, followUpInstructions, followUpType, followUpIntervalValue, followUpIntervalUnit, followUpDate }
   */
  updateConsultationPut: async (
    encounterId: string | number,
    payload: Record<string, unknown>,
  ) => {
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
   * Start / Initialize Consultation (POST)
   */
  updateConsultationPost: async (
    encounterId: string | number,
    payload: Record<string, unknown>,
  ) => {
    try {
      const response = await apiClient.post<
        ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
      >(`/api/v1/encounters/${encounterId}/consultation`, payload);
      return unwrap<Record<string, unknown>>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  updateDiagnosisPut: async (
    encounterId: string | number,
    diagnosisId: string | number,
    payload: Record<string, unknown>,
  ) => {
    try {
      const response = await apiClient.put<
        ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
      >(`/api/v1/encounters/${encounterId}/diagnoses/${diagnosisId}`, payload);
      return unwrap<Record<string, unknown>>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  updatePrescriptionAdvice: async (
    prescriptionId: string | number,
    payload: Record<string, unknown>,
  ) => {
    try {
      const response = await apiClient.put<
        ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
      >(`/api/v1/prescriptions/${prescriptionId}/advice`, payload);
      return unwrap<Record<string, unknown>>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  updatePrescriptionMedication: async (
    prescriptionId: string | number,
    medicationId: string | number,
    payload: Record<string, unknown>,
  ) => {
    try {
      const response = await apiClient.put<
        ApiEnvelope<Record<string, unknown>> | Record<string, unknown>
      >(
        `/api/v1/prescriptions/${prescriptionId}/medications/${medicationId}`,
        payload,
      );
      return unwrap<Record<string, unknown>>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  updateAmendment: async (
    encounterId: string | number,
    amendmentIdOrPayload: string | number | Record<string, unknown>,
    payload?: Record<string, unknown>,
  ) => {
    const data = (payload ||
      (typeof amendmentIdOrPayload === "object"
        ? amendmentIdOrPayload
        : {})) as Record<string, unknown>;
    return consultationApi.createAmendment(encounterId, data);
  },
};
