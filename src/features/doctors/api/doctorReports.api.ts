import { apiClient } from "../../../lib/axios";
import type {
  DoctorDailyAnalyticsData,
  DoctorDailyDashboardData,
  DoctorDailyRegisterResponse,
  DoctorPatientAnalyticsData,
  DoctorPatientDashboardData,
  DoctorPatientRegisterResponse,
} from "../types/doctorReports.types";

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  timestamp?: string;
  data: T;
}

function unwrap<T>(res: { data: ApiEnvelope<T> | T }): T {
  const body = res.data;
  if (body && typeof body === "object" && "data" in body) {
    return (body as ApiEnvelope<T>).data;
  }
  return body as T;
}

function buildQuery(
  params: Record<string, string | number | undefined>,
): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== "",
  );
  if (entries.length === 0) return "";
  return (
    "?" +
    entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&")
  );
}

export const doctorReportsApi = {
  // 1. Doctor Daily Appointments Analytics
  getDailyAnalytics: async (params?: {
    date?: string;
    period?: string;
  }): Promise<DoctorDailyAnalyticsData> => {
    const qs = buildQuery({
      date: params?.date,
      period: params?.period,
    });
    const res = await apiClient.get<ApiEnvelope<DoctorDailyAnalyticsData>>(
      `/api/v1/doctors/me/reports/daily-appointments/analytics${qs}`,
    );
    return unwrap(res);
  },

  // 2. Doctor Daily Appointments Dashboard
  getDailyDashboard: async (
    date?: string,
  ): Promise<DoctorDailyDashboardData> => {
    const qs = buildQuery({ date });
    const res = await apiClient.get<ApiEnvelope<DoctorDailyDashboardData>>(
      `/api/v1/doctors/me/reports/daily-appointments/dashboard${qs}`,
    );
    return unwrap(res);
  },

  // 3. Doctor Daily Appointment Register
  getDailyRegister: async (params?: {
    date?: string;
    search?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<DoctorDailyRegisterResponse> => {
    const qs = buildQuery({
      date: params?.date,
      search: params?.search,
      status: params?.status,
      page: params?.page ?? 0,
      size: params?.size ?? 20,
    });
    const res = await apiClient.get<ApiEnvelope<DoctorDailyRegisterResponse>>(
      `/api/v1/doctors/me/reports/daily-appointments/register${qs}`,
    );
    return unwrap(res);
  },

  // 4. Doctor Patient Analytics
  getPatientAnalytics: async (params?: {
    fromDate?: string;
    toDate?: string;
    period?: string;
  }): Promise<DoctorPatientAnalyticsData> => {
    const qs = buildQuery({
      fromDate: params?.fromDate,
      toDate: params?.toDate,
      period: params?.period,
    });
    const res = await apiClient.get<ApiEnvelope<DoctorPatientAnalyticsData>>(
      `/api/v1/doctors/me/reports/patients/analytics${qs}`,
    );
    return unwrap(res);
  },

  // 5. Doctor Patient Dashboard
  getPatientDashboard: async (params?: {
    fromDate?: string;
    toDate?: string;
  }): Promise<DoctorPatientDashboardData> => {
    const qs = buildQuery({
      fromDate: params?.fromDate,
      toDate: params?.toDate,
    });
    const res = await apiClient.get<ApiEnvelope<DoctorPatientDashboardData>>(
      `/api/v1/doctors/me/reports/patients/dashboard${qs}`,
    );
    return unwrap(res);
  },

  // 6. Doctor Patient Register
  getPatientRegister: async (params?: {
    fromDate?: string;
    toDate?: string;
    search?: string;
    followUpStatus?: string;
    page?: number;
    size?: number;
  }): Promise<DoctorPatientRegisterResponse> => {
    const qs = buildQuery({
      fromDate: params?.fromDate,
      toDate: params?.toDate,
      search: params?.search,
      followUpStatus: params?.followUpStatus,
      page: params?.page ?? 0,
      size: params?.size ?? 20,
    });
    const res = await apiClient.get<ApiEnvelope<DoctorPatientRegisterResponse>>(
      `/api/v1/doctors/me/reports/patients/register${qs}`,
    );
    return unwrap(res);
  },
};
