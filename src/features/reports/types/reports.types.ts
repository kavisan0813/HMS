import type { ReactNode } from "react";

// Core shared interfaces
export interface DoctorSummaryPerformanceRecord {
  id: string;
  doctorName: string;
  department: string;
  appointments: number;
  completed: number;
  cancelled: number;
  revenue: number;
  rating: number;
  avatar: string;
}

export interface AvailableReportCard {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  lastGenerated: string;
  views: number;
  format: string;
}

// Appointment types
export interface AppointmentReportRecord {
  id: string;
  patientName: string;
  mrn: string;
  doctorName: string;
  department: string;
  appointmentDate: string;
  appointmentTime: string;
  visitType: "New Visit" | "Follow-up" | "Walk-in" | "Emergency";
  status: "Completed" | "Scheduled" | "Waiting" | "Cancelled" | "No Show";
}

// Revenue types
export interface RevenueReportRecord {
  id: string;
  patientName: string;
  mrn: string;
  doctorName: string;
  department: string;
  invoiceDate: string;
  invoiceAmount: number;
  collectedAmount: number;
  outstandingAmount: number;
  paymentMethod: "Cash" | "Card" | "UPI" | "Bank Transfer";
  paymentStatus: "Paid" | "Partially Paid" | "Pending" | "Cancelled";
}

// Patient types
export interface PatientReportRecord {
  mrn: string;
  patientName: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  mobile: string;
  department: string;
  doctorName: string;
  registrationDate: string;
  lastVisit: string;
  visitType: "New Visit" | "Follow-up" | "Walk-in" | "Emergency";
  status: "Active" | "Completed" | "Pending Follow-up";
}

// Doctor report types
export interface DoctorReportRecord {
  doctorId: string;
  doctorName: string;
  department: string;
  appointments: number;
  completed: number;
  pending: number;
  cancelled: number;
  followup: number;
  avgTimeMinutes: number;
  patientRating: number;
}

// Billing types
export interface BillingReportRecord {
  invoiceId: string;
  patientName: string;
  mrn: string;
  doctorName: string;
  department: string;
  invoiceDate: string;
  invoiceAmount: number;
  collectedAmount: number;
  outstandingAmount: number;
  paymentMethod: "Cash" | "Card" | "UPI" | "Bank Transfer";
  paymentStatus: "Paid" | "Pending" | "Partially Paid" | "Cancelled";
}

// KPI types
export interface KpiRevenueRecord {
  invoiceId: string;
  patientName: string;
  mrn: string;
  doctorName: string;
  department: string;
  invoiceDate: string;
  paymentMethod: "Cash" | "Card" | "UPI" | "Bank Transfer";
  invoiceAmount: number;
  collectedAmount: number;
  invoiceStatus: "Paid" | "Partially Paid" | "Pending" | "Cancelled";
}

export interface KpiAppointmentRecord {
  appointmentId: string;
  patientName: string;
  mrn: string;
  doctorName: string;
  department: string;
  visitType: "New Visit" | "Follow-up" | "Walk-in" | "Emergency";
  appointmentTime: string;
  tokenNumber: string;
  appointmentStatus: "Scheduled" | "Checked-In" | "Completed" | "Cancelled";
}

export interface KpiPatientRecord {
  patientId: string;
  patientName: string;
  mrn: string;
  gender: "Male" | "Female" | "Other";
  age: number;
  registrationDate: string;
  registeredBy: string;
  visitType: "New Visit" | "Follow-up" | "Walk-in" | "Emergency";
}

export interface KpiConsultationRecord {
  consultationId: string;
  patientName: string;
  doctorName: string;
  department: string;
  consultationTime: string;
  durationMinutes: number;
  status: "Completed" | "In-Progress" | "Cancelled";
}
export interface KpiPendingPaymentRecord {
  invoiceId: string;
  patientName: string;
  doctorName: string;
  department: string;
  pendingAmount: number;
  dueDate: string;
  status: "Pending" | "Overdue" | "Partially Paid";
}

export type DoctorKpiKey =
  | "today-appointments"
  | "completed-consultations"
  | "my-patients"
  | "returning-patients"
  | "followup-patients"
  | "avg-consult-time"
  | "patient-satisfaction";

// ─── Backend API Response Types ──────────────────────────────────────────────

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  timestamp: string;
  data: T;
}

