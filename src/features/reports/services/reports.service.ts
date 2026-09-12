import { apiClient } from "../../../lib/axios";
import type {
  ApiEnvelope,
  PaginatedData,
  DoctorPerformancePaginatedData,
  DailyAppointmentSummary,
  DailyAppointmentDetail,
  HospitalDashboardData,
  DepartmentConsultationVolume,
  InvoiceRegisterRecord,
  InvoiceSummaryData,
  OperationalTrendResponse,
  PatientRegistrationSummary,
  RevenueVsCollectionPoint,
  DailyRevenuePoint,
  DailyRevenueDetail,
  ReportCategoryShare,
  MostViewedReport,
  AgeDemographicsResponse,
  DepartmentPatientVisitsResponse,
  GenderBreakdownResponse,
  PatientMasterRegisterRecord,
  PatientDashboardData,
  RegistrationTrendResponse,
  CollectionRateKpiSummaryDto as CollectionRateSummaryData,
  CollectionRateReportDto,
  CollectionRateActivityTrendPoint,
  CollectionRateDepartmentRecord,
  PaymentStatusShareRecord,
  DoctorIndividualPerformance,
  DoctorActivityRecord,
  DoctorWorkloadResponse,
  ConsultationTrendDataPoint,
  ConsultationDurationPoint,
  ConsultationStatusRecord,
  AdminDashboardData,
  AdminAppointmentsResponse,
  DoctorDailyAppointmentsAnalyticsData,
  DoctorDailyAppointmentsDashboardData,
  DoctorDailyAppointmentRegisterResponse,
  DoctorPatientRegisterResponse,
  AccountantMainReportData,
  AccountantPaymentCollectionData,
  AccountantRefundLogData,
  AccountantTransactionRegisterResponse,
} from "../types/reports.types";

function unwrap<T>(response: { data: ApiEnvelope<T> | T }): T {
  const body = response.data;
  if (
    body &&
    typeof body === "object" &&
    "data" in body &&
    (body as { data: unknown }).data !== undefined
  ) {
    return (body as ApiEnvelope<T>).data;
  }
  return body as T;
}

// Robust array unwrapper supporting all backend payload structures
function unwrapArray<T>(response: { data: unknown }): T[] {
  const unwrapped = unwrap(response) as unknown;
  return extractList<T>(unwrapped);
}

export function extractList<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.content)) return obj.content as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.registers)) return obj.registers as T[];
    if (Array.isArray(obj.records)) return obj.records as T[];
    if (Array.isArray(obj.doctors)) return obj.doctors as T[];
    if (Array.isArray(obj.departments)) return obj.departments as T[];
    if (Array.isArray(obj.reports)) return obj.reports as T[];
    if (Array.isArray(obj.categories)) return obj.categories as T[];
    if (
      obj.doctors &&
      typeof obj.doctors === "object" &&
      Array.isArray((obj.doctors as Record<string, unknown>).content)
    ) {
      return (obj.doctors as Record<string, unknown>).content as T[];
    }
  }
  return [];
}

function buildQuery(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const entries = Object.entries(params).filter(
    ([, v]) =>
      v !== undefined &&
      v !== "" &&
      v !== null &&
      v !== "All" &&
      v !== "All Statuses" &&
      v !== "All Types" &&
      v !== "All Departments" &&
      v !== "All Doctors" &&
      v !== "All Visit Types",
  );
  if (entries.length === 0) return "";
  return (
    "?" +
    entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&")
  );
}

export interface ReportFilters {
  fromDate?: string;
  toDate?: string;
  date?: string;
  doctorId?: string | number;
  departmentId?: string | number;
  status?: string;
  appointmentType?: string;
  page?: number;
  size?: number;
  period?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  search?: string;
  visitType?: string;
  gender?: string;
  ageGroup?: string;
  sort?: string;
  interval?: string;
  patientId?: number;
}

export function normalizeReportFilters(
  filters?: ReportFilters,
  overrides?: Record<string, string | number | undefined>,
): Record<string, string | number | undefined> {
  return {
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
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
    ...overrides,
  };
}

// ─── 1. Doctor Performance Summary ──────────────────────────────────────────

export async function fetchDoctorPerformance(
  filters?: ReportFilters,
): Promise<DoctorPerformancePaginatedData> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    departmentId: filters?.departmentId,
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
  });
  const res = await apiClient.get<ApiEnvelope<DoctorPerformancePaginatedData>>(
    `/api/v1/admin/reports/doctors/performance${qs}`,
  );
  return unwrap(res);
}

