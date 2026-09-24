import { useState, useCallback } from "react";
import { useSearchParams } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../../auth/store/auth.store";
import type { ReportFilters } from "../services/reports.service";
import {
  fetchDoctorPerformance,
  fetchDailyAppointments,
  fetchDailyAppointmentDetails,
  fetchCollectionRate,
  fetchHospitalDashboard,
  fetchDepartmentConsultationVolume,
  fetchInvoiceRegister,
  fetchInvoiceSummary,
  fetchOperationalTrend,
  fetchPatientRegistrationSummary,
  fetchRevenueVsCollection,
  fetchDailyRevenue,
  fetchDailyRevenueDetails,
  fetchReportCategoryShare,
  fetchMostViewedReports,
  fetchPatientAgeDemographics,
  fetchDepartmentPatientVisits,
  fetchGenderBreakdown,
  fetchPatientMasterRegister,
  fetchAdminReportsDashboard,
  fetchCollectionRateSummary,
  fetchDoctorSelfDailyAppointmentsAnalytics,
  fetchDoctorSelfDailyAppointmentsDashboard,
  fetchDoctorSelfDailyAppointmentRegister,
  fetchDoctorSelfPatientRegister,
  fetchAccountantMainReport,
  fetchAccountantPaymentCollection,
  fetchAccountantRefundLog,
  fetchAccountantTransactionReport,
  fetchPatientDashboard,
  fetchPatientRegistrationTrend,
  fetchCollectionRateAnalytics,
  fetchCollectionRateRegister,
  fetchCollectionRateActivityTrend,
  fetchCollectionRateDepartments,
  fetchCollectionRateStatusShare,
  exportCollectionRateExcel,
  exportCollectionRatePdf,
  fetchDoctorPerformanceById,
  fetchDoctorActivities,
  fetchDoctorWorkload,
  fetchDoctorPatientWorkload,
  fetchDoctorConsultationTrend,
  fetchDoctorConsultationDuration,
  fetchDoctorConsultationStatus,
  exportDoctorPerformanceExcel,
  exportDoctorPerformancePdf,
  fetchAdminAppointmentsReport,
  fetchAdminDepartmentsConsultations,
} from "../services/reports.service";

// ─── Query Key Factories ────────────────────────────────────────────────────