export interface PaginatedData<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// 1. Admin Dashboard Summary (ReportDashboardSummaryDto)
export interface AdminDashboardData {
  totalPatients: number;
  totalDoctors: number;
  totalAppointments: number;
  completedConsultations: number;
  pendingConsultations: number;
  cancelledConsultations: number;
  followUpConsultations: number;
  averageConsultationDurationMinutes: number;
  doctorUtilizationPercentage: number;
  patientSatisfaction: number | null;
  totalRevenue: number;
  collectionRate: number;
}

export interface AdminAppointmentRecord {
  appointmentId: string;
  patientName: string;
  doctorName: string;
  departmentName: string;
  scheduledTime: string;
  status: string;
}

export interface DepartmentConsultationRecord {
  department: string;
  totalConsultations: number;
}

// 4. Collection Rate Summary (CollectionRateKpiSummaryDto)
export interface CollectionRateSummaryData {
  totalConsultations: number;
  previousPeriodConsultations: number;
  consultationGrowthPercentage: number;
  averageConsultationDurationMinutes: number;
  completionRate: number;
  totalBilledAmount: number;
  totalCollectedAmount: number;
  collectionRate: number;
}

// 5. Hospital Dashboard (HospitalDashboardResponse)
export interface HospitalDashboardData {
  reportDate: string;
  dailyAppointments: {
    total: number;
    percentageChange: number;
    comparison: string;
    done: number;
    cancelled: number;
    pending: number;
  };
  patientRegistrations: {
    total: number;
    percentageChange: number;
    comparison: string;
    newPatients: number;
    returningPatients: number;
    walkIn: number;
  };
  dailyRevenue: {
    total: number;
    currency: string;
    percentageChange: number;
    collected: number;
    outstanding: number;
  };
  invoiceSummary: {
    total: number;
    collectionRate: number;
    paid: number;
    pending: number;
    voidInvoices: number;
  };
  doctorPerformance: {
    averageConsultationTimeMinutes: number;
    completionRate: number;
    averageRating: number;
  };
  collectionRate: {
    rate: number;
    collected: number;
  };
}

// 6. Department Consultation Volume
export interface DepartmentConsultationVolume {
  departmentId: string;
  departmentName: string;
  consultationCount: number;
}

// 8. Invoice Register Detail (PageInvoiceDetailResponse)
export interface InvoiceRegisterRecord {
  billId: number;
  invoiceNumber: string;
  patientName: string;
  patientMrn: string;
  mrn?: string;
  doctorName: string;
  department: string;
  invoiceDate: string;
  createdDate: string;
  billedAmount: number;
  totalAmount: number;
  paidAmount: number;
  collectedAmount: number;
  outstandingAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  id: string;
  paymentId: string;
  receiptNumber: string;
  amount: number;
  paidAt: string;
  dueDate?: string;
  status: string;
}

// 9. Invoice Summary (InvoiceSummaryResponse)
export interface InvoiceSummaryData {
  totalInvoices: number;
  totalBilledAmount: number;
  totalPaidAmount: number;
  totalOutstandingAmount: number;
  paidInvoices: number;
  unpaidInvoices: number;
  voidInvoices: number;
  collectionRate: number;
}

// 10. Hospital Operational Trend (operational-trend returns { period, data })
export interface OperationalTrendPoint {
  date: string;
  appointments: number;
  registrations: number;
}

export interface OperationalTrendResponse {
  period: string;
  data: OperationalTrendPoint[];
}

// 11. Patient Registration Summary (patient-registrations)
export interface PatientRegistrationSummary {
  date: string;
  total: number;
  totalRegistrations: number;
  percentageChange: number;
  newPatients: number;
  returningPatients: number;
  walkInPatients: number;
}

// 13. Revenue vs Collection
export interface RevenueVsCollectionPoint {
  outstanding: number;
  revenue: number;
  month: string;
  date: string;
  billed: number;
  collected: number;
}

// 14. Daily Revenue
export interface DailyRevenuePoint {
  invoiceDate: ReactNode;
  mrn: ReactNode;
  patientName: ReactNode;
  invoiceId: ReactNode;
  grandTotal: number | string | ReactNode;
  amountPaid: number | string | ReactNode;
  balance: number | string | ReactNode;
  paymentMethod: ReactNode;
  paymentStatus: string;
  collectedBy: ReactNode;
  date: string;
  amount: number;
}

// 15. Daily Revenue Detail
export interface DailyRevenueDetail {
  invoiceNumber: string;
  patientName: string;
  mrn: string;
  patientId: string;
  doctorName: string;
  department: string;
  invoiceDate: string;
  createdDate: string;
  billedAmount: number;
  totalAmount: number;
  paidAmount: number;
  collectedAmount: number;
  outstandingAmount: number;
  paymentStatus: string;
  id: string;
  paymentId: string;
  receiptNumber: string;
  paymentMethod: string;
  amount: number;
  paidAt: string;
}