// ─── 2. Daily Appointments Report ───────────────────────────────────────────

export async function fetchDailyAppointments(
  filters?: ReportFilters,
): Promise<DailyAppointmentSummary> {
  const qs = buildQuery({ date: filters?.date });
  const res = await apiClient.get<ApiEnvelope<DailyAppointmentSummary>>(
    `/api/v1/admin/reports/hospital/appointments/daily${qs}`,
  );
  return unwrap(res);
}

// ─── 3. Daily Appointments Detail ───────────────────────────────────────────

export async function fetchDailyAppointmentDetails(
  filters?: ReportFilters,
): Promise<PaginatedData<DailyAppointmentDetail>> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
  });
  const res = await apiClient.get<
    ApiEnvelope<PaginatedData<DailyAppointmentDetail>>
  >(`/api/v1/admin/reports/hospital/appointments/daily/details${qs}`);
  return unwrap(res);
}

// ─── 4. Collection Rate ─────────────────────────────────────────────────────

export async function fetchCollectionRate(
  filters?: ReportFilters,
): Promise<CollectionRateReportDto> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
  });
  const res = await apiClient.get<ApiEnvelope<CollectionRateReportDto>>(
    `/api/v1/admin/reports/collection-rate${qs}`,
  );
  return unwrap(res);
}

// ─── 5. Hospital Dashboard ──────────────────────────────────────────────────

export async function fetchHospitalDashboard(
  filters?: ReportFilters,
): Promise<HospitalDashboardData> {
  const qs = buildQuery({ date: filters?.date });
  const res = await apiClient.get<ApiEnvelope<HospitalDashboardData>>(
    `/api/v1/admin/reports/hospital/dashboard${qs}`,
  );
  return unwrap(res);
}

// ─── 6. Department Consultation Volume ──────────────────────────────────────

export async function fetchDepartmentConsultationVolume(
  filters?: ReportFilters,
): Promise<{
  fromDate: string;
  toDate: string;
  departments: DepartmentConsultationVolume[];
}> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
  });
  const res = await apiClient.get<
    ApiEnvelope<{
      fromDate: string;
      toDate: string;
      departments: DepartmentConsultationVolume[];
    }>
  >(`/api/v1/admin/reports/hospital/departments/consultation-volume${qs}`);
  return unwrap(res);
}

// ─── 8. Invoice Register Detail ─────────────────────────────────────────────

export async function fetchInvoiceRegister(
  filters?: ReportFilters,
): Promise<PaginatedData<InvoiceRegisterRecord>> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    status: filters?.status,
    patientId: filters?.patientId,
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
  });
  const res = await apiClient.get<
    ApiEnvelope<PaginatedData<InvoiceRegisterRecord>>
  >(`/api/v1/admin/reports/hospital/invoices${qs}`);
  return unwrap(res);
}

// ─── 9. Invoice Summary ─────────────────────────────────────────────────────

export async function fetchInvoiceSummary(
  filters?: ReportFilters,
): Promise<InvoiceSummaryData> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
  });
  const res = await apiClient.get<ApiEnvelope<InvoiceSummaryData>>(
    `/api/v1/admin/reports/hospital/invoices/summary${qs}`,
  );
  return unwrap(res);
}

// ─── 10. Hospital Operational Trend ─────────────────────────────────────────

export async function fetchOperationalTrend(
  filters?: ReportFilters,
): Promise<OperationalTrendResponse> {
  const qs = buildQuery({ period: filters?.period || "7D" });
  const res = await apiClient.get<ApiEnvelope<OperationalTrendResponse>>(
    `/api/v1/admin/reports/hospital/operational-trend${qs}`,
  );
  return unwrap(res);
}

// ─── 11. Patient Registration Summary ───────────────────────────────────────

export async function fetchPatientRegistrationSummary(
  filters?: ReportFilters,
): Promise<PatientRegistrationSummary> {
  const qs = buildQuery({
    date: filters?.date,
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
  });
  const res = await apiClient.get<ApiEnvelope<PatientRegistrationSummary>>(
    `/api/v1/admin/reports/hospital/patient-registrations${qs}`,
  );
  return unwrap(res);
}

// ─── 13. Revenue vs Collection ──────────────────────────────────────────────