const reportKeys = {
  all: ["reports"] as const,

  doctorPerformance: (f?: ReportFilters) =>
    [...reportKeys.all, "doctor-performance", f] as const,
  dailyAppointments: (f?: ReportFilters) =>
    [...reportKeys.all, "daily-appointments", f] as const,
  dailyAppointmentDetails: (f?: ReportFilters) =>
    [...reportKeys.all, "daily-appointment-details", f] as const,
  collectionRate: (f?: ReportFilters) =>
    [...reportKeys.all, "collection-rate", f] as const,
  hospitalDashboard: (f?: ReportFilters) =>
    [...reportKeys.all, "hospital-dashboard", f] as const,
  departmentConsultationVolume: (f?: ReportFilters) =>
    [...reportKeys.all, "department-consultation-volume", f] as const,
  hospitalDoctorPerformance: (f?: ReportFilters) =>
    [...reportKeys.all, "hospital-doctor-performance", f] as const,
  invoiceRegister: (f?: ReportFilters) =>
    [...reportKeys.all, "invoice-register", f] as const,
  invoiceSummary: (f?: ReportFilters) =>
    [...reportKeys.all, "invoice-summary", f] as const,
  operationalTrend: (f?: ReportFilters) =>
    [...reportKeys.all, "operational-trend", f] as const,
  patientRegistrationSummary: (f?: ReportFilters) =>
    [...reportKeys.all, "patient-registration-summary", f] as const,
  revenueVsCollection: (f?: ReportFilters) =>
    [...reportKeys.all, "revenue-vs-collection", f] as const,
  dailyRevenue: (f?: ReportFilters) =>
    [...reportKeys.all, "daily-revenue", f] as const,
  dailyRevenueDetails: (f?: ReportFilters) =>
    [...reportKeys.all, "daily-revenue-details", f] as const,
  reportCategoryShare: () =>
    [...reportKeys.all, "report-category-share"] as const,
  mostViewedReports: () => [...reportKeys.all, "most-viewed-reports"] as const,
  patientAgeDemographics: (f?: ReportFilters) =>
    [...reportKeys.all, "patient-age-demographics", f] as const,
  patientDashboard: (f?: ReportFilters) =>
    [...reportKeys.all, "patient-dashboard", f] as const,
  departmentPatientVisits: (f?: ReportFilters) =>
    [...reportKeys.all, "department-patient-visits", f] as const,
  doctorPatientWorkload: (f?: ReportFilters) =>
    [...reportKeys.all, "doctor-patient-workload", f] as const,
  genderBreakdown: (f?: ReportFilters) =>
    [...reportKeys.all, "gender-breakdown", f] as const,
  patientMasterRegister: (f?: ReportFilters) =>
    [...reportKeys.all, "patient-master-register", f] as const,
  patientRegistrationTrend: (f?: ReportFilters) =>
    [...reportKeys.all, "patient-registration-trend", f] as const,
  adminReportsDashboard: (f?: ReportFilters) =>
    [...reportKeys.all, "admin-reports-dashboard", f] as const,
  collectionRateSummary: (f?: ReportFilters) =>
    [...reportKeys.all, "collection-rate-summary", f] as const,
  collectionRateAnalytics: (f?: ReportFilters) =>
    [...reportKeys.all, "collection-rate-analytics", f] as const,
  collectionRateRegister: (f?: ReportFilters) =>
    [...reportKeys.all, "collection-rate-register", f] as const,
  collectionRateActivityTrend: (f?: ReportFilters) =>
    [...reportKeys.all, "collection-rate-activity-trend", f] as const,
  collectionRateDepartments: () =>
    [...reportKeys.all, "collection-rate-departments"] as const,
  collectionRateStatusShare: () =>
    [...reportKeys.all, "collection-rate-status-share"] as const,
  doctorPerformanceById: (doctorId: string | number, f?: ReportFilters) =>
    [...reportKeys.all, "doctor-performance-id", doctorId, f] as const,
  doctorActivities: (doctorId: string | number, f?: ReportFilters) =>
    [...reportKeys.all, "doctor-activities", doctorId, f] as const,
  doctorWorkload: (f?: ReportFilters) =>
    [...reportKeys.all, "doctor-workload", f] as const,
  doctorConsultationTrend: (f?: ReportFilters) =>
    [...reportKeys.all, "doctor-consultation-trend", f] as const,
  doctorConsultationDuration: (f?: ReportFilters) =>
    [...reportKeys.all, "doctor-consultation-duration", f] as const,
  doctorConsultationStatus: (f?: ReportFilters) =>
    [...reportKeys.all, "doctor-consultation-status", f] as const,
  adminAppointmentsReport: (f?: ReportFilters) =>
    [...reportKeys.all, "admin-appointments-report", f] as const,
  adminDepartmentsConsultations: (f?: ReportFilters) =>
    [...reportKeys.all, "admin-departments-consultations", f] as const,
  collectionRateExcelExport: (f?: ReportFilters) =>
    [...reportKeys.all, "collection-rate-excel-export", f] as const,
  collectionRatePdfExport: (f?: ReportFilters) =>
    [...reportKeys.all, "collection-rate-pdf-export", f] as const,
  doctorPerformanceExcelExport: (f?: ReportFilters) =>
    [...reportKeys.all, "doctor-performance-excel-export", f] as const,
  doctorPerformancePdfExport: (f?: ReportFilters) =>
    [...reportKeys.all, "doctor-performance-pdf-export", f] as const,
};

export { extractList } from "../services/reports.service";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDefaultFilters(filters?: ReportFilters): ReportFilters {
  const today = new Date().toISOString().slice(0, 10);
  const defaultStart = "2025-01-01";
  return {
    fromDate: filters?.fromDate || defaultStart,
    toDate: filters?.toDate || today,
    date: filters?.date,
    doctorId: filters?.doctorId,
    departmentId: filters?.departmentId,
    status: filters?.status,
    appointmentType: filters?.appointmentType,
    visitType: filters?.visitType,
    gender: filters?.gender,
    ageGroup: filters?.ageGroup,
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
    period: filters?.period,
    paymentStatus: filters?.paymentStatus,
    paymentMethod: filters?.paymentMethod,
    search: filters?.search,
    sort: filters?.sort,
    interval: filters?.interval,
    patientId: filters?.patientId,
  };
}

// ─── Navigation Hook (preserved) ────────────────────────────────────────────

