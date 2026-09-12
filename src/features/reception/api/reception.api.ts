import { apiClient, axios } from "../../../lib/axios";
import type {
  ReceptionQueueItem,
  ArrivalCheckInPayload,
  WalkInRegistrationPayload,
  QueueStatus,
  BillingStatus,
} from "../types/reception.types";

export interface PatchCheckInResponse {
  success?: boolean;
  appointmentId?: string | number;
  tokenNumber?: string;
}

export interface AppointmentTokenResponse {
  tokenNumber?: string;
  token?: string;
}

interface RawQueueItem {
  id?: string | number;
  queueItemId?: string | number;
  appointmentId?: string | number;
  tokenNumber?: string;
  queueToken?: string;
  patientId?: string | number;
  patient?: {
    id?: string | number;
    fullName?: string;
    name?: string;
    mrn?: string;
    mobile?: string;
    phone?: string;
    gender?: string;
    age?: string | number;
    dateOfBirth?: string;
  };
  patientName?: string;
  mrn?: string;
  mobile?: string;
  gender?: string;
  age?: string | number;
  dateOfBirth?: string;
  appointmentTime?: string;
  timeSlot?: string;
  arrivalTime?: string;
  checkInTime?: string;
  checkInTimestamp?: string;
  departmentId?: string | number;
  department?: {
    id?: string | number;
    name?: string;
  };
  departmentName?: string;
  doctorId?: string | number;
  doctor?: {
    id?: string | number;
    fullName?: string;
    name?: string;
  };
  doctorName?: string;
  queueStatus?: string;
  status?: string;
  billingStatus?: string;
  paymentStatus?: string;
  consultationFee?: number;
  visitType?: "WALK_IN" | "APPOINTMENT" | "FOLLOW_UP" | "EMERGENCY";
  notes?: string;
}

function mapRawToQueueItem(itemVal: unknown, idx: number): ReceptionQueueItem {
  const item = itemVal as RawQueueItem;
  return {
    id: item.id || item.queueItemId || item.appointmentId || `item-${idx + 1}`,
    tokenNumber: item.tokenNumber || item.queueToken || `TK-${100 + idx + 1}`,
    patientId: item.patientId || item.patient?.id || `P-${idx + 1}`,
    patientName:
      item.patientName ||
      item.patient?.fullName ||
      item.patient?.name ||
      "Patient",
    mrn: item.mrn || item.patient?.mrn || `MRN-${202600 + idx + 1}`,
    mobile: item.mobile || item.patient?.mobile || item.patient?.phone || "N/A",
    gender: item.gender || item.patient?.gender || "MALE",
    age: item.age || item.patient?.age || "30",
    dateOfBirth: item.dateOfBirth || item.patient?.dateOfBirth,
    appointmentId: item.appointmentId || item.id,
    appointmentTime: item.appointmentTime || item.timeSlot || "09:00 AM",
    arrivalTime: item.arrivalTime || item.checkInTime || undefined,
    checkInTimestamp: item.checkInTimestamp || item.checkInTime || undefined,
    departmentId: item.departmentId || item.department?.id || 1,
    departmentName:
      item.departmentName || item.department?.name || "General Medicine",
    doctorId: item.doctorId || item.doctor?.id || 1,
    doctorName:
      item.doctorName ||
      item.doctor?.fullName ||
      item.doctor?.name ||
      "Duty Doctor",
    queueStatus: (item.queueStatus || item.status || "WAITING") as QueueStatus,
    billingStatus: (item.billingStatus ||
      item.paymentStatus ||
      "PAID") as BillingStatus,
    consultationFee: item.consultationFee || 500,
    visitType: item.visitType || "APPOINTMENT",
    notes: item.notes || undefined,
  };
}