export async function fetchRevenueVsCollection(
  filters?: ReportFilters,
): Promise<RevenueVsCollectionPoint[]> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
  });
  const res = await apiClient.get<ApiEnvelope<RevenueVsCollectionPoint[]>>(
    `/api/v1/admin/reports/hospital/revenue-vs-collection${qs}`,
  );
  return unwrapArray(res);
}

// ─── 14. Daily Revenue ──────────────────────────────────────────────────────

export async function fetchDailyRevenue(
  filters?: ReportFilters,
): Promise<DailyRevenuePoint[]> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
  });
  const res = await apiClient.get<ApiEnvelope<DailyRevenuePoint[]>>(
    `/api/v1/admin/reports/hospital/revenue/daily${qs}`,
  );
  return unwrapArray(res);
}

// ─── 15. Daily Revenue Detail ───────────────────────────────────────────────

export async function fetchDailyRevenueDetails(
  filters?: ReportFilters,
): Promise<PaginatedData<DailyRevenueDetail>> {
  const qs = buildQuery(normalizeReportFilters(filters));
  const res = await apiClient.get<
    ApiEnvelope<PaginatedData<DailyRevenueDetail>>
  >(`/api/v1/admin/reports/hospital/revenue/daily/details${qs}`);
  return unwrap(res);
}

// ─── 16. Report Category Share ──────────────────────────────────────────────

export async function fetchReportCategoryShare(): Promise<
  ReportCategoryShare[]
> {
  const res = await apiClient.get<ApiEnvelope<ReportCategoryShare[]>>(
    `/api/v1/admin/reports/usage/category-share`,
  );
  return unwrapArray(res);
}

// ─── 17. Most Viewed Reports ────────────────────────────────────────────────

export async function fetchMostViewedReports(): Promise<MostViewedReport[]> {
  const res = await apiClient.get<ApiEnvelope<MostViewedReport[]>>(
    `/api/v1/admin/reports/usage/most-viewed`,
  );
  return unwrapArray(res);
}

// ─── 18. Patient Age Demographics ───────────────────────────────────────────

export async function fetchPatientAgeDemographics(
  filters?: ReportFilters,
): Promise<AgeDemographicsResponse> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
  });
  const res = await apiClient.get<ApiEnvelope<AgeDemographicsResponse>>(
    `/api/v1/admin/reports/hospital/patients/age-demographics${qs}`,
  );
  return unwrap(res);
}

// ─── 20. Department Patient Visits ──────────────────────────────────────────

export async function fetchDepartmentPatientVisits(
  filters?: ReportFilters,
): Promise<DepartmentPatientVisitsResponse> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
  });
  const res = await apiClient.get<ApiEnvelope<DepartmentPatientVisitsResponse>>(
    `/api/v1/admin/reports/hospital/patients/department-visits${qs}`,
  );
  return unwrap(res);
}

// ─── 22. Gender Breakdown ───────────────────────────────────────────────────

export async function fetchGenderBreakdown(
  filters?: ReportFilters,
): Promise<GenderBreakdownResponse> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    gender: filters?.gender,
    ageGroup: filters?.ageGroup,
  });
  const res = await apiClient.get<ApiEnvelope<GenderBreakdownResponse>>(
    `/api/v1/admin/reports/hospital/patients/gender-breakdown${qs}`,
  );
  return unwrap(res);
}

// ─── 23. Patient Master Register ────────────────────────────────────────────

export async function fetchPatientMasterRegister(
  filters?: ReportFilters,
): Promise<PaginatedData<PatientMasterRegisterRecord>> {
  const qs = buildQuery({
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
    search: filters?.search,
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    gender: filters?.gender,
  });
  const res = await apiClient.get<
    ApiEnvelope<PaginatedData<PatientMasterRegisterRecord>>
  >(`/api/v1/admin/reports/hospital/patients/register${qs}`);
  return unwrap(res);
}

// ─── Modern Core Admin Reports ──────────────────────────────────────────────

export async function fetchAdminReportsDashboard(
  filters?: ReportFilters,
): Promise<AdminDashboardData> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    departmentId: filters?.departmentId,
    doctorId: filters?.doctorId,
  });
  const res = await apiClient.get<ApiEnvelope<AdminDashboardData>>(
    `/api/v1/admin/reports/dashboard${qs}`,
  );
  return unwrap(res);
}

// ─── Modern Collection Rate Reports ─────────────────────────────────────────