// 16. Report Category Share
export interface ReportCategoryShare {
  color: string;
  category: string;
  viewCount: number;
  percentage: number;
}

// 17. Most Viewed Reports
export interface MostViewedReport {
  reportName: string;
  path: string;
  viewCount: number;
}

// 18. Patient Age Demographics (PatientAgeDemographicsResponse)
export interface AgeGroupPoint {
  ageGroup: string;
  count: number;
  percentage: number;
}

export interface AgeDemographicsResponse {
  data: AgeGroupPoint[];
}

// 20. Department Patient Visits (DepartmentPatientVisitsResponse)
export interface DepartmentVisitDto {
  departmentId: string;
  departmentName: string;
  patientVisits: number;
}

export interface DepartmentPatientVisitsResponse {
  departments: DepartmentVisitDto[];
}

// 22. Gender Breakdown (PatientGenderBreakdownResponse)
export interface GenderPointDto {
  gender: string;
  count: number;
  percentage: number;
  label: string;
  value: number;
}

export interface GenderBreakdownResponse {
  totalPatients: number;
  data: GenderPointDto[];
  breakdown: GenderPointDto[];
  maleCount: number;
  femaleCount: number;
  otherCount: number;
  totalCount: number;
}

// 23. Patient Master Register (PagePatientReportRowResponse)
export interface PatientMasterRegisterRecord {
  patientId: string;
  mrn: string;
  fullName: string;
  patientName: string;
  age: number;
  gender: string;
  mobile: string;
  phone: string;
  departmentId: string;
  departmentName: string;
  department: string;
  doctorId: string;
  doctorName: string;
  registrationDate: string;
  createdDate: string;
  visitType: string;
  status: string;
}

// Alias for backward compatibility with existing page code
export type PatientMasterRecord = PatientMasterRegisterRecord;

// ─── Doctor Personal Practice Reports Interfaces ─────────────────────────────

export interface DoctorDailyAppointmentsAnalyticsData {
  statusBreakdown: {
    completed: number;
    scheduled: number;
    cancelled: number;
    waiting: number;
  };
  appointmentTrend: Array<{
    date: string;
    appointments: number;
    completed: number;
  }>;
  dailyWorkload: Array<{
    shift: string;
    appointments: number;
    completed: number;
  }>;
  visitTypeDistribution: Array<{
    visitType: string;
    count: number;
  }>;
}

interface DoctorPracticeSummary {
  myPatients: number;
  newPatients: number;
  returningPatients: number;
  completedConsultations: number;
  scheduledFollowUps: number;
  averagePatientsPerDay: number;
  todayConsultations: number;
  monthlyConsultations: number;
}

export interface DoctorDailyAppointmentsDashboardData {
  doctor: {
    doctorId: string;
    doctorName: string;
    department: string;
  };
  reportDate: string;
  lastUpdated: string;
  summary: DoctorPracticeSummary;
}

interface DoctorDailyAppointmentRegisterItem {
  appointmentId: string;
  patientId: string;
  patientName: string;
  mrn: string;
  appointmentDate: string;
  appointmentTime: string;
  visitType: string;
  appointmentStatus: string;
  consultationStatus: string;
  chiefComplaint?: string;
  shift?: string;
}