export function useReports() {
  const role = useAuthStore((s) => s.user?.role);
  const r = String(role ?? "").toUpperCase();

  const [searchParams, setSearchParams] = useSearchParams();
  const reportParam = searchParams.get("report");
  const kpiParam = searchParams.get("kpi");

  const [localActiveView, setLocalActiveView] = useState<string | null>(null);
  const [localKpi, setLocalKpi] = useState<string | null>(null);

  const activeView = reportParam || localActiveView;
  const activeKpi = kpiParam || localKpi;

  const handleOpenReport = useCallback(
    (view: string) => {
      setSearchParams({ report: view });
      setLocalActiveView(view);
    },
    [setSearchParams],
  );

  const handleOpenKpi = useCallback(
    (kpi?: string) => {
      const kpiVal = kpi || "Collection Rate";
      setSearchParams({ kpi: kpiVal });
      setLocalKpi(kpiVal);
    },
    [setSearchParams],
  );

  const handleBack = useCallback(() => {
    setSearchParams({});
    setLocalActiveView(null);
    setLocalKpi(null);
  }, [setSearchParams]);

  return {
    role: r,
    activeView,
    activeKpi,
    handleOpenReport,
    handleOpenKpi,
    handleBack,
  };
}

// ─── Data Fetching Hooks ────────────────────────────────────────────────────

// 1. Doctor Performance Summary
export function useDoctorPerformance(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.doctorPerformance(f),
    queryFn: () => fetchDoctorPerformance(f),
    enabled: true,
    staleTime: 60_000,
  });
}

// 2. Daily Appointments Report
export function useDailyAppointments(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.dailyAppointments(f),
    queryFn: () => fetchDailyAppointments(f),
    enabled: true,
    staleTime: 60_000,
  });
}

// 3. Daily Appointments Detail
export function useDailyAppointmentDetails(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.dailyAppointmentDetails(f),
    queryFn: () => fetchDailyAppointmentDetails(f),
    enabled: true,
    staleTime: 60_000,
  });
}

// 4. Collection Rate
export function useCollectionRate(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.collectionRate(f),
    queryFn: () => fetchCollectionRate(f),
    enabled: true,
    staleTime: 60_000,
  });
}

// 5. Hospital Dashboard
export function useHospitalDashboard(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.hospitalDashboard(f),
    queryFn: () => fetchHospitalDashboard(f),
    enabled: true,
    staleTime: 60_000,
  });
}

// 6. Department Consultation Volume
export function useDepartmentConsultationVolume(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.departmentConsultationVolume(f),
    queryFn: () => fetchDepartmentConsultationVolume(f),
    enabled: true,
    staleTime: 60_000,
  });
}

// 8. Invoice Register Detail
export function useInvoiceRegister(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.invoiceRegister(f),
    queryFn: () => fetchInvoiceRegister(f),
    enabled: true,
    staleTime: 60_000,
  });
}

// 9. Invoice Summary
export function useInvoiceSummary(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.invoiceSummary(f),
    queryFn: () => fetchInvoiceSummary(f),
    enabled: true,
    staleTime: 60_000,
  });
}

// 10. Hospital Operational Trend
export function useOperationalTrend(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.operationalTrend(f),
    queryFn: () => fetchOperationalTrend(f),
    enabled: true,
    staleTime: 60_000,
  });
}

// 11. Patient Registration Summary
export function usePatientRegistrationSummary(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.patientRegistrationSummary(f),
    queryFn: () => fetchPatientRegistrationSummary(f),
    enabled: true,
    staleTime: 60_000,
  });
}

// 13. Revenue vs Collection
export function useRevenueVsCollection(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.revenueVsCollection(f),
    queryFn: () => fetchRevenueVsCollection(f),
    enabled: true,
    staleTime: 60_000,
  });
}

// 14. Daily Revenue
export function useDailyRevenue(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.dailyRevenue(f),
    queryFn: () => fetchDailyRevenue(f),
    enabled: true,
    staleTime: 60_000,
  });
}

// 15. Daily Revenue Detail
export function useDailyRevenueDetails(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.dailyRevenueDetails(f),
    queryFn: () => fetchDailyRevenueDetails(f),
    enabled: true,
    staleTime: 60_000,
  });
}

// 16. Report Category Share
export function useReportCategoryShare() {
  return useQuery({
    queryKey: reportKeys.reportCategoryShare(),
    queryFn: fetchReportCategoryShare,
    staleTime: 120_000,
  });
}