export async function fetchCollectionRateSummary(
  filters?: ReportFilters,
): Promise<CollectionRateSummaryData> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    departmentId: filters?.departmentId,
    doctorId: filters?.doctorId,
  });
  const res = await apiClient.get<ApiEnvelope<CollectionRateSummaryData>>(
    `/api/v1/admin/reports/collection-rate/summary${qs}`,
  );
  return unwrap(res);
}

// ─── Doctor Personal Practice Reports APIs (/api/v1/doctors/me/reports/**) ──

export async function fetchDoctorSelfDailyAppointmentsAnalytics(params?: {
  date?: string;
  period?: string;
}): Promise<DoctorDailyAppointmentsAnalyticsData> {
  const qs = buildQuery({
    date: params?.date,
    period: params?.period,
  });
  const res = await apiClient.get<
    ApiEnvelope<DoctorDailyAppointmentsAnalyticsData>
  >(`/api/v1/doctors/me/reports/daily-appointments/analytics${qs}`);
  return unwrap(res);
}

export async function fetchDoctorSelfDailyAppointmentsDashboard(
  date?: string,
): Promise<DoctorDailyAppointmentsDashboardData> {
  const qs = buildQuery({ date });
  const res = await apiClient.get<
    ApiEnvelope<DoctorDailyAppointmentsDashboardData>
  >(`/api/v1/doctors/me/reports/daily-appointments/dashboard${qs}`);
  return unwrap(res);
}

export async function fetchDoctorSelfDailyAppointmentRegister(params?: {
  date?: string;
  page?: number;
  size?: number;
}): Promise<DoctorDailyAppointmentRegisterResponse> {
  const qs = buildQuery({
    date: params?.date,
    page: params?.page ?? 0,
    size: params?.size ?? 20,
  });
  const res = await apiClient.get<
    ApiEnvelope<DoctorDailyAppointmentRegisterResponse>
  >(`/api/v1/doctors/me/reports/daily-appointments/register${qs}`);
  return unwrap(res);
}

export async function fetchDoctorSelfPatientRegister(params?: {
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}): Promise<DoctorPatientRegisterResponse> {
  const qs = buildQuery({
    fromDate: params?.fromDate,
    toDate: params?.toDate,
    page: params?.page ?? 0,
    size: params?.size ?? 20,
  });
  const res = await apiClient.get<ApiEnvelope<DoctorPatientRegisterResponse>>(
    `/api/v1/doctors/me/reports/patients/register${qs}`,
  );
  return unwrap(res);
}

// ─── Accountant Financial Reports APIs (/api/v1/accountant/reports/**) ──────

export async function fetchAccountantMainReport(params?: {
  fromDate?: string;
  toDate?: string;
  type?: string;
}): Promise<AccountantMainReportData> {
  const qs = buildQuery({
    fromDate: params?.fromDate,
    toDate: params?.toDate,
    type: params?.type,
  });
  const res = await apiClient.get<ApiEnvelope<AccountantMainReportData>>(
    `/api/v1/accountant/reports${qs}`,
  );
  return unwrap(res);
}

export async function fetchAccountantPaymentCollection(params?: {
  fromDate?: string;
  toDate?: string;
  paymentMethod?: string;
}): Promise<AccountantPaymentCollectionData> {
  const qs = buildQuery({
    fromDate: params?.fromDate,
    toDate: params?.toDate,
    paymentMethod: params?.paymentMethod,
  });
  const res = await apiClient.get<ApiEnvelope<AccountantPaymentCollectionData>>(
    `/api/v1/accountant/reports/payments${qs}`,
  );
  return unwrap(res);
}

export async function fetchAccountantRefundLog(params?: {
  fromDate?: string;
  toDate?: string;
}): Promise<AccountantRefundLogData> {
  const qs = buildQuery({
    fromDate: params?.fromDate,
    toDate: params?.toDate,
  });
  const res = await apiClient.get<ApiEnvelope<AccountantRefundLogData>>(
    `/api/v1/accountant/reports/refunds${qs}`,
  );
  return unwrap(res);
}

export async function fetchAccountantTransactionReport(params?: {
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}): Promise<AccountantTransactionRegisterResponse> {
  const qs = buildQuery({
    fromDate: params?.fromDate,
    toDate: params?.toDate,
    page: params?.page ?? 0,
    size: params?.size ?? 10,
  });
  const res = await apiClient.get<
    ApiEnvelope<AccountantTransactionRegisterResponse>
  >(`/api/v1/accountant/reports/transactions${qs}`);
  return unwrap(res);
}

