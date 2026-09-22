import { apiClient } from "../../../lib/axios";
import type {
  DashboardApiResponse,
  DoctorDashboardStatistics,
  DoctorCurrentPatient,
  DoctorNextPatient,
  DoctorTodayAppointments,
  DoctorConsultationQueueResponse,
  DoctorMeAppointments,
} from "../types/dashboard.types";

function unwrap<T>(response: { data: DashboardApiResponse<T> | T }): T {
  const body = response.data;
  if (body && typeof body === "object" && "data" in body) {
    return (body as DashboardApiResponse<T>).data;
  }
  return body as T;
}

export const doctorDashboardApi = {
  getStatistics: async (): Promise<DoctorDashboardStatistics> => {
    const res = await apiClient.get<
      DashboardApiResponse<DoctorDashboardStatistics>
    >("/api/v1/doctor/dashboard/statistics");
    return unwrap(res);
  },

  getCurrentPatient: async (): Promise<DoctorCurrentPatient | null> => {
    const res = await apiClient.get<
      DashboardApiResponse<DoctorCurrentPatient | null>
    >("/api/v1/doctor/dashboard/current-patient");
    return unwrap(res);
  },

  getNextPatient: async (): Promise<DoctorNextPatient | null> => {
    const res = await apiClient.get<
      DashboardApiResponse<DoctorNextPatient | null>
    >("/api/v1/doctor/dashboard/next-patient");
    return unwrap(res);
  },

  getTodayAppointments: async (
    doctorId?: string | number,
    date?: string,
  ): Promise<DoctorTodayAppointments> => {
    try {
      const url = doctorId
        ? `/api/v1/doctor/${doctorId}/dashboard/today-appointments${date ? `?date=${date}` : ""}`
        : `/api/v1/doctor/dashboard/today-appointments${date ? `?date=${date}` : ""}`;
      const res =
        await apiClient.get<DashboardApiResponse<DoctorTodayAppointments>>(url);
      return unwrap(res);
    } catch (err) {
      console.log(err);
      const res = await apiClient.get<
        DashboardApiResponse<DoctorTodayAppointments>
      >("/api/v1/doctor/dashboard/today-appointments");
      return unwrap(res);
    }
  },

  getMeAppointments: async (): Promise<DoctorMeAppointments> => {
    const res = await apiClient.get<DashboardApiResponse<DoctorMeAppointments>>(
      "/api/v1/doctors/me/appointments",
    );
    return unwrap(res);
  },

  getConsultationQueue: async (): Promise<DoctorConsultationQueueResponse> => {
    const res = await apiClient.get<
      DashboardApiResponse<DoctorConsultationQueueResponse>
    >("/api/v1/doctors/me/consultation-queue");
    return unwrap(res);
  },

  callToken: async (token: string): Promise<unknown> => {
    const res = await apiClient.patch<DashboardApiResponse<unknown>>(
      `/api/v1/doctor/queue/${token}/call`,
    );
    return unwrap(res);
  },

  completeAppointment: async (appointmentId: string): Promise<unknown> => {
    const res = await apiClient.patch<DashboardApiResponse<unknown>>(
      `/api/v1/doctor/appointments/${appointmentId}/complete`,
    );
    return unwrap(res);
  },
};
