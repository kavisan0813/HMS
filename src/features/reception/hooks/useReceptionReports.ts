import { useQuery } from "@tanstack/react-query";
import { receptionReportsApi } from "../api/receptionReports.api";

const receptionReportKeys = {
  all: ["reception-reports"] as const,
  activityLog: (params?: { date?: string; page?: number; size?: number }) =>
    [...receptionReportKeys.all, "activity-log", params] as const,
  appointmentStatus: (date?: string) =>
    [...receptionReportKeys.all, "appointment-status", date] as const,
  checkinAnalytics: (date?: string) =>
    [...receptionReportKeys.all, "checkin-analytics", date] as const,
  dashboardSummary: (date?: string) =>
    [...receptionReportKeys.all, "dashboard-summary", date] as const,
  queuePerformance: (date?: string) =>
    [...receptionReportKeys.all, "queue-performance", date] as const,
  register: (params?: {
    date?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }) => [...receptionReportKeys.all, "register", params] as const,
  registrationTrend: (params?: { from?: string; to?: string }) =>
    [...receptionReportKeys.all, "registration-trend", params] as const,
  summaryWidget: (date?: string) =>
    [...receptionReportKeys.all, "summary-widget", date] as const,
};

// 1. Reception Activity Logs Hook
export function useReceptionActivityLog(params?: {
  date?: string;
  page?: number;
  size?: number;
}) {
  return useQuery({
    queryKey: receptionReportKeys.activityLog(params),
    queryFn: () => receptionReportsApi.getActivityLog(params),
    staleTime: 60_000,
  });
}

// 2. Appointment Status Distribution Hook
export function useReceptionAppointmentStatus(date?: string) {
  return useQuery({
    queryKey: receptionReportKeys.appointmentStatus(date),
    queryFn: () => receptionReportsApi.getAppointmentStatus(date),
    staleTime: 60_000,
  });
}

// 3. Check-in Analytics Hook
export function useReceptionCheckinAnalytics(date?: string) {
  return useQuery({
    queryKey: receptionReportKeys.checkinAnalytics(date),
    queryFn: () => receptionReportsApi.getCheckinAnalytics(date),
    staleTime: 60_000,
  });
}

// 4. Reception Dashboard Summary Hook
export function useReceptionDashboardSummary(date?: string) {
  return useQuery({
    queryKey: receptionReportKeys.dashboardSummary(date),
    queryFn: () => receptionReportsApi.getDashboardSummary(date),
    staleTime: 60_000,
  });
}

// 5. Queue Performance Hook
export function useReceptionQueuePerformance(date?: string) {
  return useQuery({
    queryKey: receptionReportKeys.queuePerformance(date),
    queryFn: () => receptionReportsApi.getQueuePerformance(date),
    staleTime: 60_000,
  });
}

// 6. Recent Reception Register Hook
export function useReceptionRegister(params?: {
  date?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}) {
  return useQuery({
    queryKey: receptionReportKeys.register(params),
    queryFn: () => receptionReportsApi.getRegister(params),
    staleTime: 60_000,
  });
}

// 7. Patient Registration Trend Hook
export function useReceptionRegistrationTrend(params?: {
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: receptionReportKeys.registrationTrend(params),
    queryFn: () => receptionReportsApi.getRegistrationTrend(params),
    staleTime: 60_000,
  });
}

// 8. Reception Summary Widget Hook
export function useReceptionSummaryWidget(date?: string) {
  return useQuery({
    queryKey: receptionReportKeys.summaryWidget(date),
    queryFn: () => receptionReportsApi.getSummaryWidget(date),
    staleTime: 60_000,
  });
}