export async function exportAccountantCsv(params?: {
  fromDate?: string;
  toDate?: string;
  type?: string;
}): Promise<Blob> {
  const qs = buildQuery({
    fromDate: params?.fromDate,
    toDate: params?.toDate,
    type: params?.type,
  });
  const res = await apiClient.get<Blob>(
    `/api/v1/accountant/reports/export/csv${qs}`,
  );
  return res.data;
}

// ─── Additional Hospital Admin Report APIs ────────────────────────────────────

// Patient Demographics & Master Records
export async function fetchPatientDashboard(
  filters?: ReportFilters,
): Promise<PatientDashboardData> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    departmentId: filters?.departmentId,
    doctorId: filters?.doctorId,
    visitType: filters?.visitType,
  });
  const res = await apiClient.get<ApiEnvelope<PatientDashboardData>>(
    `/api/v1/admin/reports/hospital/patients/dashboard${qs}`,
  );
  return unwrap(res);
}

export async function fetchPatientRegistrationTrend(
  filters?: ReportFilters,
): Promise<RegistrationTrendResponse> {
  const qs = buildQuery({ period: filters?.period || "7D" });
  const res = await apiClient.get<ApiEnvelope<RegistrationTrendResponse>>(
    `/api/v1/admin/reports/hospital/patients/registration-trend${qs}`,
  );
  return unwrap(res);
}

// ─── Billing & Collection Rate Analytics ───────────────────────────────────

export async function fetchCollectionRateAnalytics(
  filters?: ReportFilters,
): Promise<CollectionRateReportDto> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    paymentStatus: filters?.paymentStatus,
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
    sort: filters?.sort ?? "createdAt,desc",
  });
  const res = await apiClient.get<ApiEnvelope<CollectionRateReportDto>>(
    `/api/v1/admin/reports/collection-rate${qs}`,
  );
  return unwrap(res);
}

export async function fetchCollectionRateRegister(
  filters?: ReportFilters,
): Promise<CollectionRateReportDto> {
  const qs = buildQuery({
    search: filters?.search,
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    paymentStatus: filters?.paymentStatus,
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
    sort: filters?.sort ?? "paymentDate,desc",
  });
  const res = await apiClient.get<ApiEnvelope<CollectionRateReportDto>>(
    `/api/v1/admin/reports/collection-rate/register${qs}`,
  );
  return unwrap(res);
}

export async function fetchCollectionRateActivityTrend(
  filters?: ReportFilters,
): Promise<CollectionRateActivityTrendPoint[]> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    interval: filters?.interval ?? "HOUR",
  });
  const res = await apiClient.get<
    ApiEnvelope<CollectionRateActivityTrendPoint[]>
  >(`/api/v1/admin/reports/collection-rate/activity-trend${qs}`);
  return unwrapArray(res);
}

export async function fetchCollectionRateDepartments(): Promise<
  CollectionRateDepartmentRecord[]
> {
  const res = await apiClient.get<
    ApiEnvelope<CollectionRateDepartmentRecord[]>
  >(`/api/v1/admin/reports/collection-rate/departments`);
  return unwrapArray(res);
}

export async function fetchCollectionRateStatusShare(): Promise<
  PaymentStatusShareRecord[]
> {
  const res = await apiClient.get<ApiEnvelope<PaymentStatusShareRecord[]>>(
    `/api/v1/admin/reports/collection-rate/status-share`,
  );
  return unwrapArray(res);
}

export async function exportCollectionRateExcel(
  filters?: ReportFilters,
): Promise<Blob> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    departmentId: filters?.departmentId,
    doctorId: filters?.doctorId,
  });
  const res = await apiClient.get<Blob>(
    `/api/v1/admin/reports/collection-rate/export/excel${qs}`,
  );
  return res.data;
}

export async function exportCollectionRatePdf(
  filters?: ReportFilters,
): Promise<Blob> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    departmentId: filters?.departmentId,
    doctorId: filters?.doctorId,
  });
  const res = await apiClient.get<Blob>(
    `/api/v1/admin/reports/collection-rate/export/pdf${qs}`,
  );
  return res.data;
}

// Doctor Performance & Workload
export async function fetchDoctorPerformanceById(
  doctorId: string | number,
  filters?: ReportFilters,
): Promise<DoctorIndividualPerformance> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
  });
  const res = await apiClient.get<ApiEnvelope<DoctorIndividualPerformance>>(
    `/api/v1/admin/reports/doctors/${doctorId}/performance${qs}`,
  );
  return unwrap(res);
}

