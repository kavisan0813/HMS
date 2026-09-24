import { apiClient, axios } from "../../../lib/axios";
import type { ApiPatientPrescription } from "../../patients/types/patient.types";
import type {
  PatientPrescriptionSummary,
  PaginatedResponse,
} from "../types/prescription.types";

export interface ApiEnvelope<T> {
  success?: boolean;
  code?: string;
  message?: string;
  timestamp?: string;
  data?: T;
  errors?: Record<string, unknown>;
}

interface ApiResponseBody<T> {
  data?: T;
  content?: T;
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

export interface PrescriptionDetailResponse {
  prescriptionId: number | string;
  prescriptionNumber?: string;
  patientName?: string;
  patientMrn?: string;
  doctorName?: string;
  department?: string;
  status?: string;
  outcome?: string;
  currentVersion?: number;
  createdAt?: string;
  updatedAt?: string;
  finalizedAt?: string;
  medicines?: Array<{
    medicationId?: number | string;
    medicineId?: number | string;
    medicineName?: string;
    name?: string;
    strength?: string;
    dosage?: string;
    dose?: { value?: number; unit?: string };
    frequency?: string | { code?: string; display?: string };
    duration?: string | { value?: number; unit?: string };
    quantity?: { value?: number; unit?: string };
    route?: string;
    instructions?: string;
    source?: string;
    displayOrder?: number;
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
}

export interface PrescriptionSummaryResponse {
  totalPrescriptions?: number;
  issuedCount?: number;
  completedCount?: number;
  activeFollowUps?: number;
  reprintCount?: number;
}

export interface AmendmentResponse {
  amendmentId?: number | string;
  prescriptionId?: number | string;
  version?: number;
  reason?: string;
  createdAt?: string;
}

export interface ReprintResponse {
  reprintId?: number | string;
  prescriptionId?: number | string;
  printedAt?: string;
  reason?: string;
}

export interface PrintOutputResponse {
  prescriptionNumber?: string;
  patientName?: string;
  patientMrn?: string;
  doctorName?: string;
  registrationNumber?: string;
  department?: string;
  medicines?: Array<{
    medicineName?: string;
    strength?: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
  }>;
  advice?: {
    general?: string;
    diet?: string;
    precautions?: string;
  };
  followUpDate?: string;
  digitalSeal?: string;
}

export const prescriptionApi = {
  /**
   * GET /api/v1/patients/me/prescriptions
   * GET /api/v1/patients/{mrn}/prescriptions
   * GET /api/v1/patient/prescriptions
   */
  getPrescriptions: async (mrn?: string): Promise<ApiPatientPrescription[]> => {
    const endpoints = mrn
      ? [
          `/api/v1/patients/${encodeURIComponent(mrn)}/prescriptions`,
          `/api/v1/patient/prescriptions?mrn=${encodeURIComponent(mrn)}`,
          `/api/v1/patients/me/prescriptions`,
        ]
      : ["/api/v1/patients/me/prescriptions", "/api/v1/patient/prescriptions"];

    for (const url of endpoints) {
      try {
        const response = await apiClient.get<
          | ApiResponseBody<ApiPatientPrescription[]>
          | ApiEnvelope<ApiPatientPrescription[]>
        >(url);
        const body = response.data as Record<string, unknown>;
        if (!body) continue;

        if (Array.isArray(body)) {
          return body as ApiPatientPrescription[];
        }

        const dataVal = body.data || body.content;
        if (Array.isArray(dataVal)) {
          return dataVal as ApiPatientPrescription[];
        }

        if (
          dataVal &&
          typeof dataVal === "object" &&
          Array.isArray((dataVal as { content?: unknown }).content)
        ) {
          return (dataVal as { content: ApiPatientPrescription[] }).content;
        }
      } catch (err) {
        console.log(err);
        // try next endpoint
      }
    }
    return [];
  },

  /**
   * GET /api/v1/patient/prescriptions/{id}
   * GET /api/v1/patients/me/prescriptions/{id}
   * GET /api/v1/prescriptions/{id}
   */
  getPrescriptionById: async (
    id: string | number,
  ): Promise<ApiPatientPrescription | PrescriptionDetailResponse | null> => {
    const num = Number(id);
    const isNumericDbId =
      /^\d+$/.test(String(id)) && num > 0 && num < 10000000000;
    const endpoints: string[] = [];
    if (isNumericDbId) {
      endpoints.push(`/api/v1/encounters/${id}/prescription`);
    }
    endpoints.push(
      `/api/v1/prescriptions/${id}`,
      `/api/v1/patient/prescriptions/${id}`,
      `/api/v1/patients/me/prescriptions/${id}`,
    );

    for (const url of endpoints) {
      try {
        const response = await apiClient.get<Record<string, unknown>>(url);
        const data = response.data?.data || response.data;
        if (data && typeof data === "object") {
          return data as unknown as
            | ApiPatientPrescription
            | PrescriptionDetailResponse;
        }
      } catch (err) {
        console.log(err);
        // try next fallback
      }
    }
    return null;
  },

  /**
   * GET /api/v1/prescriptions/{prescriptionId}
   */
  getPrescriptionDetails: async (
    prescriptionId: string | number,
  ): Promise<PrescriptionDetailResponse | Record<string, unknown> | null> => {
    const num = Number(prescriptionId);
    const isNumericDbId =
      /^\d+$/.test(String(prescriptionId)) && num > 0 && num < 10000000000;
    const endpoints: string[] = [];
    if (isNumericDbId) {
      endpoints.push(`/api/v1/encounters/${prescriptionId}/prescription`);
    }
    endpoints.push(
      `/api/v1/prescriptions/${prescriptionId}`,
      `/api/v1/patient/prescriptions/${prescriptionId}`,
      `/api/v1/patients/me/prescriptions/${prescriptionId}`,
    );

    for (const url of endpoints) {
      try {
        const response = await apiClient.get<Record<string, unknown>>(url);
        const data = response.data?.data || response.data;
        if (data && typeof data === "object") {
          return data as Record<string, unknown>;
        }
      } catch (err) {
        console.log(err);
        // try next fallback
      }
    }
    return null;
  },

  /**
   * GET /api/v1/patients/me/prescriptions/summary
   */
  getPatientSummary: async (): Promise<PrescriptionSummaryResponse | null> => {
    const endpoints = [
      "/api/v1/patients/me/prescriptions/summary",
      "/api/v1/patient/prescriptions/summary",
      "/api/v1/doctor/prescriptions/summary",
    ];

    for (const url of endpoints) {
      try {
        const response = await apiClient.get<Record<string, unknown>>(url);
        const data = (response.data?.data ||
          response.data) as PrescriptionSummaryResponse;
        if (data) return data;
      } catch (err) {
        console.log(err);
        // try next
      }
    }
    return null;
  },

  /**
   * POST /api/v1/prescriptions/{prescriptionId}/medications
   */
  addMedication: async (
    prescriptionId: string | number,
    payload: Record<string, unknown>,
  ) => {
    const response = await apiClient.post(
      `/api/v1/prescriptions/${prescriptionId}/medications`,
      payload,
    );
    return response.data;
  },

  /**
   * PUT /api/v1/prescriptions/{prescriptionId}/medications/{medicationId}
   */
  updateMedication: async (
    prescriptionId: string | number,
    medicationId: string | number,
    payload: Record<string, unknown>,
  ) => {
    const response = await apiClient.put(
      `/api/v1/prescriptions/${prescriptionId}/medications/${medicationId}`,
      payload,
    );
    return response.data;
  },

  /**
   * DELETE /api/v1/prescriptions/{prescriptionId}/medications/{medicationId}
   */
  deleteMedication: async (
    prescriptionId: string | number,
    medicationId: string | number,
  ) => {
    const response = await apiClient.delete(
      `/api/v1/prescriptions/${prescriptionId}/medications/${medicationId}`,
    );
    return response.data;
  },

  /**
   * PUT /api/v1/prescriptions/{prescriptionId}/advice
   */
  updateAdvice: async (
    prescriptionId: string | number,
    payload: Record<string, unknown>,
  ) => {
    const response = await apiClient.put(
      `/api/v1/prescriptions/${prescriptionId}/advice`,
      payload,
    );
    return response.data;
  },

  /**
   * POST /api/v1/prescriptions/{prescriptionId}/validate
   */
  validatePrescription: async (prescriptionId: string | number) => {
    const response = await apiClient.post(
      `/api/v1/prescriptions/${prescriptionId}/validate`,
    );
    return response.data;
  },

  /**
   * GET /api/v1/encounters/{encounterId}/prescription
   */
  getEncounterPrescription: async (
    encounterId: string | number,
  ): Promise<ApiPatientPrescription | null> => {
    try {
      const response = await apiClient.get<ApiPatientPrescription>(
        `/api/v1/encounters/${encounterId}/prescription`,
      );
      return response.data || null;
    } catch (err) {
      console.log(err);
      return null;
    }
  },

  /**
   * POST /api/v1/prescriptions/{prescriptionId}/finalize
   */
  finalizePrescription: async (
    prescriptionId: string | number,
    payload: { confirmation: boolean } = { confirmation: true },
  ): Promise<ApiPatientPrescription> => {
    const response = await apiClient.post<ApiPatientPrescription>(
      `/api/v1/prescriptions/${prescriptionId}/finalize`,
      payload,
    );
    return response.data;
  },

  /**
   * POST /api/v1/prescriptions/{prescriptionId}/amendments
   */
  createAmendment: async (
    prescriptionId: string | number,
    payload?: { reason?: string },
  ) => {
    try {
      const response = await apiClient.post<ApiResponseBody<AmendmentResponse>>(
        `/api/v1/prescriptions/${prescriptionId}/amendments`,
        payload || {},
      );
      return unwrap<AmendmentResponse>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * POST /api/v1/prescriptions/{prescriptionId}/reprint
   */
  reprintPrescription: async (
    prescriptionId: string | number,
    payload?: { reason?: string },
  ) => {
    try {
      const response = await apiClient.post<ApiResponseBody<ReprintResponse>>(
        `/api/v1/prescriptions/${prescriptionId}/reprint`,
        payload || {},
      );
      return unwrap<ReprintResponse>(response.data);
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  /**
   * GET /api/v1/prescriptions/{prescriptionId}/print-output
   */
  getPrintOutput: async (
    prescriptionId: string | number,
  ): Promise<PrintOutputResponse | null> => {
    try {
      const response = await apiClient.get<PrintOutputResponse>(
        `/api/v1/prescriptions/${prescriptionId}/print-output`,
      );
      return response.data || null;
    } catch (err) {
      console.log(err);
      return null;
    }
  },

  /**
   * GET /api/v1/doctor/prescriptions/summary
   */
  getDoctorSummary: async (): Promise<PrescriptionSummaryResponse | null> => {
    try {
      const response = await apiClient.get<PrescriptionSummaryResponse>(
        "/api/v1/doctor/prescriptions/summary",
      );
      return response.data || null;
    } catch (err) {
      console.log(err);
      return null;
    }
  },

  /**
   * GET /api/v1/doctors/{id}/prescriptions
   */
  getDoctorPrescriptions: async (
    doctorId: string | number,
  ): Promise<ApiPatientPrescription[]> => {
    try {
      const response = await apiClient.get<
        ApiResponseBody<ApiPatientPrescription[]>
      >(`/api/v1/doctors/${doctorId}/prescriptions`);
      const body = response.data;
      if (Array.isArray(body)) return body;
      if (body && typeof body === "object" && "data" in body) {
        const inner = body.data;
        if (Array.isArray(inner)) return inner;
      }
      return [];
    } catch (err) {
      console.log(err);
      return [];
    }
  },

  /**
   * GET /api/v1/patients/{mrn}/prescriptions
   * Patient-specific endpoint — returns paginated prescriptions for a patient.
   */
  getPatientPrescriptions: async (
    mrn: string,
    params?: {
      page?: number;
      size?: number;
      status?: string;
      fromDate?: string;
      toDate?: string;
    },
  ): Promise<PaginatedResponse<PatientPrescriptionSummary>> => {
    try {
      const query = new URLSearchParams();
      if (params?.page !== undefined) query.set("page", String(params.page));
      if (params?.size !== undefined) query.set("size", String(params.size));
      if (params?.status) query.set("status", params.status);
      if (params?.fromDate) query.set("fromDate", params.fromDate);
      if (params?.toDate) query.set("toDate", params.toDate);
      const qs = query.toString();
      const url = `/api/v1/patients/${encodeURIComponent(mrn)}/prescriptions${qs ? `?${qs}` : ""}`;
      const response =
        await apiClient.get<
          ApiEnvelope<PaginatedResponse<PatientPrescriptionSummary>>
        >(url);
      const envelope = response.data;
      if (envelope?.data) return envelope.data;
      return {
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      };
    } catch (err) {
      console.log(err);
      return {
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
      };
    }
  },

  /**
   * GET /api/v1/patients/{mrn}/prescriptions-history
   */
  getPatientPrescriptionsHistory: async (
    mrn: string,
  ): Promise<ApiPatientPrescription[]> => {
    try {
      const response = await apiClient.get<
        ApiResponseBody<ApiPatientPrescription[]>
      >(`/api/v1/patients/${mrn}/prescriptions-history`);
      const body = response.data;
      if (Array.isArray(body)) return body;
      if (body && typeof body === "object" && "data" in body) {
        const inner = body.data;
        if (Array.isArray(inner)) return inner;
      }
      return [];
    } catch (err) {
      console.log(err);
      return [];
    }
  },
};
