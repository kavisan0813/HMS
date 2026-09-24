import { apiClient } from "../../../lib/axios";
import type {
  DashboardApiResponse,
  ReceptionSummaryData,
  ReceptionRegistrationTrend,
  ReceptionAppointmentStatus,
  ReceptionPatientsByDepartment,
  ReceptionRegistrationCategories,
  ReceptionPerformanceSummary,
} from "../types/dashboard.types";

function unwrap<T>(response: { data: DashboardApiResponse<T> | T }): T {
  const body = response.data;
  if (body && typeof body === "object" && "data" in body) {
    return (body as DashboardApiResponse<T>).data;
  }
  return body as T;
}

export const receptionDashboardApi = {
  getSummary: async (): Promise<ReceptionSummaryData> => {
    const res = await apiClient.get<DashboardApiResponse<ReceptionSummaryData>>(
      "/api/v1/reception/dashboard/summary",
    );
    return unwrap(res);
  },

  getRegistrationTrend: async (): Promise<ReceptionRegistrationTrend> => {
    const res = await apiClient.get<
      DashboardApiResponse<ReceptionRegistrationTrend>
    >("/api/v1/reception/dashboard/registration-trend");
    return unwrap(res);
  },

  getAppointmentStatus: async (): Promise<ReceptionAppointmentStatus> => {
    const res = await apiClient.get<
      DashboardApiResponse<ReceptionAppointmentStatus>
    >("/api/v1/reception/dashboard/appointment-status");
    return unwrap(res);
  },

  getPatientsByDepartment: async (): Promise<ReceptionPatientsByDepartment> => {
    const res = await apiClient.get<
      DashboardApiResponse<ReceptionPatientsByDepartment>
    >("/api/v1/reception/dashboard/patients-by-department");
    return unwrap(res);
  },

  getRegistrationCategories:
    async (): Promise<ReceptionRegistrationCategories> => {
      const res = await apiClient.get<
        DashboardApiResponse<ReceptionRegistrationCategories>
      >("/api/v1/reception/dashboard/registration-categories");
      return unwrap(res);
    },

  getPerformanceSummary: async (): Promise<ReceptionPerformanceSummary> => {
    const res = await apiClient.get<
      DashboardApiResponse<ReceptionPerformanceSummary>
    >("/api/v1/reception/dashboard/performance-summary");
    return unwrap(res);
  },

  getQueue: async (): Promise<
    Array<{
      token: string;
      patientName: string;
      mrn: string;
      doctorName: string;
      departmentName: string;
      appointmentTime: string;
      queuePosition: number;
      status: string;
    }>
  > => {
    const res = await apiClient.get<unknown>("/api/v1/reception/queue");
    const rawData = res.data as { data?: unknown } | unknown[];
    const rawList = Array.isArray(rawData)
      ? rawData
      : Array.isArray((rawData as { data?: unknown })?.data)
        ? ((rawData as { data?: unknown }).data as unknown[])
        : [];
    return rawList.map((itemVal: unknown, idx: number) => {
      const item = itemVal as Record<string, unknown>;
      return {
        token:
          (item.tokenNumber as string) ||
          (item.queueToken as string) ||
          `TK-${100 + idx + 1}`,
        patientName:
          (item.patientName as string) ||
          ((item.patient as Record<string, unknown>)?.fullName as string) ||
          ((item.patient as Record<string, unknown>)?.name as string) ||
          "Patient",
        mrn:
          (item.mrn as string) ||
          ((item.patient as Record<string, unknown>)?.mrn as string) ||
          `MRN-${100 + idx + 1}`,
        doctorName:
          (item.doctorName as string) ||
          ((item.doctor as Record<string, unknown>)?.fullName as string) ||
          ((item.doctor as Record<string, unknown>)?.name as string) ||
          "",
        departmentName:
          (item.departmentName as string) ||
          ((item.department as Record<string, unknown>)?.name as string) ||
          "",
        appointmentTime:
          (item.appointmentTime as string) ||
          (item.timeSlot as string) ||
          (item.startTime as string) ||
          "--",
        queuePosition: (item.queuePosition as number) || idx + 1,
        status:
          (item.queueStatus as string) || (item.status as string) || "WAITING",
      };
    });
  },
};
