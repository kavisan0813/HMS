import { apiClient, axios } from "../../../lib/axios";
import type {
  QueueItem,
  QueueSummary,
  QueuePage,
  QueueListParams,
  QueueStatus,
} from "../types/queue.types";

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

export interface QueueListResult {
  summary: QueueSummary;
  content: QueueItem[];
  page: QueuePage;
}

export const queueApi = {
  /**
   * GET /api/v1/doctors/{doctorId}/queue or GET /api/v1/queue
   * Fetch queue list. Uses doctor-specific endpoint when doctorId is provided.
   */
  async getQueueList(params?: QueueListParams): Promise<QueueListResult> {
    try {
      const emptyResult: QueueListResult = {
        summary: { completed: 0, waiting: 0, called: 0, inConsultation: 0 },
        content: [],
        page: { size: 20, totalElements: 0, page: 0 },
      };

      if (!params) return emptyResult;

      const {
        doctorId,
        departmentId,
        date,
        status,
        search,
        page = 0,
        size = 50,
      } = params;

      const query = new URLSearchParams();
      if (date) query.set("date", date);
      if (status) query.set("status", status);
      if (search) query.set("search", search);
      if (page !== undefined) query.set("page", String(page));
      if (size !== undefined) query.set("size", String(size));

      const cleanDoctorId = doctorId
        ? String(doctorId).replace(/^DOC-/, "")
        : null;
      let primaryUrl = `/api/v1/queue?${query.toString()}`;

      if (cleanDoctorId) {
        query.set("doctorId", cleanDoctorId);
        primaryUrl = `/api/v1/doctors/${cleanDoctorId}/queue?${query.toString()}`;
      } else if (departmentId) {
        query.set("departmentId", String(departmentId));
        primaryUrl = `/api/v1/queue?${query.toString()}`;
      }

      const qs = query.toString();
      let response;

      try {
        response = await apiClient.get<Record<string, unknown>>(primaryUrl);
      } catch (err) {
        console.log(err);
        try {
          const fallbackUrl = `/api/v1/queue${qs ? `?${qs}` : ""}`;
          response = await apiClient.get<Record<string, unknown>>(fallbackUrl);
        } catch (err) {
          console.log(err);
          const fallbackUrl2 = `/api/v1/doctors/me/consultation-queue${qs ? `?${qs}` : ""}`;
          response = await apiClient.get<Record<string, unknown>>(fallbackUrl2);
        }
      }

      const payload = response.data as Record<string, unknown>;
      const data = (payload?.data || payload) as Record<string, unknown>;

      if (!data) return emptyResult;

      const summaryRaw = (data?.summary || {}) as Record<string, unknown>;
      const summary: QueueSummary = {
        completed: (summaryRaw.completed as number) ?? 0,
        waiting: (summaryRaw.waiting as number) ?? 0,
        called: (summaryRaw.called as number) ?? 0,
        inConsultation:
          (summaryRaw.inConsultation as number) ??
          (summaryRaw.consulting as number) ??
          0,
      };

      const rawItems = Array.isArray(data?.content)
        ? data.content
        : Array.isArray(data?.queue)
          ? data.queue
          : Array.isArray(data)
            ? data
            : [];

      const content: QueueItem[] = rawItems.map((raw) => {
        const item = raw as Record<string, unknown>;
        const aptObj = (item.appointment || {}) as Record<string, unknown>;
        const patientObj = (item.patient || {}) as Record<string, unknown>;
        const doctorObj = (item.doctor || {}) as Record<string, unknown>;

        const rawAptId =
          item.appointmentId ??
          item.id ??
          aptObj.id ??
          item.aptId ??
          item.appointmentNumber ??
          item.token;

        let numericAptId: number = typeof rawAptId === "number" ? rawAptId : 0;
        if (typeof rawAptId === "string") {
          const parsed = parseInt(rawAptId.split("-").pop() || "", 10);
          if (!isNaN(parsed) && parsed > 0) {
            numericAptId = parsed;
          }
        }
        if (!numericAptId && typeof item.queueId === "number") {
          numericAptId = item.queueId;
        }

        const aptNum =
          (item.appointmentNumber as string) ||
          (aptObj.appointmentNumber as string) ||
          (item.token as string) ||
          "";

        const tokenVal =
          (item.token as string) ||
          (item.appointmentNumber as string) ||
          (item.queueToken as string) ||
          "";

        const checkInTimeVal =
          (item.checkInTime as string) ||
          (item.appointmentTime as string) ||
          (item.createdAt as string) ||
          "";

        return {
          queueId: (item.queueId as number) ?? (item.id as number) ?? 0,
          appointmentId: numericAptId,
          appointmentNumber: aptNum,
          token: tokenVal,
          queueNumber: (item.queueNumber as number) ?? 0,
          position: (item.position as number) ?? 0,
          priority: (item.priority as string) || "NORMAL",
          status: ((item.status as string) ||
            (item.queueStatus as string) ||
            "WAITING") as QueueStatus,
          queueStatus: ((item.queueStatus as string) ||
            (item.status as string) ||
            "WAITING") as QueueStatus,
          checkInTime: checkInTimeVal,
          appointmentTime: checkInTimeVal,
          visitType:
            (item.visitType as string) ||
            (item.appointmentType as string) ||
            "First Visit",
          patient: {
            name:
              (patientObj.name as string) ||
              (item.patientName as string) ||
              (patientObj.fullName as string) ||
              "",
            mrn: (patientObj.mrn as string) || (item.mrn as string) || "",
            age:
              (patientObj.age as number) ??
              (item.patientAge as number) ??
              (item.age as number) ??
              0,
            gender:
              (patientObj.gender as string) ||
              (item.patientGender as string) ||
              (patientObj.sex as string) ||
              "",
            contact:
              (patientObj.contact as string) ||
              (patientObj.phone as string) ||
              (patientObj.mobile as string) ||
              (item.patientPhone as string) ||
              (item.phone as string) ||
              "",
            dateOfBirth:
              (patientObj.dateOfBirth as string) ||
              (patientObj.dob as string) ||
              "",
          },
          doctor: {
            doctorId:
              (doctorObj.doctorId as number) ?? (item.doctorId as number) ?? 0,
            name:
              (doctorObj.name as string) ||
              (item.doctorName as string) ||
              (doctorObj.fullName as string) ||
              "",
            doctorCode:
              (doctorObj.doctorCode as string) ||
              (item.doctorCode as string) ||
              "",
            department:
              (doctorObj.department as string) ||
              (item.departmentName as string) ||
              (item.department as string) ||
              (doctorObj.specialty as string) ||
              "",
            specialty:
              (doctorObj.specialty as string) ||
              (item.specialty as string) ||
              "",
          },
        };
      });

      const pageRaw = (data?.page || {}) as Record<string, unknown>;
      const pageResult: QueuePage = {
        size: (pageRaw.size as number) ?? size,
        totalElements: (pageRaw.totalElements as number) ?? content.length,
        page: (pageRaw.page as number) ?? page,
      };

      return {
        summary,
        content,
        page: pageResult,
      };
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * PATCH /api/v1/queue/{appointmentId}/call
   * Doctor calls a patient from the queue
   */
  async callPatient(
    appointmentId: number | string,
  ): Promise<{ success: boolean; status: string }> {
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
    } catch (error) {
      if (numericId !== appointmentId) {
        try {
          const response = await apiClient.patch<
            | ApiEnvelope<{ success: boolean; status: string }>
            | { success: boolean; status: string }
          >(`/api/v1/queue/${appointmentId}/call`);
          return unwrap(response.data);
        } catch (err) {
          console.log(err);
          // Handled below
        }
      }
      return handleApiError(error);
    }
  },

  /**
   * POST /api/v1/doctors/{doctorId}/queue/call-next
   * Doctor calls next patient in their queue
   */
  async callNext(doctorId: number | string): Promise<{
    action: string;
    appointmentId: number;
    tokenNumber: string;
    queueStatus: string;
  }> {
    try {
      const numericId =
        typeof doctorId === "string" && doctorId.startsWith("DOC-")
          ? doctorId.replace("DOC-", "")
          : doctorId;
      const response = await apiClient.post<
        ApiEnvelope<{
          action: string;
          appointmentId: number;
          tokenNumber: string;
          queueStatus: string;
        }>
      >(`/api/v1/doctors/${numericId}/queue/call-next`);
      return unwrap(response.data);
    } catch (error) {
      return handleApiError(error);
    }
  },
};