export const receptionApi = {
  /**
   * GET /api/v1/reception/worklist or /api/v1/appointments/today
   * Fetch current-day reception queue worklist
   */
  async getWorklist(params?: {
    date?: string;
    departmentId?: string;
    doctorId?: string;
    status?: string;
    search?: string;
  }): Promise<ReceptionQueueItem[]> {
    try {
      let res;
      const queryParams = new URLSearchParams();
      if (params?.date) queryParams.append("date", params.date);
      if (params?.departmentId)
        queryParams.append("departmentId", params.departmentId);
      if (params?.doctorId) queryParams.append("doctorId", params.doctorId);
      if (params?.status) queryParams.append("status", params.status);
      if (params?.search) queryParams.append("search", params.search);

      const qStr = queryParams.toString() ? `?${queryParams.toString()}` : "";

      try {
        res = await apiClient.get<unknown>(`/api/v1/reception/worklist${qStr}`);
      } catch (err) {
        if (
          axios.isAxiosError(err) &&
          (err.response?.status === 404 || err.response?.status === 403)
        ) {
          res = await apiClient.get<unknown>(`/api/v1/appointments${qStr}`);
        } else {
          throw err;
        }
      }

      const resData = res.data as
        | { data?: unknown; content?: unknown }
        | unknown[]
        | undefined;
      const list = Array.isArray(resData)
        ? resData
        : Array.isArray((resData as { data?: unknown })?.data)
          ? ((resData as { data?: unknown }).data as unknown[])
          : Array.isArray((resData as { content?: unknown })?.content)
            ? ((resData as { content?: unknown }).content as unknown[])
            : [];

      return list.map(mapRawToQueueItem);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string } | undefined;
        if (data?.message) {
          throw new Error(data.message, { cause: error });
        }
      }
      throw error;
    }
  },

  /**
   * POST /api/v1/reception/check-in
   * Arrival check-in with server timestamp
   */
  async checkInPatient(
    payload: ArrivalCheckInPayload,
  ): Promise<{ success: boolean; checkInTime: string; tokenNumber: string }> {
    try {
      const res = await apiClient.post<{
        data?: { checkInTime?: string; tokenNumber?: string };
      }>("/api/v1/reception/check-in", payload);
      return {
        success: true,
        checkInTime: res.data?.data?.checkInTime || new Date().toISOString(),
        tokenNumber:
          res.data?.data?.tokenNumber ||
          `TK-${Math.floor(100 + Math.random() * 900)}`,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string } | undefined;
        if (data?.message) {
          throw new Error(data.message, { cause: error });
        }
      }
      throw error;
    }
  },

  /**
   * POST /api/v1/reception/walk-in
   * Register walk-in patient + instant queue token creation
   */
  async registerWalkIn(
    payload: WalkInRegistrationPayload,
  ): Promise<ReceptionQueueItem> {
    try {
      interface WalkInResponse {
        id?: string | number;
        tokenNumber?: string;
        patientId?: string | number;
        mrn?: string;
        data?: WalkInResponse;
      }
      const res = await apiClient.post<WalkInResponse>(
        "/api/v1/reception/walk-in",
        payload,
      );
      const data = res.data?.data || res.data;
      return {
        id: data?.id || Date.now(),
        tokenNumber:
          data?.tokenNumber ||
          `WK-${100 + (window.crypto.getRandomValues(new Uint32Array(1))[0] % 900)}`,
        patientId: data?.patientId || `P-${Date.now()}`,
        patientName: payload.fullName,
        mrn: data?.mrn || `MRN-${Date.now().toString().slice(-6)}`,
        mobile: payload.mobile,
        gender: payload.gender,
        age: payload.age || 25,
        appointmentTime: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        arrivalTime: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        departmentId: payload.departmentId,
        departmentName: "Cardiology",
        doctorId: payload.doctorId,
        doctorName: "Dr. Duty Doctor",
        queueStatus: "WAITING",
        billingStatus: payload.paymentMode === "PENDING" ? "PENDING" : "PAID",
        consultationFee: payload.consultationFee,
        visitType: "WALK_IN",
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string } | undefined;
        if (data?.message) {
          throw new Error(data.message, { cause: error });
        }
      }
      throw error;
    }
  },

  /**
   * PUT /api/v1/reception/queue/{id}/status
   * Update queue status
   */
  async updateQueueStatus(
    queueItemId: string | number,
    status: QueueStatus,
  ): Promise<boolean> {
    try {
      await apiClient.put(`/api/v1/reception/queue/${queueItemId}/status`, {
        status,
      });
      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string } | undefined;
        if (data?.message) {
          throw new Error(data.message, { cause: error });
        }
      }
      throw error;
    }
  },

  /**
   * PATCH /api/v1/reception/appointments/{appointmentId}/check-in
   */
  async patchCheckIn(
    appointmentId: string | number,
  ): Promise<PatchCheckInResponse> {
    try {
      const res = await apiClient.patch<unknown>(
        `/api/v1/reception/appointments/${appointmentId}/check-in`,
        {},
      );

      return res.data as PatchCheckInResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string } | undefined;
        if (data?.message) {
          throw new Error(data.message, { cause: error });
        }
      }
      throw error;
    }
  },

  /**
   * GET /api/v1/reception/appointments/{appointmentId}/token
   */
  async getAppointmentToken(
    appointmentId: string | number,
  ): Promise<AppointmentTokenResponse> {
    try {
      const res = await apiClient.get<unknown>(
        `/api/v1/reception/appointments/${appointmentId}/token`,
      );
      return res.data as AppointmentTokenResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string } | undefined;
        if (data?.message) {
          throw new Error(data.message, { cause: error });
        }
      }
      throw error;
    }
  },

  /**
   * GET /api/v1/reception/queue
   */
  async getReceptionQueue(): Promise<ReceptionQueueItem[]> {
    try {
      const res = await apiClient.get<unknown>(`/api/v1/reception/queue`);
      const rawData = res.data as { data?: unknown } | unknown[];
      const rawList = Array.isArray(rawData)
        ? rawData
        : Array.isArray((rawData as { data?: unknown })?.data)
          ? ((rawData as { data?: unknown }).data as unknown[])
          : [];
      return rawList.map(mapRawToQueueItem);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string } | undefined;
        if (data?.message) {
          throw new Error(data.message, { cause: error });
        }
      }
      throw error;
    }
  },
};