export async function fetchDoctorActivities(
  doctorId: string | number,
  filters?: ReportFilters,
): Promise<PaginatedData<DoctorActivityRecord>> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
  });
  const res = await apiClient.get<
    ApiEnvelope<PaginatedData<DoctorActivityRecord>>
  >(`/api/v1/admin/reports/doctors/${doctorId}/activities${qs}`);
  return unwrap(res);
}

export async function fetchDoctorWorkload(
  filters?: ReportFilters,
): Promise<DoctorWorkloadResponse> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    departmentId: filters?.departmentId,
  });
  const res = await apiClient.get<ApiEnvelope<DoctorWorkloadResponse>>(
    `/api/v1/admin/reports/doctors/workload${qs}`,
  );
  return unwrap(res);
}

export async function fetchDoctorPatientWorkload(
  filters?: ReportFilters,
): Promise<DoctorWorkloadResponse> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    departmentId: filters?.departmentId,
  });
  const res = await apiClient.get<ApiEnvelope<DoctorWorkloadResponse>>(
    `/api/v1/admin/reports/hospital/patients/doctor-workload${qs}`,
  );
  return unwrap(res);
}

export async function fetchDoctorConsultationTrend(
  filters?: ReportFilters,
): Promise<ConsultationTrendDataPoint[]> {
  const qs = buildQuery(normalizeReportFilters(filters));
  const res = await apiClient.get<ApiEnvelope<ConsultationTrendDataPoint[]>>(
    `/api/v1/admin/reports/doctors/consultation-trend${qs}`,
  );
  return unwrapArray(res);
}

export async function fetchDoctorConsultationDuration(
  filters?: ReportFilters,
): Promise<ConsultationDurationPoint[]> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    doctorId: filters?.doctorId,
    interval: filters?.interval,
  });
  const res = await apiClient.get<ApiEnvelope<ConsultationDurationPoint[]>>(
    `/api/v1/admin/reports/doctors/consultation-duration${qs}`,
  );
  return unwrapArray(res);
}

export async function fetchDoctorConsultationStatus(
  filters?: ReportFilters,
): Promise<ConsultationStatusRecord[]> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    doctorId: filters?.doctorId,
    departmentId: filters?.departmentId,
  });
  const res = await apiClient.get<ApiEnvelope<ConsultationStatusRecord[]>>(
    `/api/v1/admin/reports/doctors/consultation-status${qs}`,
  );
  return unwrapArray(res);
}

export async function exportDoctorPerformanceExcel(
  filters?: ReportFilters,
): Promise<Blob> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    departmentId: filters?.departmentId,
    doctorId: filters?.doctorId,
  });
  const res = await apiClient.get<Blob>(
    `/api/v1/admin/reports/doctors/performance/export/excel${qs}`,
  );
  return res.data;
}

export async function exportDoctorPerformancePdf(
  filters?: ReportFilters,
): Promise<Blob> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    departmentId: filters?.departmentId,
    doctorId: filters?.doctorId,
  });
  const res = await apiClient.get<Blob>(
    `/api/v1/admin/reports/doctors/performance/export/pdf${qs}`,
  );
  return res.data;
}

// Overview Dashboards & Appointments
export async function fetchAdminAppointmentsReport(
  filters?: ReportFilters,
): Promise<AdminAppointmentsResponse> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
    doctorId: filters?.doctorId,
    status: filters?.status,
    page: filters?.page ?? 0,
    size: filters?.size ?? 20,
  });
  const res = await apiClient.get<ApiEnvelope<AdminAppointmentsResponse>>(
    `/api/v1/admin/reports/appointments${qs}`,
  );
  return unwrap(res);
}

export async function fetchAdminDepartmentsConsultations(
  filters?: ReportFilters,
): Promise<{
  fromDate: string;
  toDate: string;
  departments: DepartmentConsultationVolume[];
}> {
  const qs = buildQuery({
    fromDate: filters?.fromDate,
    toDate: filters?.toDate,
  });
  const res = await apiClient.get<
    ApiEnvelope<{
      fromDate: string;
      toDate: string;
      departments: DepartmentConsultationVolume[];
    }>
  >(`/api/v1/admin/reports/hospital/departments/consultation-volume${qs}`);
  return unwrap(res);
}