// 17. Most Viewed Reports
export function useMostViewedReports() {
  return useQuery({
    queryKey: reportKeys.mostViewedReports(),
    queryFn: fetchMostViewedReports,
    staleTime: 120_000,
  });
}

// 18. Patient Age Demographics
export function usePatientAgeDemographics() {
  return useQuery({
    queryKey: [...reportKeys.all, "patient-age-demographics"] as const,
    queryFn: () => fetchPatientAgeDemographics(),
    staleTime: 60_000,
  });
}

// 20. Department Patient Visits
export function useDepartmentPatientVisits(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.departmentPatientVisits(f),
    queryFn: () => fetchDepartmentPatientVisits(f),
    enabled: true,
    staleTime: 60_000,
  });
}

// 22. Gender Breakdown
export function useGenderBreakdown(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.genderBreakdown(f),
    queryFn: () => fetchGenderBreakdown(f),
    enabled: true,
    staleTime: 60_000,
  });
}

// 23. Patient Master Register
export function usePatientMasterRegister(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.patientMasterRegister(f),
    queryFn: () => fetchPatientMasterRegister(f),
    enabled: true,
    staleTime: 60_000,
  });
}

// 25. Admin Reports Dashboard
export function useAdminReportsDashboard(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.adminReportsDashboard(f),
    queryFn: () => fetchAdminReportsDashboard(f),
    enabled: true,
    staleTime: 60_000,
  });
}

// 28. Collection Rate Summary
export function useCollectionRateSummary(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.collectionRateSummary(f),
    queryFn: () => fetchCollectionRateSummary(f),
    enabled: true,
    staleTime: 60_000,
  });
}

// ─── Doctor Personal Practice Reports Hooks (/api/v1/doctors/me/reports/**) ──

export function useDoctorSelfDailyAppointmentsAnalytics(params?: {
  date?: string;
  period?: string;
}) {
  return useQuery({
    queryKey: [
      ...reportKeys.all,
      "doctor-self-appointments-analytics",
      params,
    ] as const,
    queryFn: () => fetchDoctorSelfDailyAppointmentsAnalytics(params),
    staleTime: 60_000,
  });
}

export function useDoctorSelfDailyAppointmentsDashboard(date?: string) {
  return useQuery({
    queryKey: [
      ...reportKeys.all,
      "doctor-self-appointments-dashboard",
      date,
    ] as const,
    queryFn: () => fetchDoctorSelfDailyAppointmentsDashboard(date),
    staleTime: 60_000,
  });
}

export function useDoctorSelfDailyAppointmentRegister(params?: {
  date?: string;
  page?: number;
  size?: number;
}) {
  return useQuery({
    queryKey: [
      ...reportKeys.all,
      "doctor-self-appointments-register",
      params,
    ] as const,
    queryFn: () => fetchDoctorSelfDailyAppointmentRegister(params),
    staleTime: 60_000,
  });
}

export function useDoctorSelfPatientRegister(params?: {
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}) {
  return useQuery({
    queryKey: [
      ...reportKeys.all,
      "doctor-self-patient-register",
      params,
    ] as const,
    queryFn: () => fetchDoctorSelfPatientRegister(params),
    staleTime: 60_000,
  });
}

// ─── Accountant Financial Reports Hooks (/api/v1/accountant/reports/**) ──────

export function useAccountantMainReport(params?: {
  fromDate?: string;
  toDate?: string;
  type?: string;
}) {
  return useQuery({
    queryKey: [...reportKeys.all, "accountant-main-report", params] as const,
    queryFn: () => fetchAccountantMainReport(params),
    staleTime: 60_000,
  });
}

export function useAccountantPaymentCollection(params?: {
  fromDate?: string;
  toDate?: string;
  paymentMethod?: string;
}) {
  return useQuery({
    queryKey: [
      ...reportKeys.all,
      "accountant-payment-collection",
      params,
    ] as const,
    queryFn: () => fetchAccountantPaymentCollection(params),
    staleTime: 60_000,
  });
}

export function useAccountantRefundLog(params?: {
  fromDate?: string;
  toDate?: string;
}) {
  return useQuery({
    queryKey: [...reportKeys.all, "accountant-refund-log", params] as const,
    queryFn: () => fetchAccountantRefundLog(params),
    staleTime: 60_000,
  });
}

