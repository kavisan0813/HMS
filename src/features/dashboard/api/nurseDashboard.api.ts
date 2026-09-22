import { apiClient } from "../../../lib/axios";
import { vitalsApi } from "../../vitals/api/vitals.api";
import type {
  DashboardApiResponse,
  NurseDashboardData,
  NurseVitalsTrend,
  NursePreparationStatus,
  NurseQueue,
  NurseDoctorAssistance,
  NurseDepartments,
  NurseVitalsStatus,
  NursePerformance,
} from "../types/dashboard.types";

function unwrap<T>(response: { data: DashboardApiResponse<T> | T }): T {
  const body = response.data;
  if (body && typeof body === "object" && "data" in body) {
    return (body as DashboardApiResponse<T>).data;
  }
  return body as T;
}

export const nurseDashboardApi = {
  getSummary: async (): Promise<NurseDashboardData> => {
    const res = await apiClient.get<DashboardApiResponse<NurseDashboardData>>(
      "/api/v1/nurse/dashboard",
    );
    return unwrap(res);
  },

  getVitalsTrend: async (): Promise<NurseVitalsTrend> => {
    const res = await apiClient.get<DashboardApiResponse<NurseVitalsTrend>>(
      "/api/v1/nurse/dashboard/vitals-trend",
    );
    return unwrap(res);
  },

  getPreparationStatus: async (): Promise<NursePreparationStatus> => {
    const res = await apiClient.get<
      DashboardApiResponse<NursePreparationStatus>
    >("/api/v1/nurse/dashboard/preparation-status");
    return unwrap(res);
  },

  getQueue: async (page = 0, size = 10): Promise<NurseQueue> => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await apiClient.get<DashboardApiResponse<NurseQueue>>(
        `/api/v1/nurse/queue?date=${today}&page=${page}&size=${size}`,
      );
      return unwrap(res);
    } catch (err) {
      console.log(err);
      const fallbackData = await vitalsApi.getNurseQueue(undefined, page, size);
      return {
        content: fallbackData as unknown as NurseQueue["content"],
        patients: fallbackData as unknown as NurseQueue["patients"],
        waitingForVitals: fallbackData.length,
        page,
        size,
        totalElements: fallbackData.length,
        totalPages: 1,
      };
    }
  },

  getDoctorAssistance: async (): Promise<NurseDoctorAssistance> => {
    const res = await apiClient.get<
      DashboardApiResponse<NurseDoctorAssistance>
    >("/api/v1/nurse/dashboard/doctor-assistance");
    return unwrap(res);
  },

  getDepartments: async (): Promise<NurseDepartments> => {
    const res = await apiClient.get<DashboardApiResponse<NurseDepartments>>(
      "/api/v1/nurse/dashboard/departments",
    );
    return unwrap(res);
  },

  getVitalsStatus: async (): Promise<NurseVitalsStatus> => {
    const res = await apiClient.get<DashboardApiResponse<NurseVitalsStatus>>(
      "/api/v1/nurse/dashboard/vitals-status",
    );
    return unwrap(res);
  },

  getPerformance: async (): Promise<NursePerformance> => {
    const res = await apiClient.get<DashboardApiResponse<NursePerformance>>(
      "/api/v1/nurse/dashboard/performance",
    );
    return unwrap(res);
  },
};