export interface DoctorDailyAppointmentRegisterResponse {
  content: DoctorDailyAppointmentRegisterItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface DoctorPatientRegisterItem {
  patientId: string;
  patientName: string;
  mrn: string;
  lastConsultationDate: string;
  totalConsultations: number;
  lastVisitType: string;
  nextFollowUpDate: string;
  followUpStatus: string;
}

export interface DoctorPatientRegisterResponse {
  content: DoctorPatientRegisterItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ─── Accountant Financial Reports Interfaces ─────────────────────────────────

export interface AccountantMainReportData {
  revenueTrends: Array<{
    date: string;
    amount: number;
  }>;
  collectionTrends: Array<{
    date: string;
    amount: number;
  }>;
  paymentStatusDistribution: {
    paid: number;
    pending: number;
    partial: number;
    cancelled: number;
  };
  monthlyPerformance: {
    totalRevenue: number;
    totalInvoices: number;
    averageDailyRevenue: number;
  };
  billingAnalysis: Array<{
    billingType: string;
    amount: number;
    count: number;
  }>;
  financialSummary: {
    totalBilled: number;
    totalCollected: number;
    totalPending: number;
    totalRefunded: number;
  };
  reportTable: Array<{
    date: string;
    invoiceId: string;
    patientName: string;
    billType: string;
    billedAmount: number;
    paidAmount: number;
    paymentMethod: string;
    status: string;
  }>;
}

interface AccountantPaymentMethodItem {
  paymentMethod: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface AccountantPaymentCollectionData {
  fromDate: string;
  toDate: string;
  totalCollectedAmount: number;
  totalTransactions: number;
  methodBreakdown: AccountantPaymentMethodItem[];
}

export interface AccountantRefundItem {
  refundId?: string;
  invoiceId?: string;
  patientName?: string;
  amount?: number;
  reason?: string;
  refundedAt?: string;
}

export interface AccountantRefundLogData {
  fromDate: string;
  toDate: string;
  totalRefundedAmount: number;
  totalRefundedBills: number;
  refunds: AccountantRefundItem[];
}

interface AccountantTransactionItem {
  paymentNumber: string;
  invoiceId: string;
  patientName: string;
  amount: number;
  paymentMethod: string;
  status: string;
  referenceNumber: string;
  transactionDate: string;
}

export interface AccountantTransactionRegisterResponse {
  content: AccountantTransactionItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// ─── Patient Demographics & Master Records ─────────────────────────────────

export interface PatientDashboardData {
  dateRange: {
    from: string;
    to: string;
  };
  totalRegisteredPatients: {
    count: number;
    percentageChange: number;
    comparison: string;
  };
  newPatients: {
    count: number;
    percentageChange: number;
    comparison: string;
  };
  returningPatients: {
    count: number;
    percentageChange: number;
    comparison: string;
    repeatCount: number;
    followUpCount: number;
  };
  walkInPatients: {
    count: number;
    scheduledAppointments: number;
  };
  genderDistribution: {
    male: number;
    female: number;
    other: number;
  };
  emergencyVisits: number;
  averageAge: number;
  malePercentage: number;
  femalePercentage: number;
  otherPercentage: number;
  averageDailyRegistrations: number;
  totalPatients: number;
  patientSummary: {
    totalPatients: number;
    newPatients: number;
    returningPatients: number;
    walkIns: number;
    averageDailyIntake: number;
    mostActiveDepartment: {
      departmentId: string;
      departmentName: string;
    };
  };
}

export interface PatientMasterRegisterResponse {
  content: PatientMasterRegisterRecord[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface GenderBreakdownItem {
  label: string;
  value: number;
  percentage: number;
}

export interface AgeGroupItem {
  range: string;
  count: number;
  percentage: number;
}

export interface RegistrationTrendDataPoint {
  date: string;
  newPatients: number;
  returningPatients: number;
}

export interface RegistrationTrendResponse {
  period: string;
  data: RegistrationTrendDataPoint[];
  dataPoints: RegistrationTrendDataPoint[];
}

// ─── Billing & Collection Rate Analytics (Actual API responses) ─────────────

// /api/v1/admin/reports/collection-rate returns CollectionRateReportDto
export interface CollectionRateReportDto {
  summary: {
    totalBilled: number;
    totalCollected: number;
    outstandingAmount: number;
    collectionRate: number;
  };
  content: CollectionRateItemDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CollectionRateItemDto {
  patientId: string;
  patientName: string;
  mrn: string;
  department: string;
  doctorName: string;
  visitType: string;
  billedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentStatus: string;
}

// /api/v1/admin/reports/collection-rate/summary returns CollectionRateKpiSummaryDto
export interface CollectionRateKpiSummaryDto {
  totalConsultations: number;
  previousPeriodConsultations: number;
  consultationGrowthPercentage: number;
  averageConsultationDurationMinutes: number;
  completionRate: number;
  totalBilledAmount: number;
  totalCollectedAmount: number;
  totalPendingAmount: number;
  collectionRate: number;
  collectionRatePercentage: number;
}

// /api/v1/admin/reports/collection-rate/register returns same structure as /collection-rate (CollectionRateReportDto)
export interface CollectionRateRegisterRecord {
  patientId: string;
  patientName: string;
  mrn: string;
  department: string;
  doctorName: string;
  visitType: string;
  billedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentStatus: string;
}

// /api/v1/admin/reports/collection-rate/activity-trend returns array of { period, consultations, billedAmount, collectedAmount }
export interface CollectionRateActivityTrendPoint {
  period: string;
  consultations: number;
  billedAmount: number;
  collectedAmount: number;
}

// /api/v1/admin/reports/collection-rate/departments returns array of DepartmentContributionDto
export interface CollectionRateDepartmentRecord {
  departmentId: string;
  departmentName: string;
  consultations: number;
  billedAmount: number;
  collectedAmount: number;
  collectionRate: number;
}

// /api/v1/admin/reports/collection-rate/status-share returns array of CollectionStatusShareDto
export interface PaymentStatusShareRecord {
  status: string;
  count: number;
  amount: number;
  percentage: number;
}

// ─── Doctor Performance & Workload ─────────────────────────────────────────

export interface DoctorSummaryMetrics {
  totalDoctors: number;
  activeDoctors: number;
  onLeaveDoctors: number;
  totalConsultations: number;
  completedConsultations: number;
  pendingConsultations: number;
  cancelledConsultations: number;
  followUpConsultations: number;
  averageConsultationDurationMinutes: number;
  avgConsultationDurationMinutes: number;
  avgConsultationsPerDoctor: number;
  doctorUtilizationPercentage: number;
  patientSatisfaction: number | null;
  totalAppointments: number;
  totalCompleted: number;
  totalCancelled: number;
  totalRevenue: number;
}

export interface DoctorPerformanceItemDto {
  doctorId: string;
  doctorName: string;
  department: string;
  departmentName: string;
  appointments: number;
  completed: number;
  pending: number;
  cancelled: number;
  followUps: number;
  averageDurationMinutes: number;
  avgDurationMinutes: number;
  rating: number | null;
  totalConsultations: number;
  completedConsultations: number;
  cancelledConsultations: number;
  totalRevenueGenerated: number;
}

export type DoctorPerformanceTableRow = DoctorPerformanceItemDto;

export interface DoctorPerformancePaginatedData {
  summary: DoctorSummaryMetrics;
  content: DoctorPerformanceItemDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface DoctorInfo {
  doctorId: string;
  doctorName: string;
  department: string;
}

export interface DoctorIndividualPerformance {
  doctor: DoctorInfo;
  appointments: number;
  completed: number;
  pending: number;
  cancelled: number;
  followUps: number;
  averageDurationMinutes: number;
  rating: number | null;
  utilizationPercentage: number;
}

export interface DoctorActivityRecord {
  activityId: string;
  doctorId: string;
  activityType: string;
  patientId: string;
  appointmentId: string;
  timestamp: string;
  description: string;
}

export interface DoctorWorkloadRecord {
  doctorId: string;
  doctorName: string;
  completedConsultations: number;
  totalAppointments: number;
}

export interface DoctorWorkloadResponse {
  doctors: DoctorWorkloadRecord[];
}

export interface ConsultationTrendDataPoint {
  date: string;
  completed: number;
  pending: number;
}

export interface ConsultationDurationPoint {
  date: string;
  averageDurationMinutes: number;
}

export interface ConsultationStatusRecord {
  status: string;
  count: number;
  percentage: number;
}

// ─── Hospital Invoices & Summaries ─────────────────────────────────────────

export interface HospitalInvoiceRecord {
  billId: number;
  invoiceNumber: string;
  patientName: string;
  patientMrn: string;
  amount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export interface HospitalInvoicesPageResponse {
  content: HospitalInvoiceRecord[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface HospitalInvoiceSummaryData {
  totalInvoices: number;
  paid: number;
  pending: number;
  voidInvoices: number;
  collectionRate: number;
}

// ─── Hospital Appointments ─────────────────────────────────────────────────

export interface DailyAppointmentSummary {
  date: string;
  total: number;
  percentageChange: number;
  previousDayTotal: number;
  done: number;
  cancelled: number;
  pending: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  pendingAppointments: number;
}

export interface DailyAppointmentDetail {
  appointmentId: number;
  appointmentNumber: string;
  patientName: string;
  mrn?: string;
  patientId?: number;
  doctorName: string;
  department?: string;
  departmentName?: string;
  appointmentDate: string;
  date?: string;
  appointmentTime?: string;
  startTime?: string;
  visitType?: string;
  appointmentType?: string;
  queueNumber?: string;
  status: string;
  durationMinutes?: number;
  consultationId?: string;
  consultationTime?: string;
}

export interface AdminAppointmentsResponse {
  totalAppointments: number;
  completed: number;
  booked: number;
  cancelled: number;
  noShow: number;
  content: AdminAppointmentRecord[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminAppointmentRecord {
  appointmentId: string;
  appointmentNumber: string;
  patientName: string;
  mrn: string;
  doctorName: string;
  departmentName: string;
  appointmentDate: string;
  startTime: string;
  status: string;
  appointmentType: string;
}