export function useAccountantTransactionReport(params?: {
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}) {
  return useQuery({
    queryKey: [
      ...reportKeys.all,
      "accountant-transaction-report",
      params,
    ] as const,
    queryFn: () => fetchAccountantTransactionReport(params),
    staleTime: 60_000,
  });
}

// ─── Additional Hospital Admin Hooks ──────────────────────────────────────────

export function usePatientDashboard(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.patientDashboard(f),
    queryFn: () => fetchPatientDashboard(f),
    enabled: true,
    staleTime: 60_000,
  });
}

export function usePatientRegistrationTrend(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.patientRegistrationTrend(f),
    queryFn: () => fetchPatientRegistrationTrend(f),
    enabled: true,
    staleTime: 60_000,
  });
}

export function useCollectionRateAnalytics(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.collectionRateAnalytics(f),
    queryFn: () => fetchCollectionRateAnalytics(f),
    enabled: true,
    staleTime: 60_000,
  });
}

export function useCollectionRateRegister(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.collectionRateRegister(f),
    queryFn: () => fetchCollectionRateRegister(f),
    enabled: true,
    staleTime: 60_000,
  });
}

export function useCollectionRateActivityTrend(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.collectionRateActivityTrend(f),
    queryFn: () => fetchCollectionRateActivityTrend(f),
    enabled: true,
    staleTime: 60_000,
  });
}

export function useCollectionRateDepartments() {
  return useQuery({
    queryKey: reportKeys.collectionRateDepartments(),
    queryFn: fetchCollectionRateDepartments,
    staleTime: 120_000,
  });
}

export function useCollectionRateStatusShare() {
  return useQuery({
    queryKey: reportKeys.collectionRateStatusShare(),
    queryFn: fetchCollectionRateStatusShare,
    staleTime: 120_000,
  });
}

export function useDoctorPerformanceById(
  doctorId: string | number,
  filters?: ReportFilters,
) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.doctorPerformanceById(doctorId, f),
    queryFn: () => fetchDoctorPerformanceById(doctorId, f),
    enabled: Boolean(doctorId),
    staleTime: 60_000,
  });
}

export function useDoctorActivities(
  doctorId: string | number,
  filters?: ReportFilters,
) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.doctorActivities(doctorId, f),
    queryFn: () => fetchDoctorActivities(doctorId, f),
    enabled: Boolean(doctorId),
    staleTime: 60_000,
  });
}

export function useDoctorPatientWorkload(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.doctorPatientWorkload(f),
    queryFn: () => fetchDoctorPatientWorkload(f),
    staleTime: 60_000,
  });
}

export function useDoctorWorkload(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.doctorWorkload(f),
    queryFn: () => fetchDoctorWorkload(f),
    enabled: true,
    staleTime: 60_000,
  });
}

export function useDoctorConsultationTrend(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.doctorConsultationTrend(f),
    queryFn: () => fetchDoctorConsultationTrend(f),
    enabled: true,
    staleTime: 60_000,
  });
}

export function useDoctorConsultationDuration(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.doctorConsultationDuration(f),
    queryFn: () => fetchDoctorConsultationDuration(f),
    enabled: true,
    staleTime: 60_000,
  });
}

export function useDoctorConsultationStatus(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.doctorConsultationStatus(f),
    queryFn: () => fetchDoctorConsultationStatus(f),
    enabled: true,
    staleTime: 60_000,
  });
}

export function useExportCollectionRateExcel(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useMutation({
    mutationFn: () => exportCollectionRateExcel(f),
  });
}

export function useExportCollectionRatePdf(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useMutation({
    mutationFn: () => exportCollectionRatePdf(f),
  });
}

export function useExportDoctorPerformanceExcel(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useMutation({
    mutationFn: () => exportDoctorPerformanceExcel(f),
  });
}

export function useExportDoctorPerformancePdf(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useMutation({
    mutationFn: () => exportDoctorPerformancePdf(f),
  });
}

export function useAdminAppointmentsReport(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.adminAppointmentsReport(f),
    queryFn: () => fetchAdminAppointmentsReport(f),
    enabled: true,
    staleTime: 60_000,
  });
}

export function useAdminDepartmentsConsultations(filters?: ReportFilters) {
  const f = getDefaultFilters(filters);
  return useQuery({
    queryKey: reportKeys.adminDepartmentsConsultations(f),
    queryFn: () => fetchAdminDepartmentsConsultations(f),
    enabled: true,
    staleTime: 60_000,
  });
}
